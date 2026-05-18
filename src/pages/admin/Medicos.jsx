import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useWindowWidth } from "./useWindowWidth";
 
const BLUE = "#185FA5";
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIAS_LABEL = { lunes: "LUN", martes: "MAR", miercoles: "MIÉ", jueves: "JUE", viernes: "VIE", sabado: "SÁB", domingo: "DOM" };
 
export default function Medicos() {
  const width    = useWindowWidth();
  const isMobile = width < 768;
  const isSmall  = width < 1024;
 
  const [medicos,   setMedicos]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("validar");
  const [filtro,    setFiltro]    = useState("todos");
  const [busqueda,  setBusqueda]  = useState("");
 
  useEffect(() => { fetchMedicos(); }, []);
 
  async function fetchMedicos() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "usuarios"), where("rol", "==", "medico")));
    setMedicos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }
 
  async function cambiarEstado(medico, nuevoEstado) {
    await updateDoc(doc(db, "usuarios", medico.id), { estado: nuevoEstado });
    setMedicos((prev) => prev.map((m) => m.id === medico.id ? { ...m, estado: nuevoEstado } : m));
  }
 
  const filtered = medicos
    .filter((m) => {
      if (filtro === "pendiente") return m.estado === "pendiente";
      if (filtro === "aprobado")  return m.estado === "aprobado";
      if (filtro === "rechazado") return m.estado === "rechazado";
      return true;
    })
    .filter((m) => {
      const q = busqueda.toLowerCase();
      return m.nombre?.toLowerCase().includes(q) || m.especialidad?.toLowerCase().includes(q) || m.cedula?.includes(q);
    });
 
  const pendientes = medicos.filter((m) => m.estado === "pendiente").length;
  const aprobados  = medicos.filter((m) => m.estado === "aprobado").length;
  const rechazados = medicos.filter((m) => m.estado === "rechazado").length;
  const padding    = isMobile ? "48px 12px 12px" : isSmall ? 16 : 24;
 
  return (
    <div style={{ padding }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={styles.title}>Médicos</h1>
          <p style={styles.subtitle}>Gestión, validación y horarios</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Stat label="Total"      value={medicos.length} color={BLUE}    bg="#E6F1FB" />
          <Stat label="Aprobados"  value={aprobados}      color="#27500A" bg="#EAF3DE" />
          <Stat label="Pendientes" value={pendientes}     color="#633806" bg="#FAEEDA" />
          <Stat label="Rechazados" value={rechazados}     color="#A32D2D" bg="#FCEBEB" />
        </div>
      </div>
 
      {/* Tabs */}
      <div style={styles.tabsWrap}>
        <button style={{ ...styles.tabBtn, ...(tab === "validar"  ? styles.tabBtnActive : {}) }} onClick={() => setTab("validar")}>✅ Validar cédulas</button>
        <button style={{ ...styles.tabBtn, ...(tab === "horarios" ? styles.tabBtnActive : {}) }} onClick={() => setTab("horarios")}>🕐 Horarios</button>
      </div>
 
      {/* Buscador — solo validar */}
      {tab === "validar" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexDirection: isMobile ? "column" : "row" }}>
          <input
            style={styles.search}
            placeholder="Buscar por nombre, especialidad o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["todos", "pendiente", "aprobado", "rechazado"].map((f) => (
              <button key={f}
                style={{ ...styles.filtroBtn, ...(filtro === f ? styles.filtroBtnActive : {}) }}
                onClick={() => setFiltro(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
 
      {loading ? (
        <p style={styles.empty}>Cargando médicos...</p>
      ) : tab === "validar" ? (
        // ── Tab validar ───────────────────────────────────────────────────────
        isMobile ? (
          // Móvil: tarjetas en lugar de tabla
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 ? <p style={styles.empty}>No se encontraron médicos.</p> :
              filtered.map((m) => (
                <div key={m.id} style={styles.medicoCardMobile}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={styles.avatar}>{m.nombre?.[0] ?? "?"}</div>
                    <div>
                      <div style={styles.medicoNombre}>{m.nombre}</div>
                      <div style={styles.medicoEmail}>{m.email}</div>
                    </div>
                    <span style={{ ...styles.badge, ...estadoStyle(m.estado), marginLeft: "auto" }}>
                      {estadoLabel(m.estado)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
                    <b>Cédula:</b> {m.cedula ?? "—"} · <b>Especialidad:</b> {m.especialidad ?? "—"}
                  </div>
                  {m.urlCedula && (
                    <a href={m.urlCedula} target="_blank" rel="noreferrer" style={{ ...styles.verLink, display: "block", marginBottom: 10 }}>
                      📄 Ver documento
                    </a>
                  )}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {m.estado !== "aprobado"  && <button style={{ ...styles.btn, ...styles.btnGreen }} onClick={() => cambiarEstado(m, "aprobado")}>✔ Aprobar</button>}
                    {m.estado !== "rechazado" && <button style={{ ...styles.btn, ...styles.btnRed }}   onClick={() => cambiarEstado(m, "rechazado")}>✖ Rechazar</button>}
                    {m.estado !== "pendiente" && <button style={{ ...styles.btn, ...styles.btnGray }}  onClick={() => cambiarEstado(m, "pendiente")}>↺ Pendiente</button>}
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          // Desktop: tabla
          <div style={styles.card}>
            {filtered.length === 0 ? <p style={styles.empty}>No se encontraron médicos.</p> : (
              <table style={styles.table}>
                <thead>
                  <tr>{["Médico", "Cédula", "Especialidad", "Documento", "Estado", "Acciones"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
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
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 13 }}>{m.cedula ?? "—"}</td>
                      <td style={styles.td}>{m.especialidad ?? "—"}</td>
                      <td style={styles.td}>
                        {m.urlCedula
                          ? <a href={m.urlCedula} target="_blank" rel="noreferrer" style={styles.verLink}>📄 Ver documento</a>
                          : <span style={{ color: "#aaa", fontSize: 12 }}>Sin documento</span>}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...estadoStyle(m.estado) }}>{estadoLabel(m.estado)}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {m.estado !== "aprobado"  && <button style={{ ...styles.btn, ...styles.btnGreen }} onClick={() => cambiarEstado(m, "aprobado")}>✔ Aprobar</button>}
                          {m.estado !== "rechazado" && <button style={{ ...styles.btn, ...styles.btnRed }}   onClick={() => cambiarEstado(m, "rechazado")}>✖ Rechazar</button>}
                          {m.estado !== "pendiente" && <button style={{ ...styles.btn, ...styles.btnGray }}  onClick={() => cambiarEstado(m, "pendiente")}>↺ Pendiente</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      ) : (
        // ── Tab horarios ──────────────────────────────────────────────────────
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {medicos.length === 0 ? <p style={styles.empty}>No hay médicos registrados.</p> :
            medicos.map((m) => (
              <div key={m.id} style={styles.horarioCard}>
                <div style={styles.horarioHeader}>
                  <div style={styles.medicoCell}>
                    <div style={{ ...styles.avatar, width: 40, height: 40, fontSize: 15 }}>{m.nombre?.[0] ?? "?"}</div>
                    <div>
                      <div style={styles.medicoNombre}>{m.nombre}</div>
                      <div style={styles.medicoEmail}>{m.especialidad ?? "Sin especialidad"}</div>
                    </div>
                  </div>
                  <span style={{ ...styles.badge, ...estadoStyle(m.estado) }}>{estadoLabel(m.estado)}</span>
                </div>
 
                {!m.horarios || Object.keys(m.horarios).length === 0 ? (
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>Sin horarios registrados</p>
                ) : (
                  <div style={{
                    ...styles.horariosGrid,
                    gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)",
                  }}>
                    {DIAS.map((dia) => {
                      const horas = m.horarios?.[dia];
                      return (
                        <div key={dia} style={{ ...styles.diaCard, ...(horas?.length > 0 ? styles.diaCardActivo : styles.diaCardVacio) }}>
                          <div style={styles.diaNombre}>{DIAS_LABEL[dia]}</div>
                          {horas?.length > 0 ? (
                            <>
                              <div style={styles.diaHora}>{horas[0]}</div>
                              <div style={styles.diaSep}>—</div>
                              <div style={styles.diaHora}>{horas[horas.length - 1]}</div>
                            </>
                          ) : (
                            <div style={styles.diaLibre}>Libre</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
 
function estadoLabel(estado) {
  const map = { aprobado: "✔ Aprobado", pendiente: "⏳ Pendiente", rechazado: "✖ Rechazado" };
  return map[estado] ?? estado ?? "—";
}
function estadoStyle(estado) {
  const map = { aprobado: { background: "#EAF3DE", color: "#27500A" }, pendiente: { background: "#FAEEDA", color: "#633806" }, rechazado: { background: "#FCEBEB", color: "#A32D2D" } };
  return map[estado] ?? { background: "#f3f4f6", color: "#888" };
}
function Stat({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 60 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color }}>{label}</div>
    </div>
  );
}
 
const styles = {
  title:           { fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 },
  subtitle:        { fontSize: 13, color: "#888", marginTop: 4 },
  tabsWrap:        { display: "flex", gap: 4, marginBottom: 14, borderBottom: "0.5px solid #e5e7eb" },
  tabBtn:          { padding: "10px 18px", borderRadius: "8px 8px 0 0", border: "0.5px solid #e5e7eb", borderBottom: "none", background: "#f3f4f6", fontSize: 13, cursor: "pointer", color: "#555", fontWeight: 500 },
  tabBtnActive:    { background: "white", color: "#185FA5", fontWeight: 600 },
  search:          { flex: 1, padding: "9px 14px", borderRadius: 8, border: "0.5px solid #d1d5db", fontSize: 13, outline: "none" },
  filtroBtn:       { padding: "8px 12px", borderRadius: 8, border: "0.5px solid #d1d5db", background: "white", fontSize: 12, cursor: "pointer", color: "#555" },
  filtroBtnActive: { background: "#185FA5", color: "white", border: "0.5px solid #185FA5" },
  card:            { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", overflow: "auto" },
  table:           { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:              { textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "0.5px solid #e5e7eb", whiteSpace: "nowrap" },
  tr:              { borderBottom: "0.5px solid #f3f4f6" },
  td:              { padding: "12px 16px", color: "#1a1a2e", verticalAlign: "middle" },
  medicoCell:      { display: "flex", alignItems: "center", gap: 10 },
  avatar:          { width: 34, height: 34, borderRadius: "50%", background: "#E6F1FB", color: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 },
  medicoNombre:    { fontWeight: 500, fontSize: 13 },
  medicoEmail:     { fontSize: 11, color: "#888" },
  badge:           { fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 },
  verLink:         { fontSize: 12, color: "#185FA5", textDecoration: "none", fontWeight: 500 },
  btn:             { fontSize: 11, padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" },
  btnGreen:        { background: "#EAF3DE", color: "#27500A" },
  btnRed:          { background: "#FCEBEB", color: "#A32D2D" },
  btnGray:         { background: "#f3f4f6", color: "#555" },
  empty:           { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 },
  medicoCardMobile:{ background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "16px" },
  horarioCard:     { background: "white", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "16px 18px" },
  horarioHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  horariosGrid:    { display: "grid", gap: 8, marginTop: 8 },
  diaCard:         { borderRadius: 8, padding: "8px 4px", textAlign: "center" },
  diaCardActivo:   { background: "#E6F1FB", border: "1px solid #185FA520" },
  diaCardVacio:    { background: "#f9fafb", border: "1px solid #f0f0f0" },
  diaNombre:       { fontSize: 9, fontWeight: 700, color: "#888", marginBottom: 4, letterSpacing: "0.05em" },
  diaHora:         { fontSize: 10, fontWeight: 600, color: "#185FA5" },
  diaSep:          { fontSize: 9, color: "#aaa", margin: "1px 0" },
  diaLibre:        { fontSize: 10, color: "#ccc", marginTop: 4 },
};