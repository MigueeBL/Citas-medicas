import { useState, useEffect } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
 
const BLUE    = "#185FA5";
const BLUE_LT = "#B5D4F4";
 
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
 
export default function Ingresos() {
  const hoy = new Date();
  const [mes, setMes]       = useState(hoy.getMonth());
  const [anio, setAnio]     = useState(hoy.getFullYear());
  const [datos, setDatos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]   = useState(0);
 
  useEffect(() => { fetchIngresos(); }, [mes, anio]);
 
  async function fetchIngresos() {
    setLoading(true);
    try {
      const inicio = Timestamp.fromDate(new Date(anio, mes, 1));
      const fin    = Timestamp.fromDate(new Date(anio, mes + 1, 0, 23, 59, 59));
 
      // Traer pagos del período
      const pagosSnap = await getDocs(
        query(
          collection(db, "pagos"),
          where("fecha", ">=", inicio),
          where("fecha", "<=", fin)
        )
      );
      const pagos = pagosSnap.docs.map((d) => d.data());
 
      // Traer médicos para obtener nombres
      const medicosSnap = await getDocs(collection(db, "medicos"));
      const medicosMap  = {};
      medicosSnap.docs.forEach((d) => {
        medicosMap[d.id] = d.data();
      });
 
      // Agrupar pagos por médico
      const ingresosMap = {};
      pagos.forEach((p) => {
        const mid = p.medicoId;
        if (!ingresosMap[mid]) {
          ingresosMap[mid] = {
            medicoId:    mid,
            nombre:      medicosMap[mid]?.nombre ?? "Médico desconocido",
            especialidad:medicosMap[mid]?.especialidad ?? "—",
            citas:       0,
            ingresos:    0,
          };
        }
        ingresosMap[mid].citas    += 1;
        ingresosMap[mid].ingresos += p.monto ?? 0;
      });
 
      const resultado = Object.values(ingresosMap).sort((a, b) => b.ingresos - a.ingresos);
      setDatos(resultado);
      setTotal(resultado.reduce((acc, r) => acc + r.ingresos, 0));
    } catch (err) {
      console.error("Error cargando ingresos:", err);
    } finally {
      setLoading(false);
    }
  }
 
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
          <p style={{ color: "#888", marginBottom: 4, fontSize: 12 }}>{label}</p>
          <p style={{ color: BLUE, fontWeight: 600 }}>${payload[0].value.toLocaleString("es-MX")}</p>
        </div>
      );
    }
    return null;
  };
 
  return (
    <div>
      {/* Encabezado */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Ingresos por médico</h1>
          <p style={styles.subtitle}>Reporte de pagos agrupados por médico</p>
        </div>
        {/* Selector de período */}
        <div style={styles.periodSelector}>
          <select style={styles.select} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select style={styles.select} value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
            {[2024, 2025, 2026].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
 
      {/* Total del período */}
      <div style={styles.totalCard}>
        <div style={styles.totalLabel}>Total de ingresos — {MESES[mes]} {anio}</div>
        <div style={styles.totalValue}>${total.toLocaleString("es-MX")}</div>
        <div style={styles.totalSub}>{datos.reduce((a, d) => a + d.citas, 0)} citas cobradas</div>
      </div>
 
      {loading ? (
        <p style={styles.empty}>Cargando ingresos...</p>
      ) : datos.length === 0 ? (
        <p style={styles.empty}>Sin registros de pago para este período.</p>
      ) : (
        <>
          {/* Gráfica de barras */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Ingresos por médico</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datos} barSize={40}>
                <XAxis
                  dataKey="nombre"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#888" }}
                  tickFormatter={(v) => v.split(" ").slice(-1)[0]} // apellido
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#888" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0f4f9" }} />
                <Bar dataKey="ingresos" radius={[6, 6, 0, 0]}>
                  {datos.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? BLUE : BLUE_LT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
 
          {/* Tabla */}
          <div style={{ ...styles.card, marginTop: 14 }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["#", "Médico", "Especialidad", "Citas", "Ingresos", "Promedio/cita"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.map((d, i) => (
                  <tr key={d.medicoId} style={styles.tr}>
                    <td style={{ ...styles.td, color: "#aaa", width: 30 }}>{i + 1}</td>
                    <td style={styles.td}>
                      <div style={styles.medicoCell}>
                        <div style={styles.avatar}>{d.nombre[0]}</div>
                        <span style={{ fontWeight: 500 }}>{d.nombre}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, color: "#555" }}>{d.especialidad}</td>
                    <td style={styles.td}>{d.citas}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: BLUE }}>
                      ${d.ingresos.toLocaleString("es-MX")}
                    </td>
                    <td style={{ ...styles.td, color: "#555" }}>
                      ${Math.round(d.ingresos / d.citas).toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
 
const styles = {
  header:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title:          { fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 },
  subtitle:       { fontSize: 13, color: "#888", marginTop: 4 },
  periodSelector: { display: "flex", gap: 8 },
  select:         { padding: "8px 12px", borderRadius: 8, border: "0.5px solid #d1d5db", fontSize: 13, background: "white", cursor: "pointer" },
  totalCard:      { background: BLUE, borderRadius: 12, padding: "20px 24px", marginBottom: 16, color: "white" },
  totalLabel:     { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  totalValue:     { fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px" },
  totalSub:       { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  card:           { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "18px 20px" },
  cardTitle:      { fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 16 },
  table:          { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:             { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "0.5px solid #e5e7eb" },
  tr:             { borderBottom: "0.5px solid #f3f4f6" },
  td:             { padding: "11px 14px", color: "#1a1a2e", verticalAlign: "middle" },
  medicoCell:     { display: "flex", alignItems: "center", gap: 10 },
  avatar:         { width: 30, height: 30, borderRadius: "50%", background: "#E6F1FB", color: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 },
  empty:          { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 },
};