import { useState } from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const CITAS_EJEMPLO = [
  { id: 1, paciente: "María González", tipo: "Consulta general", fecha: "2026-05-18", hora: "10:00 AM", estado: "confirmada", avatar: "MG" },
  { id: 2, paciente: "Carlos López",   tipo: "Seguimiento",      fecha: "2026-05-19", hora: "11:00 AM", estado: "pendiente",  avatar: "CL" },
  { id: 3, paciente: "Ana Torres",     tipo: "Primera consulta", fecha: "2026-05-21", hora: "03:00 PM", estado: "confirmada", avatar: "AT" },
  { id: 4, paciente: "Luis Mendoza",   tipo: "Revisión",         fecha: "2026-05-22", hora: "09:30 AM", estado: "confirmada", avatar: "LM" },
  { id: 5, paciente: "Rosa Díaz",      tipo: "Consulta general", fecha: "2026-05-16", hora: "09:00 AM", estado: "confirmada", avatar: "RD" },
  { id: 6, paciente: "Pedro Ruiz",     tipo: "Seguimiento",      fecha: "2026-05-16", hora: "10:30 AM", estado: "pendiente",  avatar: "PR" },
  { id: 7, paciente: "Laura Vega",     tipo: "Revisión",         fecha: "2026-05-16", hora: "12:00 PM", estado: "confirmada", avatar: "LV" },
  { id: 8, paciente: "Jorge Mora",     tipo: "Primera consulta", fecha: "2026-05-16", hora: "04:00 PM", estado: "confirmada", avatar: "JM" },
];

const DIAS_CON_CITAS = [4,5,6,7,8,11,12,13,14,15,16,18,19,20,21,22,25,26,28];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function avatarColor(initials) {
  const colors = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4"];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1)||0)) % colors.length;
  return colors[idx];
}

function EstadoBadge({ estado }) {
  if (estado === "confirmada") return <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium whitespace-nowrap">Confirmada</span>;
  if (estado === "pendiente")  return <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium whitespace-nowrap">Pendiente</span>;
  return <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium whitespace-nowrap">Cancelada</span>;
}

