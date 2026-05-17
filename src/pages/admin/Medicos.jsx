import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
 
const BLUE = "#185FA5";
 
export default function Medicos() {
  const [medicos, setMedicos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtro, setFiltro]     = useState("todos"); // todos | pendientes | validados
  const [busqueda, setBusqueda] = useState("");
 
  useEffect(() => { fetchMedicos(); }, []);
 
  async function fetchMedicos() {
    setLoading(true);
    const snap = await getDocs(collection(db, "medicos"));
    setMedicos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }
 
  async function toggleValidar(medico) {
    const ref = doc(db, "medicos", medico.id);
    await updateDoc(ref, { validado: !medico.validado });
    setMedicos((prev) =>
      prev.map((m) => m.id === medico.id ? { ...m, validado: !m.validado } : m)
    );
  }
 
  async function toggleActivo(medico) {
    const ref = doc(db, "medicos", medico.id);
    await updateDoc(ref, { activo: !medico.activo });
    setMedicos((prev) =>
      prev.map((m) => m.id === medico.id ? { ...m, activo: !m.activo } : m)
    );
  }
 
  const filtered = medicos
    .filter((m) => {
      if (filtro === "pendientes") return !m.validado;
      if (filtro === "validados")  return m.validado;
      return true;
    })
    .filter((m) => {
      const q = busqueda.toLowerCase();
      return (
        m.nombre?.toLowerCase().includes(q) ||
        m.especialidad?.toLowerCase().includes(q) ||
        m.cedulaProfesional?.includes(q)
      );
    });
 
  return (
    <div>
      {/* Encabezado */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Médicos</h1>
          <p style={styles.subtitle}>Gestión y validación de cédulas profesionales</p>
        </div>
        <div style={styles.stats}>
          <Stat label="Total"      value={medicos.length} />
          <Stat label="Validados"  value={medicos.filter((m) => m.validado).length}  color="#27500A" bg="#EAF3DE" />
          <Stat label="Pendientes" value={medicos.filter((m) => !m.validado).length} color="#633806" bg="#FAEEDA" />
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
          {["todos", "pendientes", "validados"].map((f) => (
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
                {["Médico", "Cédula", "Especialidad", "Días de trabajo", "Estado", "Validado", "Acciones"].map((h) => (
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
                        <div style={styles.medicoCarrera}>{m.carrera}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 13 }}>
                    {m.cedulaProfesional ?? "—"}
                  </td>
                  <td style={styles.td}>{m.especialidad ?? "—"}</td>
                  <td style={styles.td}>
                    <div style={styles.diasWrap}>
                      {(m.diasTrabajo ?? []).map((d) => (
                        <span key={d} style={styles.diaBadge}>{d.slice(0, 3)}</span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(m.activo ? styles.badgeOk : styles.badgeOff) }}>
                      {m.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(m.validado ? styles.badgeOk : styles.badgePen) }}>
                      {m.validado ? "✔ Validado" : "⏳ Pendiente"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={{ ...styles.btn, ...(m.validado ? styles.btnGray : styles.btnBlue) }}
                        onClick={() => toggleValidar(m)}
                      >
                        {m.validado ? "Quitar validación" : "Validar"}
                      </button>
                      <button
                        style={{ ...styles.btn, ...(m.activo ? styles.btnRed : styles.btnGray) }}
                        onClick={() => toggleActivo(m)}
                      >
                        {m.activo ? "Desactivar" : "Activar"}
                      </button>
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
 
function Stat({ label, value, color = "#185FA5", bg = "#E6F1FB" }) {
  return (
    <div style={{ ...styles.statCard, background: bg }}>
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
  statCard:    { borderRadius: 10, padding: "10px 16px", textAlign: "center", minWidth: 70 },
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
  medicoCarrera:{ fontSize: 11, color: "#888" },
  diasWrap:    { display: "flex", gap: 4, flexWrap: "wrap" },
  diaBadge:    { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#E6F1FB", color: BLUE, fontWeight: 500 },
  badge:       { fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 },
  badgeOk:     { background: "#EAF3DE", color: "#27500A" },
  badgePen:    { background: "#FAEEDA", color: "#633806" },
  badgeOff:    { background: "#f3f4f6", color: "#888" },
  btn:         { fontSize: 11, padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" },
  btnBlue:     { background: "#E6F1FB", color: BLUE },
  btnGray:     { background: "#f3f4f6", color: "#555" },
  btnRed:      { background: "#FCEBEB", color: "#A32D2D" },
  empty:       { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 },
};