import { useState } from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import IconoInicio from "../assets/iconos/icono_inicio.svg?react";
import IconoCitas from "../assets/iconos/icono_citas.svg?react";
import IconoProximas from "../assets/iconos/icono_proximas.svg?react";
import IconoHistorial from "../assets/iconos/icono_historial.svg?react";
import IconoSalir from "../assets/iconos/icono_salir.svg?react";


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


const C = {
  dark:    "#2f4157",
  mid:     "#567c8e",
  light:   "#a2c1d1",
  soft:    "#c7d9e5",
  pale:    "#e3ecf2",
  bg:      "#f3f6f9",
};

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function avatarColor(initials) {
  const colors = [C.dark, C.mid, "#3d6b7d", "#4a7a8a", "#2a5068", "#1e3a4f"];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1)||0)) % colors.length;
  return colors[idx];
}

function EstadoBadge({ estado }) {
  if (estado === "confirmada") return (
    <span style={{background: C.pale, color: C.dark}} className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap border" style2={{borderColor: C.soft}}>
      Confirmada
    </span>
  );
  if (estado === "pendiente") return (
    <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
      Pendiente
    </span>
  );
  return <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap">Cancelada</span>;
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
    <div className="rounded-2xl p-5 shadow-sm" style={{background: "white", border: `1px solid ${C.soft}`}}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{color: C.dark}}>Calendario de citas</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => { if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1); }}
            className="w-6 h-6 flex items-center justify-center rounded-full text-sm transition-all"
            style={{color: C.mid}} onMouseEnter={e=>e.target.style.background=C.pale} onMouseLeave={e=>e.target.style.background="transparent"}>‹</button>
          <span className="text-xs font-medium" style={{color: C.dark}}>{MESES[mes].slice(0,3)} {anio}</span>
          <button onClick={() => { if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1); }}
            className="w-6 h-6 flex items-center justify-center rounded-full text-sm transition-all"
            style={{color: C.mid}} onMouseEnter={e=>e.target.style.background=C.pale} onMouseLeave={e=>e.target.style.background="transparent"}>›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{color: C.light}}>{d.slice(0,1)}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {celdas.map((celda, idx) => (
          <div key={idx} className="flex flex-col items-center py-0.5">
            <span className="w-7 h-7 flex items-center justify-center rounded-full text-xs cursor-pointer transition-all"
              style={{
                color: !celda.actual ? C.light : esHoy(celda.dia) ? "white" : C.dark,
                background: esHoy(celda.dia) ? C.dark : "transparent",
                fontWeight: esHoy(celda.dia) ? "700" : "400",
              }}>
              {celda.dia}
            </span>
            {celda.actual && diasConCitas.includes(celda.dia) && (
              <span className="w-1 h-1 rounded-full mt-0.5" style={{background: esHoy(celda.dia) ? C.soft : C.mid}}></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ seccion, setSeccion, user, onLogout }) {
  const items = [
    { id: "overview",  label: "Overview",  Icon: IconoInicio },
    { id: "citas",     label: "Mis citas", Icon: IconoCitas },
    { id: "proximas",  label: "Próximas",  Icon: IconoProximas },
    { id: "historial", label: "Historial", Icon: IconoHistorial },
  ];
  return (
    <aside className="hidden md:flex w-56 min-h-screen flex-col flex-shrink-0" style={{background: C.dark}}>
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
          <p className="font-semibold text-lg leading-none text-white">Citas Médicas</p>
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col items-center gap-2" style={{borderBottom: `1px solid ${C.mid}40`}}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold border-2"
          style={{background: C.mid, borderColor: C.light}}>
          {user?.nombre?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"DR"}
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm text-white">{user?.nombre||"Dr. Médico"}</p>
          <p className="text-xs" style={{color: C.light}}>{user?.especialidad||"Médico general"}</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {items.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setSeccion(id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
            style={{background: seccion===id ? C.mid : "transparent", color: seccion===id ? "white" : C.soft}}>
            <Icon style={{width:20, height:20, flexShrink:0}} />
            {label}
          </button>
        ))}
      </nav>
      <div className="px-3 pb-5 pt-3" style={{borderTop: `1px solid ${C.mid}40`}}>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{color: C.light}}>
          <IconoSalir style={{width:20, height:20, flexShrink:0}} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function BottomNav({ seccion, setSeccion, onLogout }) {
  const items = [
    { id: "overview",  label: "Inicio",    Icon: IconoInicio },
    { id: "citas",     label: "Citas",     Icon: IconoCitas },
    { id: "proximas",  label: "Próximas",  Icon: IconoProximas },
    { id: "historial", label: "Historial", Icon: IconoHistorial },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex" style={{background: "white", borderTop: `1px solid ${C.soft}`}}>
      {items.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => setSeccion(id)}
          className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-all"
          style={{color: seccion===id ? C.dark : C.light}}>
          <Icon style={{width:20, height:20}} />
          <span>{label}</span>
        </button>
      ))}
      <button onClick={onLogout}
        className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium"
        style={{color: C.light}}>
        <IconoSalir style={{width:20, height:20}} />
        <span>Salir</span>
      </button>
    </nav>
  );
}

