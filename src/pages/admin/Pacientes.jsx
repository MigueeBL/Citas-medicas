import { useState, useEffect } from "react";
import { getPacientes, eliminarUsuario } from "../../models/Usuarios";
import { db } from "../../firebase/config";

const BLUE = "#185FA5";

export default function Pacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [confirmar, setConfirmar] = useState(null); // paciente a eliminar

    useEffect(() => { fetchPacientes(); }, []);

    async function fetchPacientes() {
        setLoading(true);
        const data = await getPacientes();
        setPacientes(data);
        setLoading(false);
    }

    async function eliminarPaciente(paciente) {
        await eliminarUsuario(paciente.id);
        setPacientes((prev) => prev.filter((p) => p.id !== paciente.id));
        setConfirmar(null);
    }

    const filtered = pacientes.filter((p) => {
        const q = busqueda.toLowerCase();
        return (
            p.nombre?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q)
        );
    });

    return (
        <div>
            {/* Encabezado */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Pacientes</h1>
                    <p style={styles.subtitle}>Lista de pacientes registrados en la plataforma</p>
                </div>
                <div style={styles.totalBadge}>
                    <span style={styles.totalNum}>{pacientes.length}</span>
                    <span style={styles.totalLabel}>registrados</span>
                </div>
            </div>

            {/* Buscador */}
            <input
                style={styles.search}
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />

            {/* Tabla */}
            <div style={styles.card}>
                {loading ? (
                    <p style={styles.empty}>Cargando pacientes...</p>
                ) : filtered.length === 0 ? (
                    <p style={styles.empty}>No se encontraron pacientes.</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {["Paciente", "Correo electrónico", "Fecha de registro", "Acciones"].map((h) => (
                                    <th key={h} style={styles.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={styles.pacienteCell}>
                                            <div style={styles.avatar}>{p.nombre?.[0] ?? "?"}</div>
                                            <span style={styles.nombre}>{p.nombre ?? "Sin nombre"}</span>
                                        </div>
                                    </td>
                                    <td style={{ ...styles.td, color: "#555" }}>{p.email ?? "—"}</td>
                                    <td style={{ ...styles.td, color: "#888", fontSize: 12 }}>
                                        {p.fechaRegistro
                                            ? p.fechaRegistro?.toDate
                                                ? p.fechaRegistro.toDate().toLocaleDateString("es-MX")
                                                : new Date(p.fechaRegistro).toLocaleDateString("es-MX")
                                            : "—"}
                                    </td>
                                    <td style={styles.td}>
                                        <button
                                            style={styles.btnEliminar}
                                            onClick={() => setConfirmar(p)}
                                        >
                                            🗑 Eliminar cuenta
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de confirmación */}
            {confirmar && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalIcon}>⚠️</div>
                        <h2 style={styles.modalTitle}>¿Eliminar cuenta?</h2>
                        <p style={styles.modalText}>
                            Estás por eliminar la cuenta de <strong>{confirmar.nombre}</strong>.
                            Esta acción no se puede deshacer.
                        </p>
                        <div style={styles.modalBtns}>
                            <button style={styles.btnCancelar} onClick={() => setConfirmar(null)}>
                                Cancelar
                            </button>
                            <button style={styles.btnConfirmar} onClick={() => eliminarPaciente(confirmar)}>
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 },
    subtitle: { fontSize: 13, color: "#888", marginTop: 4 },
    totalBadge: { background: "#E6F1FB", borderRadius: 10, padding: "10px 20px", textAlign: "center" },
    totalNum: { display: "block", fontSize: 24, fontWeight: 700, color: BLUE },
    totalLabel: { fontSize: 11, color: BLUE },
    search: { width: "100%", padding: "9px 14px", borderRadius: 8, border: "0.5px solid #d1d5db", fontSize: 13, marginBottom: 16, outline: "none", boxSizing: "border-box" },
    card: { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", overflow: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "0.5px solid #e5e7eb" },
    tr: { borderBottom: "0.5px solid #f3f4f6" },
    td: { padding: "12px 16px", color: "#1a1a2e", verticalAlign: "middle" },
    pacienteCell: { display: "flex", alignItems: "center", gap: 10 },
    avatar: { width: 34, height: 34, borderRadius: "50%", background: "#E6F1FB", color: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 },
    nombre: { fontWeight: 500 },
    btnEliminar: { fontSize: 12, padding: "6px 12px", borderRadius: 6, border: "none", background: "#FCEBEB", color: "#A32D2D", cursor: "pointer", fontWeight: 500 },
    empty: { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
    modal: { background: "white", borderRadius: 16, padding: "32px 28px", maxWidth: 380, width: "90%", textAlign: "center" },
    modalIcon: { fontSize: 36, marginBottom: 12 },
    modalTitle: { fontSize: 18, fontWeight: 600, color: "#1a1a2e", margin: "0 0 8px" },
    modalText: { fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 24px" },
    modalBtns: { display: "flex", gap: 10, justifyContent: "center" },
    btnCancelar: { padding: "9px 20px", borderRadius: 8, border: "0.5px solid #d1d5db", background: "white", color: "#555", fontSize: 13, cursor: "pointer", fontWeight: 500 },
    btnConfirmar: { padding: "9px 20px", borderRadius: 8, border: "none", background: "#E24B4A", color: "white", fontSize: 13, cursor: "pointer", fontWeight: 500 },
};