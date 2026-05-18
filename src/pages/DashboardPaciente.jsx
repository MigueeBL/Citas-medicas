import { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import {
  collection, query, where, getDocs,
  addDoc, onSnapshot, doc, updateDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

/* ─────────────────────────────────────────────
   PALETA & HELPERS
───────────────────────────────────────────── */
const C = {
  teal:    "#0d9488",
  tealDk:  "#0f766e",
  tealLt:  "#ccfbf1",
  tealPale:"#f0fdfa",
  slate:   "#1e293b",
  muted:   "#64748b",
  border:  "#e2e8f0",
  bg:      "#f8fafc",
  white:   "#ffffff",
  amber:   "#f59e0b",
  red:     "#ef4444",
  green:   "#10b981",
};

const DIAS_SEMANA = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function initials(nombre = "") {
  return nombre.split(" ").filter(w => w.length > 1).map(w => w[0]).join("").slice(0,2).toUpperCase() || "??";
}

const AVATAR_COLORS = ["#0d9488","#0284c7","#7c3aed","#db2777","#ea580c","#16a34a"];
function avatarBg(str = "") { return AVATAR_COLORS[(str.charCodeAt(0) || 0) % AVATAR_COLORS.length]; }

function contarHorarios(m) {
  if (!m.horarios) return 0;
  if (Array.isArray(m.horarios)) return m.horarios.length;
  return Object.values(m.horarios).reduce((s, a) => s + (a?.length || 0), 0);
}

/* ─────────────────────────────────────────────
   BADGES
───────────────────────────────────────────── */
function EstadoBadge({ estado }) {
  const cfg = {
    confirmada: { bg:"#dcfce7", color:"#166534", label:"Confirmada",   dot:"#16a34a" },
    pendiente:  { bg:"#fef9c3", color:"#854d0e", label:"Pendiente",    dot:"#ca8a04" },
    cobrada:    { bg:"#dbeafe", color:"#1e40af", label:"Completada",   dot:"#3b82f6" },
    cancelada:  { bg:"#fee2e2", color:"#991b1b", label:"Cancelada",    dot:"#ef4444" },
  };
  const s = cfg[estado] || { bg:"#f1f5f9", color:"#475569", label:estado, dot:"#94a3b8" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   AVATAR
───────────────────────────────────────────── */
function Avatar({ nombre, size = 40 }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35, background: avatarBg(nombre) }}>
      {initials(nombre)}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL CANCELAR
───────────────────────────────────────────── */
function ModalCancelar({ cita, onConfirmar, onCerrar, cancelando }) {
  if (!cita) return null;
  const fecha = new Date(cita.fecha + "T00:00:00");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up"
        style={{ background: C.white }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
          style={{ background: "#fef2f2" }}>⚠️</div>
        <h3 className="text-lg font-bold text-center mb-1" style={{ color: C.slate }}>¿Cancelar esta cita?</h3>
        <p className="text-sm text-center mb-5" style={{ color: C.muted }}>Esta acción no se puede deshacer.</p>
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
          style={{ background: C.tealPale, border: `1px solid ${C.tealLt}` }}>
          <Avatar nombre={cita.medicoNombre} size={44} />
          <div>
            <p className="font-semibold text-sm" style={{ color: C.slate }}>{cita.medicoNombre}</p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>
              {fecha.toLocaleDateString("es-MX", { day:"numeric", month:"long" })} · {cita.hora}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCerrar} disabled={cancelando}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: C.bg, color: C.slate, border: `1px solid ${C.border}` }}>
            Volver
          </button>
          <button onClick={onConfirmar} disabled={cancelando}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-all"
            style={{ background: cancelando ? "#fca5a5" : C.red }}>
            {cancelando ? "Cancelando..." : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIDEBAR DESKTOP
───────────────────────────────────────────── */
function Sidebar({ seccion, setSeccion, user, onLogout }) {
  const items = [
    { id: "dashboard", label: "Inicio",       icon: "🏠" },
    { id: "agendar",   label: "Agendar cita", icon: "➕" },
    { id: "miscitas",  label: "Mis citas",    icon: "📋" },
  ];
  return (
    <aside className="hidden md:flex w-64 min-h-screen flex-col flex-shrink-0 relative"
      style={{ background: C.white, borderRight: `1px solid ${C.border}` }}>

      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: C.teal }}>
          <img src={logo} alt="Logo" className="w-6 h-6 object-contain" style={{ filter:"brightness(10)" }} />
        </div>
        <div>
          <p className="font-bold text-sm leading-none" style={{ color: C.slate }}>MediAsist</p>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>Portal paciente</p>
        </div>
      </div>

      {/* Perfil */}
      <div className="mx-4 mb-6 p-4 rounded-2xl flex items-center gap-3"
        style={{ background: C.tealPale, border: `1px solid ${C.tealLt}` }}>
        <Avatar nombre={user?.nombre} size={44} />
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: C.slate }}>{user?.nombre || "Paciente"}</p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: C.teal }}>Paciente</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 flex flex-col gap-1">
        {items.map(item => {
          const active = seccion === item.id;
          return (
            <button key={item.id} onClick={() => setSeccion(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-left transition-all"
              style={{
                background: active ? C.teal : "transparent",
                color: active ? C.white : C.muted,
              }}>
              <span className="text-base">{item.icon}</span>
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 pb-6 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-red-50"
          style={{ color: "#ef4444" }}>
          <span>🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   BOTTOM NAV MÓVIL
───────────────────────────────────────────── */
function BottomNav({ seccion, setSeccion, onLogout }) {
  const items = [
    { id: "dashboard", label: "Inicio",   icon: "🏠" },
    { id: "agendar",   label: "Agendar",  icon: "➕" },
    { id: "miscitas",  label: "Mis citas",icon: "📋" },
    { id: "__logout",  label: "Salir",    icon: "🚪", action: onLogout },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: C.white,
        borderTop: `1px solid ${C.border}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
      {items.map(item => {
        const active = seccion === item.id;
        const fn = item.action || (() => setSeccion(item.id));
        return (
          <button key={item.id} onClick={fn}
            className="flex-1 flex flex-col items-center py-2.5 gap-1 text-xs font-semibold transition-all"
            style={{ color: active ? C.teal : C.muted }}>
            <span className="text-xl leading-none">{item.icon}</span>
            <span style={{ fontSize: 10 }}>{item.label}</span>
            {active && <span className="w-4 h-0.5 rounded-full" style={{ background: C.teal }} />}
          </button>
        );
      })}
    </nav>
  );
}

/* ─────────────────────────────────────────────
   HEADER MÓVIL
───────────────────────────────────────────── */
function HeaderMovil({ user, seccion }) {
  const titulos = { dashboard:"Inicio", agendar:"Agendar cita", miscitas:"Mis citas" };
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3"
      style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: C.teal }}>
          <img src={logo} alt="Logo" className="w-5 h-5 object-contain" style={{ filter:"brightness(10)" }} />
        </div>
        <span className="font-bold text-sm" style={{ color: C.slate }}>{titulos[seccion]}</span>
      </div>
      <Avatar nombre={user?.nombre} size={34} />
    </header>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({ icon, label, value, accent, onClick }) {
  return (
    <button onClick={onClick}
      className="rounded-2xl p-4 flex items-center gap-4 text-left w-full transition-all hover:shadow-md active:scale-95"
      style={{ background: C.white, border: `1px solid ${C.border}` }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: accent + "18" }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: C.slate }}>{value}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: C.muted }}>{label}</p>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   CITA CARD (reusable)
───────────────────────────────────────────── */
function CitaCard({ cita, onCancelar, showCancel }) {
  const fecha = new Date(cita.fecha + "T00:00:00");
  const hoy = getToday();
  const esHoy = cita.fecha === hoy;
  return (
    <div className="rounded-2xl p-4 transition-all hover:shadow-sm"
      style={{ background: C.white, border: `1px solid ${esHoy ? C.teal+"40" : C.border}` }}>
      {esHoy && (
        <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-3"
          style={{ background: C.tealLt, color: C.tealDk }}>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          Hoy
        </div>
      )}
      <div className="flex items-center gap-3">
        <Avatar nombre={cita.medicoNombre} size={44} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: C.slate }}>{cita.medicoNombre}</p>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>{cita.especialidad}</p>
        </div>
        <EstadoBadge estado={cita.estado} />
      </div>

      <div className="mt-3 pt-3 flex items-center justify-between flex-wrap gap-2"
        style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.muted }}>
            <span>📅</span>
            {fecha.toLocaleDateString("es-MX", { day:"numeric", month:"long", year:"numeric" })}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.muted }}>
            <span>🕐</span>{cita.hora}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {cita.monto > 0 && (
            <span className="text-sm font-bold" style={{ color: C.slate }}>${cita.monto} MXN</span>
          )}
          {showCancel && onCancelar && (
            <button onClick={() => onCancelar(cita)}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
              style={{ background:"#fef2f2", color: C.red, border:"1px solid #fecaca" }}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DASHBOARD VIEW
───────────────────────────────────────────── */
function DashboardView({ user, citas, setSeccion }) {
  const hoy = getToday();
  const proximas = citas.filter(c => c.fecha >= hoy && c.estado !== "cancelada")
                        .sort((a,b) => a.fecha.localeCompare(b.fecha));
  const pasadas  = citas.filter(c => c.fecha < hoy)
                        .sort((a,b) => b.fecha.localeCompare(a.fecha));
  const proxima  = proximas[0];
  const fechaHoy = new Date();

  function diasRestantes(fecha) {
    const hoyD = new Date(); hoyD.setHours(0,0,0,0);
    const diff = Math.round((new Date(fecha + "T00:00:00") - hoyD) / 86400000);
    if (diff === 0) return "Hoy 🎯";
    if (diff === 1) return "Mañana ⏰";
    return `En ${diff} días`;
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8" style={{ background: C.bg }}>

      {/* Hero bienvenida */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealDk} 100%)` }}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: "white" }} />
          <div className="absolute -bottom-6 -right-2 w-20 h-20 rounded-full opacity-10"
            style={{ background: "white" }} />

          <p className="text-sm font-semibold text-white/70 mb-1">
            {fechaHoy.toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" })}
          </p>
          <h1 className="text-2xl font-bold text-white mb-1">
            ¡Hola, {user?.nombre?.split(" ")[0] || "Paciente"}! 👋
          </h1>
          <p className="text-sm text-white/80">Bienvenido a tu portal de citas médicas.</p>

          {proxima && (
            <div className="mt-4 rounded-2xl p-3 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-2xl">📅</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 font-medium">Próxima cita</p>
                <p className="text-sm font-bold text-white truncate">{proxima.medicoNombre}</p>
                <p className="text-xs text-white/80">
                  {new Date(proxima.fecha+"T00:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})} · {proxima.hora}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap"
                style={{ background:"rgba(255,255,255,0.25)", color:"white" }}>
                {diasRestantes(proxima.fecha)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 md:px-8 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="📋" label="Total citas"   value={citas.length}    accent={C.teal}  />
          <StatCard icon="⏰" label="Próximas"      value={proximas.length} accent="#f59e0b" onClick={() => setSeccion("miscitas")} />
          <StatCard icon="✅" label="Completadas"   value={pasadas.length}  accent={C.green} onClick={() => setSeccion("miscitas")} />
        </div>
      </div>

      {/* CTA Agendar */}
      {proximas.length === 0 && (
        <div className="px-4 md:px-8 mb-6">
          <div className="rounded-3xl p-5 flex items-center gap-4"
            style={{ background: C.tealPale, border: `1.5px dashed ${C.tealLt}` }}>
            <span className="text-4xl">🩺</span>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: C.slate }}>No tienes citas próximas</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>¡Agenda una consulta ahora!</p>
            </div>
            <button onClick={() => setSeccion("agendar")}
              className="px-4 py-2.5 rounded-2xl text-sm font-bold text-white whitespace-nowrap transition-all active:scale-95"
              style={{ background: C.teal }}>
              Agendar →
            </button>
          </div>
        </div>
      )}

      {/* Próximas citas */}
      {proximas.length > 0 && (
        <div className="px-4 md:px-8 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: C.slate }}>Próximas citas</h2>
            <button onClick={() => setSeccion("miscitas")}
              className="text-xs font-semibold" style={{ color: C.teal }}>
              Ver todas →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {proximas.slice(0, 3).map(cita => (
              <CitaCard key={cita.id} cita={cita} />
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {pasadas.length > 0 && (
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: C.slate }}>Historial reciente</h2>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.border}` }}>
            {pasadas.slice(0, 3).map((cita, i) => {
              const fecha = new Date(cita.fecha + "T00:00:00");
              return (
                <div key={cita.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < Math.min(pasadas.length, 3) - 1 ? `1px solid ${C.border}` : "none" }}>
                  <Avatar nombre={cita.medicoNombre} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.slate }}>{cita.medicoNombre}</p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      {fecha.toLocaleDateString("es-MX", { day:"numeric", month:"short", year:"numeric" })}
                    </p>
                  </div>
                  <EstadoBadge estado={cita.estado} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AGENDAR CITA
───────────────────────────────────────────── */
function AgendarCita({ user, onCitaAgendada }) {
  const [paso, setPaso] = useState(1);
  const [medicos, setMedicos] = useState([]);
  const [medicoSel, setMedicoSel] = useState(null);
  const [fecha, setFecha] = useState("");
  const [horaSel, setHoraSel] = useState("");
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [cargandoMedicos, setCargandoMedicos] = useState(true);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const hoy = getToday();

  useEffect(() => {
    const fetchMedicos = async () => {
      setCargandoMedicos(true);
      const snap = await getDocs(
        query(collection(db, "usuarios"),
          where("rol", "==", "medico"),
          where("estado", "==", "aprobado"))
      );
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(m => {
          if (!m.horarios) return false;
          if (Array.isArray(m.horarios)) return m.horarios.length > 0;
          return Object.values(m.horarios).some(arr => arr?.length > 0);
        });
      setMedicos(lista);
      setCargandoMedicos(false);
    };
    fetchMedicos();
  }, []);

  useEffect(() => {
    if (!medicoSel || !fecha) return;
    const fetchOcupadas = async () => {
      setCargandoHoras(true);
      try {
        const snap = await getDocs(
          query(collection(db, "citas"),
            where("medicoId", "==", medicoSel.id),
            where("fecha", "==", fecha),
            where("estado", "!=", "cancelada"))
        );
        setHorasOcupadas(snap.docs.map(d => d.data().hora));
      } catch { setHorasOcupadas([]); }
      setCargandoHoras(false);
    };
    fetchOcupadas();
  }, [medicoSel, fecha]);

  const getSlotsDelDia = () => {
    if (!fecha || !medicoSel?.horarios) return [];
    const horarios = medicoSel.horarios;
    if (!Array.isArray(horarios)) {
      const diaSemana = DIAS_SEMANA[new Date(fecha + "T00:00:00").getDay()];
      return horarios[diaSemana] || [];
    }
    return horarios;
  };

  const medicosFiltrados = medicos.filter(m =>
    m.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.especialidad?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const confirmarCita = async () => {
    if (!medicoSel || !fecha || !horaSel) return;
    setGuardando(true);
    try {
      await addDoc(collection(db, "citas"), {
        pacienteId: user.uid,
        paciente: user.nombre,
        medicoId: medicoSel.id,
        medicoNombre: medicoSel.nombre,
        especialidad: medicoSel.especialidad,
        fecha, hora: horaSel,
        monto: medicoSel.precio || 0,
        estado: "pendiente",
        fechaCreacion: new Date().toISOString(),
      });
      setExito(true);
      onCitaAgendada();
    } catch (e) { console.error(e); }
    setGuardando(false);
  };

  /* ÉXITO */
  if (exito) return (
    <div className="flex-1 flex items-center justify-center p-6 pb-24 md:pb-6" style={{ background: C.bg }}>
      <div className="text-center max-w-xs">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.tealDk})` }}>
          ✅
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.slate }}>¡Cita agendada!</h2>
        <p className="font-semibold text-sm mb-1" style={{ color: C.muted }}>{medicoSel?.nombre}</p>
        <p className="text-sm mb-1" style={{ color: C.muted }}>
          {new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" })} · {horaSel}
        </p>
        <p className="text-xs mb-8 mt-2 px-4 py-2.5 rounded-2xl"
          style={{ background: "#fef9c3", color:"#854d0e" }}>
          ⏳ Tu cita está pendiente de confirmación por el asistente.
        </p>
        <button onClick={() => { setExito(false); setPaso(1); setMedicoSel(null); setFecha(""); setHoraSel(""); }}
          className="px-8 py-3 rounded-2xl text-white text-sm font-bold transition-all active:scale-95"
          style={{ background: C.teal }}>
          Agendar otra cita
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8" style={{ background: C.bg }}>
      <div className="px-4 md:px-8 pt-6">
        <h2 className="text-xl font-bold mb-1" style={{ color: C.slate }}>Agendar cita</h2>
        <p className="text-sm mb-6" style={{ color: C.muted }}>Selecciona tu médico, fecha y hora.</p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {[{n:1,label:"Médico"},{n:2,label:"Fecha y hora"},{n:3,label:"Confirmar"}].map((s, idx) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: paso > s.n ? C.green : paso === s.n ? C.teal : C.border,
                    color: paso >= s.n ? "white" : C.muted,
                  }}>
                  {paso > s.n ? "✓" : s.n}
                </div>
                <span className="text-xs font-semibold hidden sm:block"
                  style={{ color: paso >= s.n ? C.slate : C.muted }}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div className="h-0.5 w-8 sm:w-16 rounded-full transition-all"
                  style={{ background: paso > s.n ? C.teal : C.border }} />
              )}
            </div>
          ))}
        </div>

        {/* Paso 1 */}
        {paso === 1 && (
          <div>
            {cargandoMedicos ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
                <p className="text-sm font-medium" style={{ color: C.muted }}>Buscando médicos...</p>
              </div>
            ) : medicos.length === 0 ? (
              <div className="rounded-3xl p-10 text-center" style={{ background: C.white, border: `1px solid ${C.border}` }}>
                <p className="text-5xl mb-3">🩺</p>
                <p className="font-semibold" style={{ color: C.slate }}>No hay médicos disponibles aún</p>
                <p className="text-sm mt-1" style={{ color: C.muted }}>Vuelve más tarde.</p>
              </div>
            ) : (
              <>
                {/* Buscador */}
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
                  <input type="text" placeholder="Buscar médico o especialidad..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    className="w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none"
                    style={{ background: C.white, border: `1.5px solid ${C.border}`, color: C.slate }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {medicosFiltrados.map(medico => {
                    const sel = medicoSel?.id === medico.id;
                    return (
                      <button key={medico.id}
                        onClick={() => { setMedicoSel(medico); setPaso(2); setHoraSel(""); setFecha(""); }}
                        className="text-left p-4 rounded-2xl transition-all hover:shadow-md active:scale-98"
                        style={{
                          background: sel ? C.tealPale : C.white,
                          border: `1.5px solid ${sel ? C.teal : C.border}`,
                        }}>
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar nombre={medico.nombre} size={48} />
                          <div>
                            <p className="font-bold text-sm" style={{ color: C.slate }}>{medico.nombre}</p>
                            <p className="text-xs mt-0.5" style={{ color: C.muted }}>{medico.especialidad}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3"
                          style={{ borderTop: `1px solid ${sel ? C.tealLt : C.border}` }}>
                          <span className="text-xs font-medium" style={{ color: C.muted }}>
                            🕐 {contarHorarios(medico)} horarios
                          </span>
                          <span className="font-bold text-sm" style={{ color: C.teal }}>
                            {medico.precio ? `$${medico.precio} MXN` : "Consultar"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Paso 2 */}
        {paso === 2 && medicoSel && (
          <div className="max-w-lg">
            {/* Médico seleccionado */}
            <div className="p-4 rounded-2xl flex items-center gap-3 mb-5"
              style={{ background: C.white, border: `1.5px solid ${C.teal}40` }}>
              <Avatar nombre={medicoSel.nombre} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: C.slate }}>{medicoSel.nombre}</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{medicoSel.especialidad}</p>
              </div>
              <button onClick={() => { setPaso(1); setHoraSel(""); setFecha(""); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                Cambiar
              </button>
            </div>

            {/* Selector de fecha */}
            <label className="block text-sm font-bold mb-2" style={{ color: C.slate }}>
              Selecciona la fecha
            </label>
            <input type="date" min={hoy} value={fecha}
              onChange={e => { setFecha(e.target.value); setHoraSel(""); }}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none mb-5"
              style={{ background: C.white, border: `1.5px solid ${fecha ? C.teal : C.border}`, color: C.slate }} />

            {/* Horarios */}
            {fecha && (
              <div className="mb-5">
                <label className="block text-sm font-bold mb-2" style={{ color: C.slate }}>
                  Horarios disponibles —{" "}
                  <span className="font-normal" style={{ color: C.muted }}>
                    {new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", { weekday:"long" })}
                  </span>
                </label>
                {cargandoHoras ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-5 h-5 rounded-full border-2 border-teal-200 border-t-teal-500 animate-spin" />
                    <p className="text-sm" style={{ color: C.muted }}>Verificando disponibilidad...</p>
                  </div>
                ) : getSlotsDelDia().length === 0 ? (
                  <div className="rounded-2xl p-5 text-center"
                    style={{ background: "#fffbeb", border:"1px solid #fde68a" }}>
                    <p className="text-2xl mb-2">😕</p>
                    <p className="text-sm font-semibold" style={{ color:"#92400e" }}>
                      El médico no atiende este día
                    </p>
                    <p className="text-xs mt-1" style={{ color:"#b45309" }}>Prueba con otra fecha.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {getSlotsDelDia().map(hora => {
                      const ocupada = horasOcupadas.includes(hora);
                      const sel = horaSel === hora;
                      return (
                        <button key={hora} disabled={ocupada}
                          onClick={() => !ocupada && setHoraSel(hora)}
                          className="py-2.5 rounded-2xl text-sm font-semibold transition-all"
                          style={{
                            background: ocupada ? C.bg : sel ? C.teal : C.white,
                            color: ocupada ? C.border : sel ? "white" : C.slate,
                            border: `1.5px solid ${ocupada ? C.border : sel ? C.teal : C.border}`,
                            textDecoration: ocupada ? "line-through" : "none",
                            cursor: ocupada ? "not-allowed" : "pointer",
                          }}>
                          {hora}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={() => setPaso(1)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: C.bg, color: C.slate, border: `1px solid ${C.border}` }}>
                ← Volver
              </button>
              <button onClick={() => setPaso(3)} disabled={!fecha || !horaSel}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all"
                style={{ background: fecha && horaSel ? C.teal : C.tealLt,
                         cursor: fecha && horaSel ? "pointer" : "not-allowed" }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 */}
        {paso === 3 && medicoSel && (
          <div className="max-w-lg">
            <div className="rounded-2xl overflow-hidden mb-4"
              style={{ background: C.white, border: `1px solid ${C.border}` }}>
              {/* Cabecera */}
              <div className="px-5 py-4 flex items-center gap-3"
                style={{ background: C.tealPale, borderBottom: `1px solid ${C.tealLt}` }}>
                <Avatar nombre={medicoSel.nombre} size={48} />
                <div>
                  <p className="font-bold" style={{ color: C.slate }}>{medicoSel.nombre}</p>
                  <p className="text-sm" style={{ color: C.muted }}>{medicoSel.especialidad}</p>
                </div>
              </div>

              {/* Detalles */}
              <div className="px-5 py-4 flex flex-col gap-3">
                {[
                  { icon:"📅", label:"Fecha", value: new Date(fecha+"T00:00:00").toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"}) },
                  { icon:"🕐", label:"Hora",  value: horaSel },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2" style={{ color: C.muted }}>
                      <span>{icon}</span>{label}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: C.slate }}>{value}</span>
                  </div>
                ))}
                <div className="h-px" style={{ background: C.border }} />
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: C.slate }}>Total</span>
                  <span className="text-xl font-bold" style={{ color: C.teal }}>
                    {medicoSel.precio ? `$${medicoSel.precio} MXN` : "A consultar"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl px-4 py-3 mb-5 flex items-start gap-2 text-sm"
              style={{ background:"#fffbeb", color:"#92400e", border:"1px solid #fde68a" }}>
              <span className="flex-shrink-0">⚠️</span>
              <p>Tu cita quedará como <strong>pendiente</strong> hasta que el asistente la confirme.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPaso(2)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: C.bg, color: C.slate, border: `1px solid ${C.border}` }}>
                ← Volver
              </button>
              <button onClick={confirmarCita} disabled={guardando}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
                style={{ background: guardando ? C.tealLt : C.teal }}>
                {guardando ? "Guardando..." : "✓ Confirmar cita"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MIS CITAS
───────────────────────────────────────────── */
function MisCitas({ citas }) {
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [citaACancelar, setCitaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const hoy = getToday();

  const filtradas = (
    filtro === "proximas" ? citas.filter(c => c.fecha >= hoy && c.estado !== "cancelada").sort((a,b) => a.fecha.localeCompare(b.fecha))
    : filtro === "pasadas" ? citas.filter(c => c.fecha < hoy).sort((a,b) => b.fecha.localeCompare(a.fecha))
    : [...citas].sort((a,b) => a.fecha.localeCompare(b.fecha))
  ).filter(c => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return c.medicoNombre?.toLowerCase().includes(q) || c.especialidad?.toLowerCase().includes(q);
  });

  const handleCancelar = async () => {
    if (!citaACancelar) return;
    setCancelando(true);
    try { await updateDoc(doc(db, "citas", citaACancelar.id), { estado:"cancelada" }); }
    catch (e) { console.error(e); }
    setCancelando(false);
    setCitaACancelar(null);
  };

  const pudeCancelar = (cita) =>
    cita.fecha >= hoy && cita.estado !== "cancelada" && cita.estado !== "cobrada";

  const filtros = [
    { id:"todas",    label:"Todas" },
    { id:"proximas", label:"Próximas" },
    { id:"pasadas",  label:"Pasadas" },
  ];

  return (
    <>
      <ModalCancelar cita={citaACancelar} onConfirmar={handleCancelar}
        onCerrar={() => setCitaACancelar(null)} cancelando={cancelando} />

      <div className="flex-1 overflow-y-auto pb-24 md:pb-8" style={{ background: C.bg }}>
        <div className="px-4 md:px-8 pt-6">
          <h2 className="text-xl font-bold mb-1" style={{ color: C.slate }}>Mis citas</h2>
          <p className="text-sm mb-5" style={{ color: C.muted }}>Revisa y gestiona tus citas médicas.</p>

          {/* Filtros */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {filtros.map(f => (
              <button key={f.id} onClick={() => setFiltro(f.id)}
                className="px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: filtro === f.id ? C.teal : C.white,
                  color: filtro === f.id ? "white" : C.muted,
                  border: `1.5px solid ${filtro === f.id ? C.teal : C.border}`,
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative mb-5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
            <input type="text" placeholder="Buscar por médico o especialidad..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full rounded-2xl pl-11 pr-10 py-3 text-sm outline-none"
              style={{ background: C.white, border: `1.5px solid ${busqueda ? C.teal : C.border}`, color: C.slate }} />
            {busqueda && (
              <button onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: C.border, color: C.muted }}>✕</button>
            )}
          </div>

          {/* Lista */}
          {filtradas.length === 0 ? (
            <div className="rounded-3xl p-12 text-center" style={{ background: C.white, border: `1px solid ${C.border}` }}>
              <p className="text-5xl mb-3">🗓️</p>
              <p className="font-semibold" style={{ color: C.slate }}>No hay citas aquí</p>
              <p className="text-sm mt-1" style={{ color: C.muted }}>
                {busqueda ? "Prueba con otra búsqueda." : "No hay citas en esta categoría."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtradas.map(cita => (
                <CitaCard key={cita.id} cita={cita}
                  showCancel={pudeCancelar(cita)}
                  onCancelar={setCitaACancelar} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   APP PRINCIPAL
───────────────────────────────────────────── */
export default function DashboardPaciente({ user }) {
  const [seccion, setSeccion] = useState("dashboard");
  const [citas, setCitas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, "citas"), where("pacienteId", "==", user.uid)),
      snap => setCitas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [user?.uid]);

  const handleLogout = async () => { await signOut(auth); navigate("/"); };

  return (
    <>
      {/* Fuente Nunito desde Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        body, * { font-family: 'Nunito', sans-serif; }
        @keyframes slide-up { from { transform:translateY(40px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .animate-slide-up { animation: slide-up 0.3s ease; }
        .animate-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
      `}</style>

      <div className="flex min-h-screen" style={{ background: C.bg }}>
        <Sidebar seccion={seccion} setSeccion={setSeccion} user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col min-w-0">
          <HeaderMovil user={user} seccion={seccion} />
          {seccion === "dashboard" && <DashboardView user={user} citas={citas} setSeccion={setSeccion} />}
          {seccion === "agendar"   && <AgendarCita   user={user} onCitaAgendada={() => setSeccion("miscitas")} />}
          {seccion === "miscitas"  && <MisCitas       citas={citas} />}
        </div>
        <BottomNav seccion={seccion} setSeccion={setSeccion} onLogout={handleLogout} />
      </div>
    </>
  );
}