function HeaderMovil({ user, seccion }) {
  const titulos = { overview:"Overview", citas:"Mis citas", proximas:"Próximas", historial:"Historial" };
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
      style={{background: "white", borderBottom: `1px solid ${C.soft}`}}>
      <div className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
        <span className="font-semibold text-sm" style={{color: C.dark}}>{titulos[seccion]}</span>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background: C.mid}}>
        {user?.nombre?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"DR"}
      </div>
    </div>
  );
}

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
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6" style={{background: C.bg}}>
      {/* Header desktop */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{color: C.dark}}>
            ¡Bienvenido, {user?.nombre?.split(" ")[0]||"Dr."}! 👋
          </h1>
          <p className="text-sm mt-0.5" style={{color: C.mid}}>Aquí tienes un resumen de tus citas y pacientes.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 shadow-sm"
          style={{background: "white", border: `1px solid ${C.soft}`}}>
          <span className="text-sm">📅</span>
          <div>
            <p className="text-xs font-semibold" style={{color: C.dark}}>{fechaHoy.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})}</p>
            <p className="text-xs" style={{color: C.light}}>{fechaHoy.toLocaleDateString("es-MX",{weekday:"long"})}</p>
          </div>
        </div>
      </div>

      {/* Saludo móvil */}
      <div className="md:hidden mb-4">
        <h1 className="text-lg font-bold" style={{color: C.dark}}>¡Hola, {user?.nombre?.split(" ")[0]||"Dr."}! 👋</h1>
        <p className="text-xs" style={{color: C.mid}}>{fechaHoy.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}</p>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Citas hoy */}
        <div className="rounded-2xl p-4 shadow-sm" style={{background: "white", border: `1px solid ${C.soft}`}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{background: C.pale}}>📅</div>
            <div>
              <p className="text-xs" style={{color: C.mid}}>Citas de hoy</p>
              <p className="text-2xl font-bold" style={{color: C.dark}}>{citasHoy.length}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background: C.pale, color: C.dark}}>{confirmadas} confirm.</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">{pendientes} pend.</span>
          </div>
          <button onClick={() => setSeccion("citas")} className="mt-2 text-xs font-medium" style={{color: C.mid}}>Ver agenda →</button>
        </div>

        {/* Próxima cita */}
        <div className="rounded-2xl p-4 shadow-sm" style={{background: "white", border: `1px solid ${C.soft}`}}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{background: C.pale}}>👤</div>
            <p className="text-xs font-medium" style={{color: C.mid}}>Próxima cita</p>
          </div>
          {proxima ? (
            <>
              <p className="text-base font-bold" style={{color: C.dark}}>{proxima.paciente}</p>
              <p className="text-xs" style={{color: C.mid}}>{proxima.tipo}</p>
              <p className="text-xs font-medium mt-1" style={{color: C.dark}}>
                {new Date(proxima.fecha+"T00:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})} · {proxima.hora}
              </p>
              <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium" style={{background: C.pale, color: C.mid}}>
                {diasRestantes(proxima.fecha)}
              </span>
            </>
          ) : <p className="text-xs" style={{color: C.light}}>Sin citas próximas</p>}
        </div>

        {/* Pacientes atendidos */}
        <div className="rounded-2xl p-4 shadow-sm" style={{background: "white", border: `1px solid ${C.soft}`}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{background: C.pale}}>👥</div>
            <div>
              <p className="text-xs" style={{color: C.mid}}>Pacientes atendidos</p>
              <p className="text-2xl font-bold" style={{color: C.dark}}>28</p>
              <p className="text-xs" style={{color: C.light}}>esta semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario + próximas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Calendario diasConCitas={DIAS_CON_CITAS} />

        <div className="rounded-2xl p-4 shadow-sm" style={{background: "white", border: `1px solid ${C.soft}`}}>
          <h3 className="text-sm font-semibold mb-4" style={{color: C.dark}}>Próximas citas</h3>
          <div className="flex flex-col gap-3">
            {proximas.map(cita => {
              const fecha = new Date(cita.fecha+"T00:00:00");
              return (
                <div key={cita.id} className="flex items-center gap-3">
                  <div className="text-center flex-shrink-0 w-9">
                    <p className="text-xs font-bold uppercase" style={{color: C.mid}}>{MESES[fecha.getMonth()].slice(0,3)}</p>
                    <p className="text-base font-bold leading-none" style={{color: C.dark}}>{fecha.getDate()}</p>
                  </div>
                  <div className="w-px h-8 flex-shrink-0" style={{background: C.soft}}></div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{background: avatarColor(cita.avatar)}}>{cita.avatar}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{color: C.dark}}>{cita.paciente}</p>
                      <p className="text-xs" style={{color: C.light}}>{cita.hora}</p>
                    </div>
                  </div>
                  <EstadoBadge estado={cita.estado} />
                </div>
              );
            })}
          </div>
          <button onClick={() => setSeccion("proximas")} className="mt-4 text-xs font-medium" style={{color: C.mid}}>Ver todas →</button>
        </div>
      </div>
    </div>
  );
}

