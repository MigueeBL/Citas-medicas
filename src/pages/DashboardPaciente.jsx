import { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import {
  collection, query, where, getDocs,
  addDoc, onSnapshot, Timestamp, doc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const C = {
  dark:  "#2f4157",
  mid:   "#567c8e",
  light: "#a2c1d1",
  soft:  "#c7d9e5",
  pale:  "#e3ecf2",
  bg:    "#f3f6f9",
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio",
               "Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function avatarColor(str) {
  const colors = [C.dark, C.mid, "#3d6b7d", "#4a7a8a", "#2a5068", "#1e3a4f"];
  return colors[(str?.charCodeAt(0)||0) % colors.length];
}

function EstadoBadge({ estado }) {
  if (estado === "confirmada") return <span className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap" style={{background: C.pale, color: C.dark}}>Confirmada</span>;
  if (estado === "pendiente")  return <span className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap bg-amber-100 text-amber-700">Pendiente</span>;
  if (estado === "cobrada")    return <span className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap bg-green-100 text-green-700">Cobrada</span>;
  return <span className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap bg-red-100 text-red-600">Cancelada</span>;
}

// ── Sidebar desktop ────────────────────────────────────────────────────────
function Sidebar({ seccion, setSeccion, user, onLogout }) {
  const items = [
    { id: "dashboard", label: "Dashboard",    icon: "⊞" },
    { id: "agendar",   label: "Agendar cita", icon: "➕" },
    { id: "miscitas",  label: "Mis citas",    icon: "📅" },
  ];
  return (
    <aside className="hidden md:flex w-56 min-h-screen flex-col flex-shrink-0" style={{background: C.dark}}>
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
          <p className="font-semibold text-lg leading-none text-white">Citas Médicas</p>
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col items-center gap-2" style={{borderBottom:`1px solid ${C.mid}40`}}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold border-2"
          style={{background: C.mid, borderColor: C.light}}>
          {user?.nombre?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"PA"}
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm text-white">{user?.nombre||"Paciente"}</p>
          <p className="text-xs" style={{color: C.light}}>Paciente</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {items.map(item => (
          <button key={item.id} onClick={() => setSeccion(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
            style={{background: seccion===item.id ? C.mid : "transparent", color: seccion===item.id ? "white" : C.soft}}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="px-3 pb-5 pt-3" style={{borderTop:`1px solid ${C.mid}40`}}>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all" style={{color: C.light}}>
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ── Bottom nav móvil ───────────────────────────────────────────────────────
function BottomNav({ seccion, setSeccion, onLogout }) {
  const items = [
    { id: "dashboard", label: "Inicio",  icon: "⊞" },
    { id: "agendar",   label: "Agendar", icon: "➕" },
    { id: "miscitas",  label: "Mis citas",icon:"📅" },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{background: "white", borderTop:`1px solid ${C.soft}`}}>
      {items.map(item => (
        <button key={item.id} onClick={() => setSeccion(item.id)}
          className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-all"
          style={{color: seccion===item.id ? C.dark : C.light}}>
          <span className="text-lg leading-none">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      <button onClick={onLogout} className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium" style={{color: C.light}}>
        <span className="text-lg leading-none">🚪</span>
        <span>Salir</span>
      </button>
    </nav>
  );
}

// ── Header móvil ───────────────────────────────────────────────────────────
function HeaderMovil({ user, seccion }) {
  const titulos = { dashboard:"Dashboard", agendar:"Agendar cita", miscitas:"Mis citas" };
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
      style={{background:"white", borderBottom:`1px solid ${C.soft}`}}>
      <div className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
        <span className="font-semibold text-sm" style={{color: C.dark}}>{titulos[seccion]}</span>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background: C.mid}}>
        {user?.nombre?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"PA"}
      </div>
    </div>
  );
}

// ── Dashboard view ─────────────────────────────────────────────────────────
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
    const diff = Math.round((new Date(fecha+"T00:00:00") - hoyD) / 86400000);
    if (diff===0) return "Hoy"; if (diff===1) return "Mañana"; return `En ${diff} días`;
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6" style={{background: C.bg}}>
      {/* Header desktop */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{color: C.dark}}>
            ¡Hola, {user?.nombre?.split(" ")[0]||"Paciente"}! 👋
          </h1>
          <p className="text-sm mt-0.5" style={{color: C.mid}}>Aquí tienes un resumen de tus citas médicas.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 shadow-sm"
          style={{background:"white", border:`1px solid ${C.soft}`}}>
          <span className="text-sm">📅</span>
          <div>
            <p className="text-xs font-semibold" style={{color: C.dark}}>
              {fechaHoy.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})}
            </p>
            <p className="text-xs" style={{color: C.light}}>
              {fechaHoy.toLocaleDateString("es-MX",{weekday:"long"})}
            </p>
          </div>
        </div>
      </div>

      {/* Saludo móvil */}
      <div className="md:hidden mb-4">
        <h1 className="text-lg font-bold" style={{color: C.dark}}>
          ¡Hola, {user?.nombre?.split(" ")[0]||"Paciente"}! 👋
        </h1>
        <p className="text-xs" style={{color: C.mid}}>
          {fechaHoy.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}
        </p>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Próxima cita */}
        <div className="rounded-2xl p-4 shadow-sm sm:col-span-2" style={{background:"white", border:`1px solid ${C.soft}`}}>
          <p className="text-xs font-medium mb-3" style={{color: C.mid}}>📋 Próxima cita</p>
          {proxima ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{background: avatarColor(proxima.medicoNombre)}}>
                {proxima.medicoNombre?.split(" ").filter(w=>w.length>2).map(w=>w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate" style={{color: C.dark}}>{proxima.medicoNombre}</p>
                <p className="text-xs" style={{color: C.mid}}>{proxima.especialidad}</p>
                <p className="text-xs font-medium mt-1" style={{color: C.dark}}>
                  {new Date(proxima.fecha+"T00:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"long"})} · {proxima.hora}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{background: C.pale, color: C.mid}}>
                  {diasRestantes(proxima.fecha)}
                </span>
                <p className="text-xs mt-1" style={{color: C.light}}>${proxima.monto} MXN</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm" style={{color: C.light}}>No tienes citas próximas.</p>
              <button onClick={() => setSeccion("agendar")}
                className="text-xs font-medium px-3 py-1.5 rounded-xl text-white"
                style={{background: C.mid}}>
                Agendar ahora →
              </button>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="rounded-2xl p-4 shadow-sm" style={{background:"white", border:`1px solid ${C.soft}`}}>
          <p className="text-xs" style={{color: C.mid}}>Citas totales</p>
          <p className="text-3xl font-bold my-1" style={{color: C.dark}}>{citas.length}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{background: C.pale, color: C.dark}}>
              {proximas.length} próximas
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {pasadas.length} pasadas
            </span>
          </div>
          <button onClick={() => setSeccion("agendar")} className="mt-3 text-xs font-medium" style={{color: C.mid}}>
            + Agendar cita
          </button>
        </div>
      </div>

      {/* Próximas */}
      {proximas.length > 0 && (
        <div className="rounded-2xl p-4 shadow-sm mb-4" style={{background:"white", border:`1px solid ${C.soft}`}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{color: C.dark}}>Próximas citas</h3>
            <button onClick={() => setSeccion("miscitas")} className="text-xs" style={{color: C.mid}}>Ver todas →</button>
          </div>
          <div className="flex flex-col gap-3">
            {proximas.slice(0,3).map(cita => {
              const fecha = new Date(cita.fecha+"T00:00:00");
              return (
                <div key={cita.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background: C.bg}}>
                  <div className="text-center flex-shrink-0 w-10">
                    <p className="text-xs font-bold uppercase" style={{color: C.mid}}>{MESES[fecha.getMonth()].slice(0,3)}</p>
                    <p className="text-lg font-bold leading-none" style={{color: C.dark}}>{fecha.getDate()}</p>
                  </div>
                  <div className="w-px h-8 flex-shrink-0" style={{background: C.soft}}></div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{background: avatarColor(cita.medicoNombre)}}>
                    {cita.medicoNombre?.split(" ").filter(w=>w.length>2).map(w=>w[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{color: C.dark}}>{cita.medicoNombre}</p>
                    <p className="text-xs" style={{color: C.light}}>{cita.especialidad} · {cita.hora}</p>
                  </div>
                  <EstadoBadge estado={cita.estado} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial */}
      {pasadas.length > 0 && (
        <div className="rounded-2xl p-4 shadow-sm" style={{background:"white", border:`1px solid ${C.soft}`}}>
          <h3 className="text-sm font-semibold mb-3" style={{color: C.dark}}>Historial reciente</h3>
          <div className="flex flex-col gap-2">
            {pasadas.slice(0,3).map(cita => {
              const fecha = new Date(cita.fecha+"T00:00:00");
              return (
                <div key={cita.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{background: avatarColor(cita.medicoNombre)}}>
                    {cita.medicoNombre?.split(" ").filter(w=>w.length>2).map(w=>w[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{color: C.dark}}>{cita.medicoNombre}</p>
                    <p className="text-xs" style={{color: C.light}}>
                      {fecha.toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"})}
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

// ── Agendar cita — conectado a Firestore ───────────────────────────────────
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

  // Cargar médicos aprobados con horarios de Firestore
  useEffect(() => {
    const fetchMedicos = async () => {
      setCargandoMedicos(true);
      const snap = await getDocs(
        query(collection(db, "usuarios"),
          where("rol", "==", "medico"),
          where("estado", "==", "aprobado")
        )
      );
      const lista = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.horarios && m.horarios.length > 0); // solo médicos con horarios
      setMedicos(lista);
      setCargandoMedicos(false);
    };
    fetchMedicos();
  }, []);

  // Cuando cambia médico o fecha, cargar horas ocupadas
  useEffect(() => {
    if (!medicoSel || !fecha) return;
    const fetchOcupadas = async () => {
      setCargandoHoras(true);
      const snap = await getDocs(
        query(collection(db, "citas"),
          where("medicoId", "==", medicoSel.id),
          where("fecha", "==", fecha),
          where("estado", "!=", "cancelada")
        )
      );
      setHorasOcupadas(snap.docs.map(d => d.data().hora));
      setCargandoHoras(false);
    };
    fetchOcupadas();
  }, [medicoSel, fecha]);

  const medicosFiltrados = medicos.filter(m =>
    m.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.especialidad?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const confirmarCita = async () => {
    if (!medicoSel || !fecha || !horaSel) return;
    setGuardando(true);
    try {
      await addDoc(collection(db, "citas"), {
        pacienteId:    user.uid,
        paciente:      user.nombre,
        medicoId:      medicoSel.id,
        medicoNombre:  medicoSel.nombre,
        especialidad:  medicoSel.especialidad,
        fecha,
        hora:          horaSel,
        monto:         medicoSel.precio || 0,
        estado:        "pendiente",
        fechaCreacion: new Date().toISOString(),
      });
      setExito(true);
      onCitaAgendada();
    } catch (e) {
      console.error("Error al agendar:", e);
    }
    setGuardando(false);
  };

  if (exito) return (
    <div className="flex-1 flex items-center justify-center p-6" style={{background: C.bg}}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4" style={{background: C.pale}}>✅</div>
        <h2 className="text-xl font-bold mb-2" style={{color: C.dark}}>¡Cita agendada!</h2>
        <p className="text-sm mb-1" style={{color: C.mid}}>{medicoSel?.nombre}</p>
        <p className="text-sm mb-1" style={{color: C.mid}}>
          {new Date(fecha+"T00:00:00").toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})} · {horaSel}
        </p>
        <p className="text-xs mb-6" style={{color: C.light}}>Tu cita está pendiente de confirmación por el asistente.</p>
        <button onClick={() => { setExito(false); setPaso(1); setMedicoSel(null); setFecha(""); setHoraSel(""); }}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-medium" style={{background: C.mid}}>
          Agendar otra cita
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6" style={{background: C.bg}}>
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-bold" style={{color: C.dark}}>Agendar cita</h2>
        <p className="text-xs md:text-sm" style={{color: C.mid}}>Selecciona tu médico, fecha y hora</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {[{n:1,label:"Médico"},{n:2,label:"Fecha y hora"},{n:3,label:"Confirmación"}].map((s,idx) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{background: paso>=s.n ? C.dark : C.soft, color: paso>=s.n ? "white" : C.light}}>
                {paso>s.n ? "✓" : s.n}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{color: paso>=s.n ? C.dark : C.light}}>
                {s.label}
              </span>
            </div>
            {idx<2 && <div className="h-px w-6 sm:w-12" style={{background: paso>s.n ? C.mid : C.soft}}></div>}
          </div>
        ))}
      </div>

      {/* Paso 1: Médico */}
      {paso === 1 && (
        <div>
          {cargandoMedicos ? (
            <div className="text-center py-10" style={{color: C.mid}}>Cargando médicos...</div>
          ) : medicos.length === 0 ? (
            <div className="rounded-2xl p-10 text-center shadow-sm" style={{background:"white", border:`1px solid ${C.soft}`}}>
              <p className="text-4xl mb-3">🩺</p>
              <p className="text-sm" style={{color: C.mid}}>No hay médicos disponibles con horarios asignados aún.</p>
            </div>
          ) : (
            <>
              <input type="text" placeholder="Buscar médico o especialidad..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm mb-4 outline-none"
                style={{background:"white", border:`1px solid ${C.soft}`, color: C.dark}} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {medicosFiltrados.map(medico => (
                  <button key={medico.id} onClick={() => { setMedicoSel(medico); setPaso(2); setHoraSel(""); }}
                    className="text-left p-4 rounded-2xl shadow-sm transition-all"
                    style={{
                      background: medicoSel?.id===medico.id ? C.pale : "white",
                      border: `1px solid ${medicoSel?.id===medico.id ? C.mid : C.soft}`,
                    }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{background: avatarColor(medico.nombre)}}>
                        {medico.nombre?.split(" ").filter(w=>w.length>2).map(w=>w[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{color: C.dark}}>{medico.nombre}</p>
                        <p className="text-xs" style={{color: C.mid}}>{medico.especialidad}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{color: C.light}}>
                        {medico.horarios?.length} horarios disponibles
                      </span>
                      <span className="text-sm font-bold" style={{color: C.dark}}>
                        {medico.precio ? `$${medico.precio}` : "Consultar precio"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Paso 2: Fecha y hora */}
      {paso === 2 && medicoSel && (
        <div className="max-w-lg">
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
            style={{background:"white", border:`1px solid ${C.soft}`}}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{background: avatarColor(medicoSel.nombre)}}>
              {medicoSel.nombre?.split(" ").filter(w=>w.length>2).map(w=>w[0]).join("").slice(0,2)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{color: C.dark}}>{medicoSel.nombre}</p>
              <p className="text-xs" style={{color: C.mid}}>{medicoSel.especialidad}</p>
            </div>
            <button onClick={() => { setPaso(1); setHoraSel(""); setFecha(""); }}
              className="text-xs" style={{color: C.mid}}>Cambiar</button>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold block mb-2" style={{color: C.dark}}>Selecciona la fecha</label>
            <input type="date" min={hoy} value={fecha}
              onChange={e => { setFecha(e.target.value); setHoraSel(""); }}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{background:"white", border:`1px solid ${C.soft}`, color: C.dark}} />
          </div>

          {fecha && (
            <div className="mb-4">
              <label className="text-xs font-semibold block mb-2" style={{color: C.dark}}>
                Horarios disponibles
              </label>
              {cargandoHoras ? (
                <p className="text-xs" style={{color: C.mid}}>Verificando disponibilidad...</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {medicoSel.horarios?.map(hora => {
                    const ocupada = horasOcupadas.includes(hora);
                    return (
                      <button key={hora}
                        disabled={ocupada}
                        onClick={() => !ocupada && setHoraSel(hora)}
                        className="py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: ocupada ? "#f3f4f6" : horaSel===hora ? C.dark : "white",
                          color: ocupada ? "#c0c0c0" : horaSel===hora ? "white" : C.mid,
                          border: `1px solid ${ocupada ? "#e5e7eb" : horaSel===hora ? C.dark : C.soft}`,
                          cursor: ocupada ? "not-allowed" : "pointer",
                          textDecoration: ocupada ? "line-through" : "none",
                        }}>
                        {hora}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={() => setPaso(1)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{background: C.pale, color: C.dark}}>← Volver</button>
            <button onClick={() => setPaso(3)} disabled={!fecha || !horaSel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{background: fecha && horaSel ? C.dark : C.light, cursor: fecha && horaSel ? "pointer" : "not-allowed"}}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Confirmación */}
      {paso === 3 && medicoSel && (
        <div className="max-w-lg">
          <div className="rounded-2xl p-5 mb-4" style={{background:"white", border:`1px solid ${C.soft}`}}>
            <h3 className="text-sm font-semibold mb-4" style={{color: C.dark}}>Resumen de tu cita</h3>
            <div className="flex flex-col gap-3">
              {[
                ["Médico",      medicoSel.nombre],
                ["Especialidad",medicoSel.especialidad],
                ["Fecha", new Date(fecha+"T00:00:00").toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})],
                ["Hora",        horaSel],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs" style={{color: C.mid}}>{label}</span>
                  <span className="text-xs font-medium" style={{color: C.dark}}>{value}</span>
                </div>
              ))}
              <div className="h-px" style={{background: C.soft}}></div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold" style={{color: C.dark}}>Total</span>
                <span className="text-lg font-bold" style={{color: C.dark}}>
                  {medicoSel.precio ? `$${medicoSel.precio} MXN` : "A consultar"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-4 text-xs" style={{background:"#fef3c7", color:"#92400e"}}>
            ⚠️ Tu cita quedará como <strong>pendiente</strong> hasta que el asistente la confirme.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso(2)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{background: C.pale, color: C.dark}}>← Volver</button>
            <button onClick={confirmarCita} disabled={guardando}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{background: C.dark}}>
              {guardando ? "Guardando..." : "✓ Confirmar cita"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mis citas — datos reales de Firestore ──────────────────────────────────
function MisCitas({ citas }) {
  const [filtro, setFiltro] = useState("todas");
  const hoy = getToday();

  const filtradas = filtro==="proximas"
    ? citas.filter(c => c.fecha >= hoy && c.estado !== "cancelada").sort((a,b) => a.fecha.localeCompare(b.fecha))
    : filtro==="pasadas"
    ? citas.filter(c => c.fecha < hoy).sort((a,b) => b.fecha.localeCompare(a.fecha))
    : [...citas].sort((a,b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6" style={{background: C.bg}}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold" style={{color: C.dark}}>Mis citas</h2>
          <p className="text-xs md:text-sm" style={{color: C.mid}}>Todas tus citas médicas</p>
        </div>
        <div className="flex rounded-xl overflow-hidden shadow-sm" style={{border:`1px solid ${C.soft}`}}>
          {["todas","proximas","pasadas"].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1.5 text-xs font-medium transition-all capitalize"
              style={{background: filtro===f ? C.dark : "white", color: filtro===f ? "white" : C.mid}}>
              {f==="todas"?"Todas":f==="proximas"?"Próximas":"Pasadas"}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length===0 ? (
        <div className="rounded-2xl p-10 text-center shadow-sm" style={{background:"white", border:`1px solid ${C.soft}`}}>
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm" style={{color: C.mid}}>No hay citas en esta categoría</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map(cita => {
            const fecha = new Date(cita.fecha+"T00:00:00");
            return (
              <div key={cita.id} className="rounded-2xl p-4 shadow-sm" style={{background:"white", border:`1px solid ${C.soft}`}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{background: avatarColor(cita.medicoNombre)}}>
                    {cita.medicoNombre?.split(" ").filter(w=>w.length>2).map(w=>w[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{color: C.dark}}>{cita.medicoNombre}</p>
                    <p className="text-xs" style={{color: C.mid}}>{cita.especialidad}</p>
                  </div>
                  <EstadoBadge estado={cita.estado} />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{borderTop:`1px solid ${C.soft}`}}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs" style={{color: C.mid}}>
                      📅 {fecha.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})}
                    </span>
                    <span className="text-xs" style={{color: C.mid}}>🕐 {cita.hora}</span>
                  </div>
                  {cita.monto > 0 && (
                    <span className="text-sm font-bold" style={{color: C.dark}}>${cita.monto} MXN</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────────
export default function DashboardPaciente({ user }) {
  const [seccion, setSeccion] = useState("dashboard");
  const [citas, setCitas] = useState([]);
  const navigate = useNavigate();

  // Escuchar citas del paciente en tiempo real
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, "citas"), where("pacienteId", "==", user.uid)),
      (snap) => {
        setCitas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, [user?.uid]);

  const handleLogout = async () => { await signOut(auth); navigate("/"); };

  return (
    <div className="flex min-h-screen" style={{background: C.bg}}>
      <Sidebar seccion={seccion} setSeccion={setSeccion} user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderMovil user={user} seccion={seccion} />
        {seccion==="dashboard" && <DashboardView user={user} citas={citas} setSeccion={setSeccion} />}
        {seccion==="agendar"   && <AgendarCita   user={user} onCitaAgendada={() => setSeccion("miscitas")} />}
        {seccion==="miscitas"  && <MisCitas       citas={citas} />}
      </div>
      <BottomNav seccion={seccion} setSeccion={setSeccion} onLogout={handleLogout} />
    </div>
  );
}