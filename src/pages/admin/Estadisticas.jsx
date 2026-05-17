import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
    PieChart, Pie, Cell, Legend, Tooltip,
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid
} from "recharts";
import jsPDF from "jspdf";

const BLUE = "#185FA5";
const COLORS = ["#185FA5", "#B5D4F4", "#1D9E75", "#EF9F27", "#B4B2A9", "#E24B4A"];

// ─── Exportar CSV ────────────────────────────────────────────────────────────
function exportarCSV(datos) {
    const { conteos, especialidadesTodos, especialidadesAprobados, ingresosCitas, ingresosMes } = datos;

    const fecha = new Date().toLocaleDateString("es-MX");

    let csv = `ESTADÍSTICAS GENERALES - ${fecha}\n\n`;
    csv += "USUARIOS\n";
    csv += "Rol,Cantidad\n";
    csv += `Médicos totales,${conteos.medicos}\n`;
    csv += `Médicos aprobados,${conteos.medicosAprobados}\n`;
    csv += `Médicos pendientes,${conteos.medicosPendientes}\n`;
    csv += `Pacientes,${conteos.pacientes}\n`;
    csv += `Asistentes,${conteos.asistentes}\n`;
    csv += `\nINGRESOS DEL MES\n`;
    csv += `Total de citas,${ingresosCitas}\n`;
    csv += `Ingresos estimados,$${ingresosMes.toLocaleString("es-MX")}\n`;
    csv += `\nESPECIALIDADES (todos los médicos)\n`;
    csv += "Especialidad,Médicos\n";
    especialidadesTodos.forEach((e) => { csv += `${e.name},${e.value}\n`; });
    csv += `\nESPECIALIDADES (médicos aprobados)\n`;
    csv += "Especialidad,Médicos\n";
    especialidadesAprobados.forEach((e) => { csv += `${e.name},${e.value}\n`; });

    // BOM para que Excel muestre acentos correctamente
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estadisticas_${fecha.replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}


// ─── Exportar PDF (usando print CSS) ────────────────────────────────────────
function exportarPDF(datos) {
    const { conteos, especialidadesTodos, especialidadesAprobados, ingresosCitas, ingresosMes } = datos;
    const doc = new jsPDF();
    const BLUE = [24, 95, 165];
    const GRAY = [100, 100, 100];
    const BLACK = [30, 30, 30];
    const fecha = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    let y = 20;

    // ── Encabezado ─────────────────────────────────────────────────────────────
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Citas Medicas — Estadisticas", 14, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el ${fecha}`, 14, 24);
    y = 44;

    // ── Función helpers ─────────────────────────────────────────────────────────
    function seccion(titulo) {
        doc.setFillColor(235, 242, 250);
        doc.rect(10, y - 5, 190, 10, "F");
        doc.setTextColor(...BLUE);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(titulo, 14, y + 1);
        y += 10;
    }

    function fila(label, value, alt = false) {
        if (alt) {
            doc.setFillColor(248, 250, 252);
            doc.rect(10, y - 4, 190, 8, "F");
        }
        doc.setTextColor(...BLACK);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(label, 16, y + 1);
        doc.setFont("helvetica", "bold");
        doc.text(String(value), 120, y + 1);
        y += 9;
    }

    function lineaDivisora() {
        doc.setDrawColor(220, 220, 220);
        doc.line(10, y, 200, y);
        y += 6;
    }

    // ── Usuarios ───────────────────────────────────────────────────────────────
    seccion("USUARIOS REGISTRADOS");
    fila("Medicos totales", conteos.medicos, false);
    fila("Medicos aprobados", conteos.medicosAprobados, true);
    fila("Medicos pendientes", conteos.medicosPendientes, false);
    fila("Pacientes", conteos.pacientes, true);
    fila("Asistentes", conteos.asistentes, false);
    y += 4;
    lineaDivisora();

    // ── Ingresos ───────────────────────────────────────────────────────────────
    seccion("INGRESOS DEL MES");
    fila("Total de citas", ingresosCitas, false);
    fila("Ingresos estimados", `$${ingresosMes.toLocaleString("es-MX")}`, true);
    y += 4;
    lineaDivisora();

    // ── Especialidades todos ───────────────────────────────────────────────────
    seccion("ESPECIALIDADES — TODOS LOS MEDICOS");
    especialidadesTodos.forEach((e, i) => fila(e.name, `${e.value} medico(s)`, i % 2 !== 0));
    y += 4;
    lineaDivisora();

    // ── Especialidades aprobados ───────────────────────────────────────────────
    seccion("ESPECIALIDADES — MEDICOS APROBADOS");
    if (especialidadesAprobados.length === 0) {
        doc.setTextColor(...GRAY);
        doc.setFontSize(10);
        doc.text("Sin medicos aprobados", 16, y);
        y += 10;
    } else {
        especialidadesAprobados.forEach((e, i) => fila(e.name, `${e.value} medico(s)`, i % 2 !== 0));
    }
    y += 4;

    // ── Footer ─────────────────────────────────────────────────────────────────
    doc.setFillColor(...BLUE);
    doc.rect(0, 282, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Citas Medicas © 2026 — Documento generado automaticamente", 14, 291);

    doc.save(`estadisticas_${new Date().toLocaleDateString("es-MX").replace(/\//g, "-")}.pdf`);
}

// ─── Componentes pequeños ────────────────────────────────────────────────────
function StatCard({ label, value, color, bg, sub }) {
    return (
        <div style={{ background: bg, borderRadius: 12, padding: "16px 20px", flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color, marginTop: 2, fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color, opacity: 0.7, marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <div style={styles.card}>
            <h2 style={styles.cardTitle}>{title}</h2>
            {children}
        </div>
    );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Estadisticas() {
    const [loading, setLoading] = useState(true);
    const [conteos, setConteos] = useState({
        medicos: 0, medicosAprobados: 0, medicosPendientes: 0,
        pacientes: 0, asistentes: 0,
    });
    const [especialidadesTodos, setEspecialidadesTodos] = useState([]);
    const [especialidadesAprobados, setEspecialidadesAprobados] = useState([]);
    const [ingresosCitas, setIngresosCitas] = useState(0);
    const [ingresosMes, setIngresosMes] = useState(0);
    const [citasPorEstado, setCitasPorEstado] = useState([]);

    useEffect(() => { fetchEstadisticas(); }, []);

    async function fetchEstadisticas() {
        setLoading(true);
        try {
            // ── Usuarios por rol ───────────────────────────────────────────
            const usuariosSnap = await getDocs(collection(db, "usuarios"));
            const usuarios = usuariosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

            const medicos = usuarios.filter((u) => u.rol === "medico");
            const medicosAprobados = medicos.filter((m) => m.estado === "aprobado");
            const medicosPendientes = medicos.filter((m) => m.estado === "pendiente");
            const pacientes = usuarios.filter((u) => u.rol === "paciente");
            const asistentes = usuarios.filter((u) => u.rol === "asistente");

            setConteos({
                medicos: medicos.length,
                medicosAprobados: medicosAprobados.length,
                medicosPendientes: medicosPendientes.length,
                pacientes: pacientes.length,
                asistentes: asistentes.length,
            });

            // Especialidades — todos los médicos
            const espTodos = {};
            medicos.forEach((m) => {
                const esp = m.especialidad || "Sin especialidad";
                espTodos[esp] = (espTodos[esp] || 0) + 1;
            });
            setEspecialidadesTodos(
                Object.entries(espTodos).map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
            );

            // Especialidades — solo aprobados
            const espAprobados = {};
            medicosAprobados.forEach((m) => {
                const esp = m.especialidad || "Sin especialidad";
                espAprobados[esp] = (espAprobados[esp] || 0) + 1;
            });
            setEspecialidadesAprobados(
                Object.entries(espAprobados).map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
            );

            // ── Citas ──────────────────────────────────────────────────────
            const citasSnap = await getDocs(collection(db, "citas"));
            const citas = citasSnap.docs.map((d) => d.data());

            // Citas del mes actual
            const hoy = new Date();
            const citasMes = citas.filter((c) => {
                if (!c.fecha) return false;
                const f = new Date(c.fecha);
                return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
            });
            setIngresosCitas(citasMes.length);

            // Ingresos estimados (monto de citas del mes)
            const total = citasMes.reduce((acc, c) => acc + (c.monto || 0), 0);
            setIngresosMes(total);

            // Citas por estado
            const estadoMap = {};
            citasMes.forEach((c) => {
                const est = c.estado || "sin estado";
                estadoMap[est] = (estadoMap[est] || 0) + 1;
            });
            setCitasPorEstado(
                Object.entries(estadoMap).map(([estado, total]) => ({ estado, total }))
            );

        } catch (err) {
            console.error("Error cargando estadísticas:", err);
        } finally {
            setLoading(false);
        }
    }

    const datosExport = {
        conteos, especialidadesTodos, especialidadesAprobados,
        ingresosCitas, ingresosMes,
    };

    if (loading) {
        return <div style={styles.loading}>Cargando estadísticas...</div>;
    }

    return (
        <div style={styles.page}>
            {/* Encabezado */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Estadísticas</h1>
                    <p style={styles.subtitle}>
                        Resumen general · {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button style={styles.btnSecundario} onClick={() => exportarCSV(datosExport)}>
                        📥 Exportar CSV
                    </button>
                    <button onClick={() => exportarPDF(datosExport)}>📄 Exportar PDF</button>
                </div>
            </div>

            {/* Conteos por rol */}
            <SectionCard title="Usuarios registrados">
                <div style={styles.statsRow}>
                    <StatCard label="Médicos totales" value={conteos.medicos} color={BLUE} bg="#E6F1FB"
                        sub={`${conteos.medicosAprobados} aprobados · ${conteos.medicosPendientes} pendientes`} />
                    <StatCard label="Médicos aprobados" value={conteos.medicosAprobados} color="#27500A" bg="#EAF3DE" />
                    <StatCard label="Médicos pendientes" value={conteos.medicosPendientes} color="#633806" bg="#FAEEDA" />
                    <StatCard label="Pacientes" value={conteos.pacientes} color="#0F6E56" bg="#E1F5EE" />
                    <StatCard label="Asistentes" value={conteos.asistentes} color="#6B3FA0" bg="#F0E8FB" />
                </div>
            </SectionCard>

            {/* Ingresos del mes */}
            <SectionCard title="Ingresos del mes">
                <div style={styles.statsRow}>
                    <StatCard label="Citas este mes" value={ingresosCitas} color={BLUE} bg="#E6F1FB" />
                    <StatCard label="Ingresos estimados" value={`$${ingresosMes.toLocaleString("es-MX")}`} color="#27500A" bg="#EAF3DE"
                        sub="Suma del campo monto en citas" />
                </div>
            </SectionCard>

            {/* Gráficas de especialidades */}
            <div style={styles.chartsRow}>
                <SectionCard title="Especialidades — todos los médicos">
                    {especialidadesTodos.length === 0 ? (
                        <p style={styles.empty}>Sin datos</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={especialidadesTodos} cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {especialidadesTodos.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [`${v} médicos`, n]} contentStyle={styles.tooltip} />
                                <Legend iconType="circle" iconSize={8}
                                    formatter={(v) => <span style={{ fontSize: 12, color: "#555" }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>

                <SectionCard title="Especialidades — médicos aprobados">
                    {especialidadesAprobados.length === 0 ? (
                        <p style={styles.empty}>Sin médicos aprobados</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={especialidadesAprobados} cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {especialidadesAprobados.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [`${v} médicos`, n]} contentStyle={styles.tooltip} />
                                <Legend iconType="circle" iconSize={8}
                                    formatter={(v) => <span style={{ fontSize: 12, color: "#555" }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>
            </div>

            {/* Citas por estado */}
            {citasPorEstado.length > 0 && (
                <SectionCard title="Citas por estado — mes actual">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={citasPorEstado} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="estado" axisLine={false} tickLine={false}
                                tick={{ fontSize: 12, fill: "#888" }} />
                            <YAxis axisLine={false} tickLine={false}
                                tick={{ fontSize: 12, fill: "#888" }} allowDecimals={false} />
                            <Tooltip
                                formatter={(v) => [`${v} citas`, "Total"]}
                                contentStyle={styles.tooltip}
                            />
                            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                {citasPorEstado.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </SectionCard>
            )}

            {/* Estilos de impresión para PDF */}
            <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
        </div>
    );
}

const styles = {
    page: { padding: "24px", background: "#f0f4f9", minHeight: "100vh", fontFamily: "sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 },
    subtitle: { fontSize: 13, color: "#888", marginTop: 4 },
    btnPrimario: { padding: "9px 16px", borderRadius: 8, border: "none", background: BLUE, color: "white", fontSize: 13, cursor: "pointer", fontWeight: 500 },
    btnSecundario: { padding: "9px 16px", borderRadius: 8, border: `1px solid ${BLUE}`, background: "white", color: BLUE, fontSize: 13, cursor: "pointer", fontWeight: 500 },
    statsRow: { display: "flex", gap: 12 },
    chartsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
    card: { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "18px 20px", marginBottom: 14 },
    cardTitle: { fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 16, marginTop: 0 },
    tooltip: { background: "white", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13 },
    empty: { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 },
    loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#888" },
};