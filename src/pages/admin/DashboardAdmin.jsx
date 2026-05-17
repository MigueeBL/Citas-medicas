import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  collection, getDocs, query, where,
  Timestamp, orderBy
} from "firebase/firestore";
import { db } from "../../firebase/config.js"; // ajusta la ruta a tu config de Firebase

// ─── Colores del tema ───────────────────────────────────────────────────────
const BLUE    = "#185FA5";
const BLUE_LT = "#B5D4F4";
const TEAL    = "#1D9E75";
const AMBER   = "#EF9F27";
const GRAY    = "#B4B2A9";

const PIE_COLORS = [BLUE, BLUE_LT, TEAL, AMBER, GRAY];

// ─── Helpers ────────────────────────────────────────────────────────────────
function getFirstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getWeekLabel(fecha) {
  const day = fecha.toDate ? fecha.toDate().getDate() : new Date(fecha).getDate();
  if (day <= 7)  return "S1";
  if (day <= 14) return "S2";
  if (day <= 21) return "S3";
  return "S4";
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, subColor, iconBg, iconColor }) {
  return (
    <div style={styles.metricCard}>
      <div style={{ ...styles.metricIcon, background: iconBg }}>
        <span style={{ fontSize: 20, color: iconColor }}>{icon}</span>
      </div>
      <p style={styles.metricLabel}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
      {sub && (
        <p style={{ ...styles.metricSub, color: subColor || "#888" }}>{sub}</p>
      )}
    </div>
  );
}

