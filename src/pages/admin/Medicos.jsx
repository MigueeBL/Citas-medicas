import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
 
const BLUE = "#185FA5";
 
export default function Medicos() {
  const [medicos, setMedicos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtro, setFiltro]     = useState("todos");
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
      if (filtro === "pendiente")  return m.estado === "pendiente";
      if (filtro === "aprobado")   return m.estado === "aprobado";
      if (filtro === "rechazado")  return m.estado === "rechazado";
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
 
  const pendientes  = medicos.filter((m) => m.estado === "pendiente").length;
  const aprobados   = medicos.filter((m) => m.estado === "aprobado").length;
  const rechazados  = medicos.filter((m) => m.estado === "rechazado").length;
 
  return (
    <div>
      {/* Encabezado */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Médicos</h1>
          <p style={styles.subtitle}>Validación de cédulas y gestión de médicos</p>
        </div>
        <div style={styles.stats}>
          <Stat label="Total"      value={medicos.length} color={BLUE}    bg="#E6F1FB" />
          <Stat label="Aprobados"  value={aprobados}      color="#27500A" bg="#EAF3DE" />
          <Stat label="Pendientes" value={pendientes}     color="#633806" bg="#FAEEDA" />
          <Stat label="Rechazados" value={rechazados}     color="#A32D2D" bg="#FCEBEB" />
        </div>
      </div>
 
      {/* Filtros */}
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder="Buscar por nombre, especialidad o cédula..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div style={styles.tabs}>
          {["todos", "pendiente", "aprobado", "rechazado"].map((f) => (
            <button
              key={f}
              style={{ ...styles.tab, ...(filtro === f ? styles.tabActive : {}) }}
              onClick={() => setFiltro(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
 
      {/* Tabla */}
      <div style={styles.card}>
        {loading ? (
          <p style={styles.empty}>Cargando médicos...</p>
        ) : filtered.length === 0 ? (
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
 
                  {/* Médico */}
                  <td style={styles.td}>
                    <div style={styles.medicoCell}>
                      <div style={styles.avatar}>{m.nombre?.[0] ?? "?"}</div>
                      <div>
                        <div style={styles.medicoNombre}>{m.nombre}</div>
                        <div style={styles.medicoEmail}>{m.email}</div>
                      </div>
                    </div>
                  </td>
 
                  {/* Cédula */}
                  <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 13 }}>
                    {m.cedula ?? "—"}
                  </td>
 
                  {/* Especialidad */}
                  <td style={styles.td}>{m.especialidad ?? "—"}</td>
 
                  {/* URL de cédula */}
                  <td style={styles.td}>
                    {m.urlCedula ? (
                      <a href={m.urlCedula} target="_blank" rel="noreferrer" style={styles.verLink}>
                        📄 Ver documento
                      </a>
                    ) : (
                      <span style={{ color: "#aaa", fontSize: 12 }}>Sin documento</span>
                    )}
                  </td>
 
                  {/* Estado */}
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...estadoStyle(m.estado) }}>
                      {estadoLabel(m.estado)}
                    </span>
                  </td>
 
                  {/* Acciones */}
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {m.estado !== "aprobado" && (
                        <button style={{ ...styles.btn, ...styles.btnGreen }} onClick={() => cambiarEstado(m, "aprobado")}>
                          ✔ Aprobar
                        </button>
                      )}
                      {m.estado !== "rechazado" && (
                        <button style={{ ...styles.btn, ...styles.btnRed }} onClick={() => cambiarEstado(m, "rechazado")}>
                          ✖ Rechazar
                        </button>
                      )}
                      {m.estado !== "pendiente" && (
                        <button style={{ ...styles.btn, ...styles.btnGray }} onClick={() => cambiarEstado(m, "pendiente")}>
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
    </div>
  );
}
 
function estadoLabel(estado) {
  const map = { aprobado: "✔ Aprobado", pendiente: "⏳ Pendiente", rechazado: "✖ Rechazado" };
  return map[estado] ?? estado ?? "—";
}
 
function estadoStyle(estado) {
  const map = {
    aprobado:  { background: "#EAF3DE", color: "#27500A" },
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
 
const styles = {
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title:       { fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 },
  subtitle:    { fontSize: 13, color: "#888", marginTop: 4 },
  stats:       { display: "flex", gap: 10 },
  toolbar:     { display: "flex", gap: 12, marginBottom: 16, alignItems: "center" },
  search:      { flex: 1, padding: "9px 14px", borderRadius: 8, border: "0.5px solid #d1d5db", fontSize: 13, outline: "none" },
  tabs:        { display: "flex", gap: 4 },
  tab:         { padding: "8px 14px", borderRadius: 8, border: "0.5px solid #d1d5db", background: "white", fontSize: 13, cursor: "pointer", color: "#555" },
  tabActive:   { background: BLUE, color: "white", border: `0.5px solid ${BLUE}` },
  card:        { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", overflow: "auto" },
  table:       { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:          { textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "0.5px solid #e5e7eb", whiteSpace: "nowrap" },
  tr:          { borderBottom: "0.5px solid #f3f4f6" },
  td:          { padding: "12px 16px", color: "#1a1a2e", verticalAlign: "middle" },
  medicoCell:  { display: "flex", alignItems: "center", gap: 10 },
  avatar:      { width: 34, height: 34, borderRadius: "50%", background: "#E6F1FB", color: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 },
  medicoNombre:{ fontWeight: 500, fontSize: 13 },
  medicoEmail: { fontSize: 11, color: "#888" },
  badge:       { fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 },
  verLink:     { fontSize: 12, color: BLUE, textDecoration: "none", fontWeight: 500 },
  btn:         { fontSize: 11, padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" },
  btnGreen:    { background: "#EAF3DE", color: "#27500A" },
  btnRed:      { background: "#FCEBEB", color: "#A32D2D" },
  btnGray:     { background: "#f3f4f6", color: "#555" },
  empty:       { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 },
};
 