function MisCitas({ citas }) {
  const [vista, setVista] = useState("dia");
  const hoy = getToday();
  const filtradas = vista==="dia" ? citas.filter(c=>c.fecha===hoy)
    : vista==="semana" ? citas.filter(c=>{ const diff=(new Date(c.fecha+"T00:00:00")-new Date())/86400000; return diff>=-1&&diff<=7; })
    : citas;

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6" style={{background: C.bg}}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold" style={{color: C.dark}}>Mis citas</h2>
          <p className="text-xs md:text-sm" style={{color: C.mid}}>Gestiona y revisa tus citas</p>
        </div>
        <div className="flex rounded-xl overflow-hidden shadow-sm" style={{border: `1px solid ${C.soft}`}}>
          {["dia","semana","mes"].map(v => (
            <button key={v} onClick={() => setVista(v)}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{background: vista===v ? C.dark : "white", color: vista===v ? "white" : C.mid}}>
              {v==="dia"?"Día":v==="semana"?"Semana":"Mes"}
            </button>
          ))}
        </div>
      </div>
      {filtradas.length===0 ? (
        <div className="rounded-2xl p-10 text-center shadow-sm" style={{background: "white", border: `1px solid ${C.soft}`}}>
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm" style={{color: C.mid}}>No hay citas para este período</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map(cita => (
            <div key={cita.id} className="rounded-2xl p-3 md:p-4 shadow-sm flex items-center gap-3"
              style={{background: "white", border: `1px solid ${C.soft}`}}>
              <div className="w-1 h-10 rounded-full flex-shrink-0"
                style={{background: cita.estado==="confirmada" ? C.mid : "#f59e0b"}}></div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{background: avatarColor(cita.avatar)}}>{cita.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{color: C.dark}}>{cita.paciente}</p>
                <p className="text-xs truncate" style={{color: C.mid}}>{cita.tipo}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium" style={{color: C.dark}}>{cita.hora}</p>
                <p className="text-xs" style={{color: C.light}}>{new Date(cita.fecha+"T00:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})}</p>
              </div>
              <EstadoBadge estado={cita.estado} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Proximas({ citas }) {
  const hoy = getToday();
  const proximas = citas.filter(c=>c.fecha>=hoy).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6" style={{background: C.bg}}>
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold" style={{color: C.dark}}>Próximas citas</h2>
        <p className="text-xs md:text-sm" style={{color: C.mid}}>Citas agendadas a partir de hoy</p>
      </div>
      <div className="flex flex-col gap-3">
        {proximas.map(cita => {
          const fecha = new Date(cita.fecha+"T00:00:00");
          return (
            <div key={cita.id} className="rounded-2xl p-3 md:p-4 shadow-sm flex items-center gap-3"
              style={{background: "white", border: `1px solid ${C.soft}`}}>
              <div className="text-center flex-shrink-0 w-10">
                <p className="text-xs font-bold uppercase" style={{color: C.mid}}>{MESES[fecha.getMonth()].slice(0,3)}</p>
                <p className="text-xl font-bold leading-none" style={{color: C.dark}}>{fecha.getDate()}</p>
              </div>
              <div className="w-px h-10 flex-shrink-0" style={{background: C.soft}}></div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{background: avatarColor(cita.avatar)}}>{cita.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{color: C.dark}}>{cita.paciente}</p>
                <p className="text-xs" style={{color: C.mid}}>{cita.tipo} · {cita.hora}</p>
              </div>
              <EstadoBadge estado={cita.estado} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Historial({ citas }) {
  const hoy = getToday();
  const pasadas = citas.filter(c=>c.fecha<hoy).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6" style={{background: C.bg}}>
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold" style={{color: C.dark}}>Historial de pacientes</h2>
        <p className="text-xs md:text-sm" style={{color: C.mid}}>Citas anteriores atendidas</p>
      </div>
      {pasadas.length===0 ? (
        <div className="rounded-2xl p-10 text-center shadow-sm" style={{background: "white", border: `1px solid ${C.soft}`}}>
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm" style={{color: C.mid}}>Sin historial por el momento</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pasadas.map(cita => {
            const fecha = new Date(cita.fecha+"T00:00:00");
            return (
              <div key={cita.id} className="rounded-2xl p-3 md:p-4 shadow-sm flex items-center gap-3"
                style={{background: "white", border: `1px solid ${C.soft}`}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{background: avatarColor(cita.avatar)}}>{cita.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{color: C.dark}}>{cita.paciente}</p>
                  <p className="text-xs" style={{color: C.mid}}>{cita.tipo}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium" style={{color: C.dark}}>{cita.hora}</p>
                  <p className="text-xs" style={{color: C.light}}>{fecha.toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"})}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                  style={{background: C.pale, color: C.mid}}>Atendida</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardMedico({ user }) {
  const [seccion, setSeccion] = useState("overview");
  const [citas] = useState(CITAS_EJEMPLO);
  const navigate = useNavigate();
  const handleLogout = async () => { await signOut(auth); navigate("/"); };

  return (
    <div className="flex min-h-screen" style={{background: C.bg}}>
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