function SectionCard({ title, action, onAction, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
        {action && (
          <button style={styles.cardAction} onClick={onAction}>
            {action} →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [loading, setLoading]         = useState(true);
  const [metrics, setMetrics]         = useState({
    totalCitas: 0,
    ingresosMes: 0,
    medicosActivos: 0,
    pacientes: 0,
    medicosPendientes: 0,
    nuevosPacientes: 0,
  });
  const [citasPorSemana, setCitasPorSemana] = useState([
    { semana: "S1", citas: 0 },
    { semana: "S2", citas: 0 },
    { semana: "S3", citas: 0 },
    { semana: "S4", citas: 0 },
  ]);
  const [especialidades, setEspecialidades] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const inicioMes = Timestamp.fromDate(getFirstDayOfMonth());

      // ── Citas del mes ──────────────────────────────────────────────────
      const citasSnap = await getDocs(
        query(
          collection(db, "citas"),
          where("fecha", ">=", inicioMes)
        )
      );
      const citas = citasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Agrupar por semana
      const semanasMap = { S1: 0, S2: 0, S3: 0, S4: 0 };
      citas.forEach((c) => {
        const s = getWeekLabel(c.fecha);
        semanasMap[s] = (semanasMap[s] || 0) + 1;
      });
      setCitasPorSemana(
        Object.entries(semanasMap).map(([semana, citasN]) => ({ semana, citas: citasN }))
      );

      // ── Pagos del mes ──────────────────────────────────────────────────
      const pagosSnap = await getDocs(
        query(
          collection(db, "pagos"),
          where("fecha", ">=", inicioMes)
        )
      );
      const ingresosMes = pagosSnap.docs.reduce(
        (acc, d) => acc + (d.data().monto || 0),
        0
      );

      // ── Médicos ────────────────────────────────────────────────────────
      const medicosSnap = await getDocs(collection(db, "medicos"));
      const medicos = medicosSnap.docs.map((d) => d.data());
      const medicosActivos    = medicos.filter((m) => m.activo && m.validado).length;
      const medicosPendientes = medicos.filter((m) => !m.validado).length;

      // Especialidades para la gráfica de dona
      const espMap = {};
      medicos.forEach((m) => {
        const esp = m.especialidad || "Otras";
        espMap[esp] = (espMap[esp] || 0) + 1;
      });
      setEspecialidades(
        Object.entries(espMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // ── Pacientes ──────────────────────────────────────────────────────
      const pacientesSnap = await getDocs(
        query(collection(db, "usuarios"), where("rol", "==", "paciente"))
      );
      const pacientes = pacientesSnap.docs.map((d) => d.data());

      const unaSemanaAtras = new Date();
      unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
      const tsUnaSemana = Timestamp.fromDate(unaSemanaAtras);
      const nuevosPacientes = pacientes.filter(
        (p) => p.fechaRegistro && p.fechaRegistro >= tsUnaSemana
      ).length;

      setMetrics({
        totalCitas: citas.length,
        ingresosMes,
        medicosActivos,
        medicosPendientes,
        pacientes: pacientes.length,
        nuevosPacientes,
      });
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  // ── Tooltip personalizado para BarChart ───────────────────────────────────
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={styles.tooltip}>
          <p style={styles.tooltipLabel}>{label}</p>
          <p style={{ color: BLUE, fontWeight: 500 }}>{payload[0].value} citas</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={{ color: "#888", marginTop: 12 }}>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard general</h1>
          <p style={styles.pageSubtitle}>
            Resumen del mes · {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchDashboardData}>
          ↻ Actualizar
        </button>
      </div>

      {/* ── Métricas ──────────────────────────────────────────────────── */}
      <div style={styles.metricsGrid}>
        <MetricCard
          icon="📅"
          label="Citas este mes"
          value={metrics.totalCitas}
          sub="↑ Actualizado en tiempo real"
          subColor={TEAL}
          iconBg="#E6F1FB"
          iconColor={BLUE}
        />
        <MetricCard
          icon="💰"
          label="Ingresos totales"
          value={`$${metrics.ingresosMes.toLocaleString("es-MX")}`}
          sub="Suma de pagos del mes"
          subColor={TEAL}
          iconBg="#EAF3DE"
          iconColor="#3B6D11"
        />
        <MetricCard
          icon="🩺"
          label="Médicos activos"
          value={metrics.medicosActivos}
          sub={`${metrics.medicosPendientes} pendientes de validar`}
          subColor={metrics.medicosPendientes > 0 ? "#854F0B" : TEAL}
          iconBg="#FAEEDA"
          iconColor="#854F0B"
        />
        <MetricCard
          icon="👥"
          label="Pacientes registrados"
          value={metrics.pacientes}
          sub={`+${metrics.nuevosPacientes} nuevos esta semana`}
          subColor={TEAL}
          iconBg="#E1F5EE"
          iconColor="#0F6E56"
        />
      </div>

      {/* ── Gráficas ──────────────────────────────────────────────────── */}
      <div style={styles.chartsRow}>
        {/* Barras: citas por semana */}
        <SectionCard title="Citas por semana">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={citasPorSemana} barSize={36}>
              <XAxis
                dataKey="semana"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0f4f9" }} />
              <Bar dataKey="citas" radius={[6, 6, 0, 0]}>
                {citasPorSemana.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.citas === Math.max(...citasPorSemana.map((c) => c.citas))
                        ? BLUE
                        : BLUE_LT
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Dona: especialidades */}
        <SectionCard title="Especialidades">
          {especialidades.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", paddingTop: 40 }}>
              Sin datos
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={especialidades}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {especialidades.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} médicos`, name]}
                  contentStyle={styles.tooltip}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 12, color: "#555" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = {
  page: {
    padding: "24px",
    background: "#f0f4f9",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#1a1a2e",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  refreshBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: `1px solid ${BLUE}`,
    background: "white",
    color: BLUE,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
    marginBottom: 20,
  },
  metricCard: {
    background: "white",
    borderRadius: 12,
    border: "0.5px solid #e5e7eb",
    padding: "16px 18px",
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: "#888",
    margin: "0 0 4px",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 600,
    color: "#1a1a2e",
    margin: 0,
  },
  metricSub: {
    fontSize: 11,
    marginTop: 4,
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 14,
  },
  card: {
    background: "white",
    borderRadius: 12,
    border: "0.5px solid #e5e7eb",
    padding: "18px 20px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  cardAction: {
    fontSize: 12,
    color: BLUE,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  tooltip: {
    background: "white",
    border: "0.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
  },
  tooltipLabel: {
    color: "#888",
    marginBottom: 4,
    fontSize: 12,
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
  },
  spinner: {
    width: 36,
    height: 36,
    border: `3px solid ${BLUE_LT}`,
    borderTop: `3px solid ${BLUE}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};