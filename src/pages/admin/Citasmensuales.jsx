import { useState, useEffect } from "react";
import { getCitasDelMes } from "../../models/Citas";
import { db } from "../../firebase/config";
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from "recharts";

const BLUE = "#185FA5";
const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function CitasMensuales() {
    const hoy = new Date();
    const [mes, setMes] = useState(hoy.getMonth());
    const [anio, setAnio] = useState(hoy.getFullYear());
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [diasData, setDiasData] = useState([]);

    useEffect(() => { fetchCitas(); }, [mes, anio]);

    async function fetchCitas() {
        setLoading(true);
        try {
            const data = await getCitasDelMes(mes, anio);
            setCitas(data);

            const diasEnMes = new Date(anio, mes + 1, 0).getDate();
            const diasMap = {};
            for (let d = 1; d <= diasEnMes; d++) diasMap[d] = 0;
            data.forEach((c) => {
                const dia = c.fecha.toDate().getDate();
                diasMap[dia] = (diasMap[dia] || 0) + 1;
            });
            setDiasData(
                Object.entries(diasMap).map(([dia, total]) => ({ dia: `${dia}`, total }))
            );
        } catch (err) {
            console.error("Error cargando citas:", err);
        } finally {
            setLoading(false);
        }
    }

    const confirmadas = citas.filter((c) => c.estado === "confirmada").length;
    const pendientes = citas.filter((c) => c.estado === "pendiente").length;
    const canceladas = citas.filter((c) => c.estado === "cancelada").length;
    const completadas = citas.filter((c) => c.estado === "completada").length;

    return (
        <div>
            {/* Encabezado */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Citas mensuales</h1>
                    <p style={styles.subtitle}>Reporte de citas por período</p>
                </div>
                <div style={styles.periodSelector}>
                    <select style={styles.select} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                        {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select style={styles.select} value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
                        {[2024, 2025, 2026].map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            {/* Métricas rápidas */}
            <div style={styles.metricsRow}>
                <MetricChip label="Total" value={citas.length} color={BLUE} bg="#E6F1FB" />
                <MetricChip label="Confirmadas" value={confirmadas} color="#27500A" bg="#EAF3DE" />
                <MetricChip label="Pendientes" value={pendientes} color="#633806" bg="#FAEEDA" />
                <MetricChip label="Canceladas" value={canceladas} color="#A32D2D" bg="#FCEBEB" />
                <MetricChip label="Completadas" value={completadas} color="#0F6E56" bg="#E1F5EE" />
            </div>

            {loading ? (
                <p style={styles.empty}>Cargando citas...</p>
            ) : (
                <>
                    {/* Gráfica de línea por día */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>Citas por día — {MESES[mes]} {anio}</h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={diasData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="dia"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#aaa" }}
                                    interval={2}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#aaa" }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    formatter={(v) => [`${v} citas`, "Total"]}
                                    contentStyle={{ borderRadius: 8, fontSize: 13, border: "0.5px solid #e5e7eb" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke={BLUE}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: BLUE }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Tabla de citas */}
                    {citas.length > 0 && (
                        <div style={{ ...styles.card, marginTop: 14 }}>
                            <h2 style={styles.cardTitle}>Detalle de citas</h2>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        {["Fecha", "Hora", "Paciente", "Médico", "Estado", "Pagado"].map((h) => (
                                            <th key={h} style={styles.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {citas.slice(0, 20).map((c) => (
                                        <tr key={c.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                {c.fecha?.toDate().toLocaleDateString("es-MX")}
                                            </td>
                                            <td style={styles.td}>{c.hora ?? "—"}</td>
                                            <td style={styles.td}>{c.pacienteNombre ?? c.pacienteId ?? "—"}</td>
                                            <td style={styles.td}>{c.medicoNombre ?? c.medicoId ?? "—"}</td>
                                            <td style={styles.td}>
                                                <span style={{ ...styles.badge, ...estadoStyle(c.estado) }}>
                                                    {c.estado ?? "—"}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ ...styles.badge, ...(c.pagado ? styles.badgeOk : styles.badgeNo) }}>
                                                    {c.pagado ? "Sí" : "No"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {citas.length > 20 && (
                                <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: "12px 0 0" }}>
                                    Mostrando 20 de {citas.length} citas
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function MetricChip({ label, value, color, bg }) {
    return (
        <div style={{ background: bg, borderRadius: 10, padding: "12px 18px", textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color, marginTop: 2 }}>{label}</div>
        </div>
    );
}

function estadoStyle(estado) {
    const map = {
        confirmada: { background: "#EAF3DE", color: "#27500A" },
        pendiente: { background: "#FAEEDA", color: "#633806" },
        cancelada: { background: "#FCEBEB", color: "#A32D2D" },
        completada: { background: "#E1F5EE", color: "#0F6E56" },
    };
    return map[estado] ?? { background: "#f3f4f6", color: "#888" };
}

const styles = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 },
    subtitle: { fontSize: 13, color: "#888", marginTop: 4 },
    periodSelector: { display: "flex", gap: 8 },
    select: { padding: "8px 12px", borderRadius: 8, border: "0.5px solid #d1d5db", fontSize: 13, background: "white", cursor: "pointer" },
    metricsRow: { display: "flex", gap: 12, marginBottom: 16 },
    card: { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "18px 20px" },
    cardTitle: { fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 16 },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "0.5px solid #e5e7eb" },
    tr: { borderBottom: "0.5px solid #f3f4f6" },
    td: { padding: "11px 14px", color: "#1a1a2e", verticalAlign: "middle" },
    badge: { fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 },
    badgeOk: { background: "#EAF3DE", color: "#27500A" },
    badgeNo: { background: "#f3f4f6", color: "#888" },
    empty: { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 },
};