function Calendario({ diasConCitas }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasPrevios = new Date(anio, mes, 0).getDate();
  const celdas = [];
  for (let i = primerDia - 1; i >= 0; i--) celdas.push({ dia: diasPrevios - i, actual: false });
  for (let i = 1; i <= diasEnMes; i++) celdas.push({ dia: i, actual: true });
  while (celdas.length % 7 !== 0) celdas.push({ dia: celdas.length - primerDia - diasEnMes + 1, actual: false });
  const esHoy = (dia) => dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Calendario de citas</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1); }} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-sm">‹</button>
          <span className="text-xs font-medium text-gray-700">{MESES[mes].slice(0,3)} {anio}</span>
          <button onClick={() => { if (mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1); }} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-sm">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs text-gray-400 py-1">{d.slice(0,1)}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {celdas.map((celda, idx) => (
          <div key={idx} className="flex flex-col items-center py-0.5">
            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs
              ${!celda.actual ? "text-gray-300" : "text-gray-700"}
              ${celda.actual && esHoy(celda.dia) ? "bg-blue-600 text-white font-bold" : ""}
              ${celda.actual && !esHoy(celda.dia) ? "hover:bg-blue-50 cursor-pointer" : ""}
            `}>{celda.dia}</span>
            {celda.actual && diasConCitas.includes(celda.dia) && !esHoy(celda.dia) && <span className="w-1 h-1 rounded-full bg-blue-400 mt-0.5"></span>}
            {celda.actual && esHoy(celda.dia) && diasConCitas.includes(celda.dia) && <span className="w-1 h-1 rounded-full bg-blue-300 mt-0.5"></span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar desktop ────────────────────────────────────────────────────────
function Sidebar({ seccion, setSeccion, user, onLogout }) {
  const items = [
    { id: "overview",  label: "Overview",  icon: "⊞" },
    { id: "citas",     label: "Mis citas", icon: "📅" },
    { id: "proximas",  label: "Próximas",  icon: "🕐" },
    { id: "historial", label: "Historial", icon: "📋" },
  ];
  return (
    <aside className="hidden md:flex w-56 min-h-screen bg-white border-r border-gray-100 flex-col flex-shrink-0 shadow-sm">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
          <p className="text-blue-900 font-semibold text-lg leading-none">Citas Médicas</p>
        </div>
      </div>
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold border-2 border-blue-300">
          {user?.nombre?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"DR"}
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-sm">{user?.nombre||"Dr. Médico"}</p>
          <p className="text-gray-400 text-xs">{user?.especialidad||"Médico general"}</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {items.map(item => (
          <button key={item.id} onClick={() => setSeccion(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
              ${seccion===item.id ? "bg-blue-600 text-white" : "text-blue-900 hover:bg-blue-50"}`}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="px-3 pb-5 pt-3 border-t border-gray-100">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all">
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ── Bottom nav móvil ───────────────────────────────────────────────────────
function BottomNav({ seccion, setSeccion, onLogout }) {
  const items = [
    { id: "General",  label: "General",   icon: "" },
    { id: "Citas",     label: "Citas",    icon: "" },
    { id: "Próximas",  label: "Próximas", icon: "" },
    { id: "Historial", label: "Historial",icon: "" },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex">
      {items.map(item => (
        <button key={item.id} onClick={() => setSeccion(item.id)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-all
            ${seccion===item.id ? "text-blue-600" : "text-gray-400"}`}>
          <span className="text-lg leading-none">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      <button onClick={onLogout} className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium text-gray-400">
        <span className="text-lg leading-none"></span>
        <span>Salir</span>
      </button>
    </nav>
  );
}

// ── Header móvil ───────────────────────────────────────────────────────────
function HeaderMovil({ user, seccion }) {
  const titulos = { overview: "Overview", citas: "Mis citas", proximas: "Próximas", historial: "Historial" };
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
        <span className="text-blue-900 font-semibold text-sm">{titulos[seccion]}</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
        {user?.nombre?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"DR"}
      </div>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────
function Overview({ user, citas, setSeccion }) {
  const hoy = getToday();
  const citasHoy = citas.filter(c => c.fecha === hoy);
  const confirmadas = citasHoy.filter(c => c.estado==="confirmada").length;
  const pendientes  = citasHoy.filter(c => c.estado==="pendiente").length;
  const proxima = citas.filter(c => c.fecha >= hoy).sort((a,b) => a.fecha.localeCompare(b.fecha))[0];
  const proximas = citas.filter(c => c.fecha > hoy).sort((a,b) => a.fecha.localeCompare(b.fecha)).slice(0,4);
  const fechaHoy = new Date();

  function diasRestantes(fecha) {
    const hoyD = new Date(); hoyD.setHours(0,0,0,0);
    const diff = Math.round((new Date(fecha+"T00:00:00") - hoyD) / 86400000);
    if (diff===0) return "Hoy"; if (diff===1) return "Mañana"; return `En ${diff} días`;
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 pb-20 md:pb-6">
      {/* Header solo desktop */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido, {user?.nombre?.split(" ")[0]||"Dr."}! 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Aquí tienes un resumen de tus citas y pacientes.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <span className="text-blue-600 text-sm">📅</span>
          <div>
            <p className="text-xs font-semibold text-gray-800">{fechaHoy.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})}</p>
            <p className="text-xs text-gray-400">{fechaHoy.toLocaleDateString("es-MX",{weekday:"long"})}</p>
          </div>
        </div>
      </div>

      {/* Saludo móvil */}
      <div className="md:hidden mb-4">
        <h1 className="text-lg font-bold text-gray-900">¡Hola, {user?.nombre?.split(" ")[0]||"Dr."}! 👋</h1>
        <p className="text-gray-400 text-xs">{fechaHoy.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}</p>
      </div>

      {/* Widgets — 1 col móvil, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-lg flex-shrink-0">📅</div>
            <div>
              <p className="text-xs text-gray-500">Citas de hoy</p>
              <p className="text-2xl font-bold text-gray-900">{citasHoy.length}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{confirmadas} confirm.</span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{pendientes} pend.</span>
          </div>
          <button onClick={() => setSeccion("citas")} className="mt-2 text-xs text-blue-600 font-medium">Ver agenda →</button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-lg flex-shrink-0">👤</div>
            <p className="text-xs text-green-600 font-medium">Próxima cita</p>
          </div>
          {proxima ? (
            <>
              <p className="text-base font-bold text-gray-900">{proxima.paciente}</p>
              <p className="text-xs text-gray-500">{proxima.tipo}</p>
              <p className="text-xs font-medium text-gray-700 mt-1">
                {new Date(proxima.fecha+"T00:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})} · {proxima.hora}
              </p>
              <span className="mt-1 inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{diasRestantes(proxima.fecha)}</span>
            </>
          ) : <p className="text-xs text-gray-400">Sin citas próximas</p>}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 text-lg flex-shrink-0">👥</div>
            <div>
              <p className="text-xs text-gray-500">Pacientes atendidos</p>
              <p className="text-2xl font-bold text-gray-900">28</p>
              <p className="text-xs text-gray-400">esta semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario + próximas — apilados en móvil, lado a lado en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Calendario diasConCitas={DIAS_CON_CITAS} />
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Próximas citas</h3>
          <div className="flex flex-col gap-3">
            {proximas.map(cita => {
              const fecha = new Date(cita.fecha+"T00:00:00");
              return (
                <div key={cita.id} className="flex items-center gap-3">
                  <div className="text-center flex-shrink-0 w-9">
                    <p className="text-xs font-bold text-blue-600 uppercase">{MESES[fecha.getMonth()].slice(0,3)}</p>
                    <p className="text-base font-bold text-gray-800 leading-none">{fecha.getDate()}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100 flex-shrink-0"></div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:avatarColor(cita.avatar)}}>{cita.avatar}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{cita.paciente}</p>
                      <p className="text-xs text-gray-400">{cita.hora}</p>
                    </div>
                  </div>
                  <EstadoBadge estado={cita.estado} />
                </div>
              );
            })}
          </div>
          <button onClick={() => setSeccion("proximas")} className="mt-3 text-xs text-blue-600 font-medium">Ver todas →</button>
        </div>
      </div>
    </div>
  );
}

// ── Mis Citas ──────────────────────────────────────────────────────────────
function MisCitas({ citas }) {
  const [vista, setVista] = useState("dia");
  const hoy = getToday();
  const filtradas = vista==="dia" ? citas.filter(c=>c.fecha===hoy)
    : vista==="semana" ? citas.filter(c=>{ const diff=(new Date(c.fecha+"T00:00:00")-new Date())/86400000; return diff>=-1&&diff<=7; })
    : citas;

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Mis citas</h2>
          <p className="text-gray-500 text-xs md:text-sm">Gestiona y revisa tus citas</p>
        </div>
        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {["dia","semana","mes"].map(v => (
            <button key={v} onClick={() => setVista(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${vista===v?"bg-blue-600 text-white":"text-gray-500 hover:bg-gray-50"}`}>
              {v==="dia"?"Día":v==="semana"?"Semana":"Mes"}
            </button>
          ))}
        </div>
      </div>
      {filtradas.length===0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <p className="text-4xl mb-3">📅</p><p className="text-gray-500 text-sm">No hay citas para este período</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map(cita => (
            <div key={cita.id} className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className={`w-1 h-10 rounded-full flex-shrink-0 ${cita.estado==="confirmada"?"bg-green-400":"bg-orange-400"}`}></div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:avatarColor(cita.avatar)}}>{cita.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{cita.paciente}</p>
                <p className="text-xs text-gray-500 truncate">{cita.tipo}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-gray-700">{cita.hora}</p>
                <p className="text-xs text-gray-400">{new Date(cita.fecha+"T00:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})}</p>
              </div>
              <EstadoBadge estado={cita.estado} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Próximas ───────────────────────────────────────────────────────────────
function Proximas({ citas }) {
  const hoy = getToday();
  const proximas = citas.filter(c=>c.fecha>=hoy).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 pb-20 md:pb-6">
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Próximas citas</h2>
        <p className="text-gray-500 text-xs md:text-sm">Citas agendadas a partir de hoy</p>
      </div>
      <div className="flex flex-col gap-3">
        {proximas.map(cita => {
          const fecha = new Date(cita.fecha+"T00:00:00");
          return (
            <div key={cita.id} className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="text-center flex-shrink-0 w-10">
                <p className="text-xs font-bold text-blue-600 uppercase">{MESES[fecha.getMonth()].slice(0,3)}</p>
                <p className="text-xl font-bold text-gray-800 leading-none">{fecha.getDate()}</p>
              </div>
              <div className="w-px h-10 bg-gray-100 flex-shrink-0"></div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:avatarColor(cita.avatar)}}>{cita.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{cita.paciente}</p>
                <p className="text-xs text-gray-500">{cita.tipo} · {cita.hora}</p>
              </div>
              <EstadoBadge estado={cita.estado} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Historial ──────────────────────────────────────────────────────────────
function Historial({ citas }) {
  const hoy = getToday();
  const pasadas = citas.filter(c=>c.fecha<hoy).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 pb-20 md:pb-6">
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Historial de pacientes</h2>
        <p className="text-gray-500 text-xs md:text-sm">Citas anteriores atendidas</p>
      </div>
      {pasadas.length===0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <p className="text-4xl mb-3">📋</p><p className="text-gray-500 text-sm">Sin historial por el momento</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pasadas.map(cita => {
            const fecha = new Date(cita.fecha+"T00:00:00");
            return (
              <div key={cita.id} className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:avatarColor(cita.avatar)}}>{cita.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{cita.paciente}</p>
                  <p className="text-xs text-gray-500">{cita.tipo}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-700">{cita.hora}</p>
                  <p className="text-xs text-gray-400">{fecha.toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"})}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium whitespace-nowrap">Atendida</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────────
export default function DashboardMedico({ user }) {
  const [seccion, setSeccion] = useState("overview");
  const [citas] = useState(CITAS_EJEMPLO);
  const navigate = useNavigate();

  const handleLogout = async () => { await signOut(auth); navigate("/"); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar seccion={seccion} setSeccion={setSeccion} user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderMovil user={user} seccion={seccion} />
        {seccion==="overview"  && <Overview  user={user} citas={citas} setSeccion={setSeccion} />}
        {seccion==="citas"     && <MisCitas  citas={citas} />}
        {seccion==="proximas"  && <Proximas  citas={citas} />}
        {seccion==="historial" && <Historial citas={citas} />}
      </div>
      <BottomNav seccion={seccion} setSeccion={setSeccion} onLogout={handleLogout} />
    </div>
  );
}