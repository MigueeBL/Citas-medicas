import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";

const BLUE = "#185FA5";
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export default function Medicos() {
    const [medicos, setMedicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("validar"); // "validar" | "horarios"
    const [filtro, setFiltro] = useState("todos");
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => { fetchMedicos(); }, []);

    async function fetchMedicos() {
        setLoading(true);
        const snap = await getDocs(
            query(collection(db, "usuarios"), where("rol", "==", "medico"))
        );
        setMedicos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
    }

    async function cambiarEstado(medico, nuevoEstado) {
        await updateDoc(doc(db, "usuarios", medico.id), { estado: nuevoEstado });
        setMedicos((prev) =>
            prev.map((m) => m.id === medico.id ? { ...m, estado: nuevoEstado } : m)
        );
    }

    const filtered = medicos
        .filter((m) => {
            if (filtro === "pendiente") return m.estado === "pendiente";
            if (filtro === "aprobado") return m.estado === "aprobado";
            if (filtro === "rechazado") return m.estado === "rechazado";
            return true;
        })
        .filter((m) => {
            const q = busqueda.toLowerCase();
            return (
                m.nombre?.toLowerCase().includes(q) ||
                m.especialidad?.toLowerCase().includes(q) ||
                m.cedula?.includes(q)
            );
        });

    const pendientes = medicos.filter((m) => m.estado === "pendiente").length;
    const aprobados = medicos.filter((m) => m.estado === "aprobado").length;
    const rechazados = medicos.filter((m) => m.estado === "rechazado").length;

    return (
        <div>
            {/* Encabezado */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Médicos</h1>
                    <p style={styles.subtitle}>Gestión, validación y horarios</p>
                </div>
                <div style={styles.stats}>
                    <Stat label="Total" value={medicos.length} color={BLUE} bg="#E6F1FB" />
                    <Stat label="Aprobados" value={aprobados} color="#27500A" bg="#EAF3DE" />
                    <Stat label="Pendientes" value={pendientes} color="#633806" bg="#FAEEDA" />
                    <Stat label="Rechazados" value={rechazados} color="#A32D2D" bg="#FCEBEB" />
                </div>
            </div>

            {/* Tabs */}
            <div style={styles.tabsWrap}>
                <button
                    style={{ ...styles.tabBtn, ...(tab === "validar" ? styles.tabBtnActive : {}) }}
                    onClick={() => setTab("validar")}
                >
                    ✅ Validar cédulas
                </button>
                <button
                    style={{ ...styles.tabBtn, ...(tab === "horarios" ? styles.tabBtnActive : {}) }}
                    onClick={() => setTab("horarios")}
                >
                    🕐 Horarios
                </button>
            </div>

            {/* Buscador y filtros — solo en validar */}
            {tab === "validar" && (
                <div style={styles.toolbar}>
                    <input
                        style={styles.search}
                        placeholder="Buscar por nombre, especialidad o cédula..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    <div style={styles.filtros}>
                        {["todos", "pendiente", "aprobado", "rechazado"].map((f) => (
                            <button
                                key={f}
                                style={{ ...styles.filtroBtn, ...(filtro === f ? styles.filtroBtnActive : {}) }}
                                onClick={() => setFiltro(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <p style={styles.empty}>Cargando médicos...</p>
            ) : tab === "validar" ? (
                // ── Tab validar ─────────────────────────────────────────────────────
                <div style={styles.card}>
                    {filtered.length === 0 ? (
                        <p style={styles.empty}>No se encontraron médicos.</p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {["Médico", "Cédula", "Especialidad", "Documento", "Estado", "Acciones"].map((h) => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m) => (
                                    <tr key={m.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.medicoCell}>
                                                <div style={styles.avatar}>{m.nombre?.[0] ?? "?"}</div>
                                                <div>
                                                    <div style={styles.medicoNombre}>{m.nombre}</div>
                                                    <div style={styles.medicoEmail}>{m.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 13 }}>
                                            {m.cedula ?? "—"}
                                        </td>
                                        <td style={styles.td}>{m.especialidad ?? "—"}</td>
                                        <td style={styles.td}>
                                            {m.urlCedula ? (
                                                <a href={m.urlCedula} target="_blank" rel="noreferrer" style={styles.verLink}>
                                                    📄 Ver documento
                                                </a>
                                            ) : (
                                                <span style={{ color: "#aaa", fontSize: 12 }}>Sin documento</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, ...estadoStyle(m.estado) }}>
                                                {estadoLabel(m.estado)}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                {m.estado !== "aprobado" && (
                                                    <button style={{ ...styles.btn, ...styles.btnGreen }}
                                                        onClick={() => cambiarEstado(m, "aprobado")}>
                                                        ✔ Aprobar
                                                    </button>
                                                )}
                                                {m.estado !== "rechazado" && (
                                                    <button style={{ ...styles.btn, ...styles.btnRed }}
                                                        onClick={() => cambiarEstado(m, "rechazado")}>
                                                        ✖ Rechazar
                                                    </button>
                                                )}
                                                {m.estado !== "pendiente" && (
                                                    <button style={{ ...styles.btn, ...styles.btnGray }}
                                                        onClick={() => cambiarEstado(m, "pendiente")}>
                                                        ↺ Pendiente
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                // ── Tab horarios ─────────────────────────────────────────────────────
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {medicos.length === 0 ? (
                        <p style={styles.empty}>No hay médicos registrados.</p>
                    ) : (
                        medicos.map((m) => {
                            console.log("Horarios de", m.nombre, ":", m.horarios);
                            console.log("Keys:", Object.keys(m.horarios ?? {}));
                            return (
                                <div key={m.id} style={styles.horarioCard}>
                                    {/* Info médico */}
                                    <div style={styles.horarioHeader}>
                                        <div style={styles.medicoCell}>
                                            <div style={{ ...styles.avatar, width: 40, height: 40, fontSize: 15 }}>
                                                {m.nombre?.[0] ?? "?"}
                                            </div>
                                            <div>
                                                <div style={styles.medicoNombre}>{m.nombre}</div>
                                                <div style={styles.medicoEmail}>{m.especialidad ?? "Sin especialidad"}</div>
                                            </div>
                                        </div>
                                        <span style={{ ...styles.badge, ...estadoStyle(m.estado) }}>
                                            {estadoLabel(m.estado)}
                                        </span>
                                    </div>

                                    {/* Horarios */}
                                    {!m.horarios || Object.keys(m.horarios).length === 0 ? (
                                        <p style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>
                                            Sin horarios registrados
                                        </p>
                                    ) : (
                                        <div style={styles.horariosGrid}>
                                            {DIAS.map((dia) => {
                                                const horas = m.horarios?.[dia] ??
                                                    m.horarios?.[Object.keys(m.horarios ?? {}).find(
                                                        k => k.toLowerCase() === dia.toLowerCase()
                                                    )];
                                                return (
                                                    <div
                                                        key={dia}
                                                        style={{
                                                            ...styles.diaCard,
                                                            ...(horas && horas.length > 0 ? styles.diaCardActivo : styles.diaCardVacio),
                                                        }}
                                                    >
                                                        <div style={styles.diaNombre}>{dia.slice(0, 3).toUpperCase()}</div>
                                                        {horas && horas.length > 0 ? (
                                                            <>
                                                                <div style={styles.diaHora}>{horas[0]}</div>
                                                                <div style={styles.diaSep}>—</div>
                                                                <div style={styles.diaHora}>{horas[horas.length - 1]}</div>
                                                            </>
                                                        ) : (
                                                            <div style={styles.diaLibre}>No disponible</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function estadoLabel(estado) {
    const map = { aprobado: "✔ Aprobado", pendiente: "⏳ Pendiente", rechazado: "✖ Rechazado" };
    return map[estado] ?? estado ?? "—";
}

function estadoStyle(estado) {
    const map = {
        aprobado: { background: "#EAF3DE", color: "#27500A" },
        pendiente: { background: "#FAEEDA", color: "#633806" },
        rechazado: { background: "#FCEBEB", color: "#A32D2D" },
    };
    return map[estado] ?? { background: "#f3f4f6", color: "#888" };
}

function Stat({ label, value, color, bg }) {
    return (
        <div style={{ background: bg, borderRadius: 10, padding: "10px 16px", textAlign: "center", minWidth: 70 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color }}>{label}</div>
        </div>
    );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 },
    subtitle: { fontSize: 13, color: "#888", marginTop: 4 },
    stats: { display: "flex", gap: 10 },
    tabsWrap: { display: "flex", gap: 4, marginBottom: 16, borderBottom: "0.5px solid #e5e7eb", paddingBottom: 0 },
    tabBtn: { padding: "10px 20px", borderRadius: "8px 8px 0 0", border: "0.5px solid #e5e7eb", borderBottom: "none", background: "#f3f4f6", fontSize: 13, cursor: "pointer", color: "#555", fontWeight: 500 },
    tabBtnActive: { background: "white", color: BLUE, borderColor: "#e5e7eb", fontWeight: 600 },
    toolbar: { display: "flex", gap: 12, marginBottom: 16, alignItems: "center" },
    search: { flex: 1, padding: "9px 14px", borderRadius: 8, border: "0.5px solid #d1d5db", fontSize: 13, outline: "none" },
    filtros: { display: "flex", gap: 4 },
    filtroBtn: { padding: "8px 14px", borderRadius: 8, border: "0.5px solid #d1d5db", background: "white", fontSize: 13, cursor: "pointer", color: "#555" },
    filtroBtnActive: { background: BLUE, color: "white", border: `0.5px solid ${BLUE}` },
    card: { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", overflow: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "0.5px solid #e5e7eb", whiteSpace: "nowrap" },
    tr: { borderBottom: "0.5px solid #f3f4f6" },
    td: { padding: "12px 16px", color: "#1a1a2e", verticalAlign: "middle" },
    medicoCell: { display: "flex", alignItems: "center", gap: 10 },
    avatar: { width: 34, height: 34, borderRadius: "50%", background: "#E6F1FB", color: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 },
    medicoNombre: { fontWeight: 500, fontSize: 13 },
    medicoEmail: { fontSize: 11, color: "#888" },
    badge: { fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 },
    verLink: { fontSize: 12, color: BLUE, textDecoration: "none", fontWeight: 500 },
    btn: { fontSize: 11, padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" },
    btnGreen: { background: "#EAF3DE", color: "#27500A" },
    btnRed: { background: "#FCEBEB", color: "#A32D2D" },
    btnGray: { background: "#f3f4f6", color: "#555" },
    empty: { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 },
    horarioCard: { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "18px 20px" },
    horarioHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    horariosGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginTop: 8 },
    diaCard: { borderRadius: 8, padding: "10px 6px", textAlign: "center" },
    diaCardActivo: { background: "#E6F1FB", border: `1px solid ${BLUE}20` },
    diaCardVacio: { background: "#f9fafb", border: "1px solid #f0f0f0" },
    diaNombre: { fontSize: 10, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: "0.05em" },
    diaHora: { fontSize: 11, fontWeight: 600, color: BLUE },
    diaSep: { fontSize: 10, color: "#aaa", margin: "2px 0" },
    diaLibre: { fontSize: 11, color: "#ccc", marginTop: 4 },
};
