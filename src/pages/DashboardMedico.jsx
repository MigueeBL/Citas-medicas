import { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

// ── Datos de ejemplo (se reemplazarán con Firestore) ──────────────────────
const CITAS_EJEMPLO = [
  {
    id: 1,
    paciente: "María González",
    tipo: "Consulta general",
    fecha: "2026-05-18",
    hora: "10:00 AM",
    estado: "confirmada",
    avatar: "MG",
  },
  {
    id: 2,
    paciente: "Carlos López",
    tipo: "Seguimiento",
    fecha: "2026-05-19",
    hora: "11:00 AM",
    estado: "pendiente",
    avatar: "CL",
  },
  {
    id: 3,
    paciente: "Ana Torres",
    tipo: "Primera consulta",
    fecha: "2026-05-21",
    hora: "03:00 PM",
    estado: "confirmada",
    avatar: "AT",
  },
  {
    id: 4,
    paciente: "Luis Mendoza",
    tipo: "Revisión",
    fecha: "2026-05-22",
    hora: "09:30 AM",
    estado: "confirmada",
    avatar: "LM",
  },
  {
    id: 5,
    paciente: "Rosa Díaz",
    tipo: "Consulta general",
    fecha: "2026-05-16",
    hora: "09:00 AM",
    estado: "confirmada",
    avatar: "RD",
  },
  {
    id: 6,
    paciente: "Pedro Ruiz",
    tipo: "Seguimiento",
    fecha: "2026-05-16",
    hora: "10:30 AM",
    estado: "pendiente",
    avatar: "PR",
  },
  {
    id: 7,
    paciente: "Laura Vega",
    tipo: "Revisión",
    fecha: "2026-05-16",
    hora: "12:00 PM",
    estado: "confirmada",
    avatar: "LV",
  },
  {
    id: 8,
    paciente: "Jorge Mora",
    tipo: "Primera consulta",
    fecha: "2026-05-16",
    hora: "04:00 PM",
    estado: "confirmada",
    avatar: "JM",
  },
];

// Días del mes con citas (para el calendario)
const DIAS_CON_CITAS = [
  4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 25, 26, 28,
];

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function avatarColor(initials) {
  const colors = [
    "#3B82F6",
    "#8B5CF6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
  ];
  const idx =
    (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
}

function EstadoBadge({ estado }) {
  if (estado === "confirmada")
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
        Confirmada
      </span>
    );
  if (estado === "pendiente")
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
        Pendiente
      </span>
    );
  return (
    <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
      Cancelada
    </span>
  );
}

// ── Calendario ─────────────────────────────────────────────────────────────
function Calendario({ diasConCitas }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasPrevios = new Date(anio, mes, 0).getDate();

  const celdas = [];
  for (let i = primerDia - 1; i >= 0; i--)
    celdas.push({ dia: diasPrevios - i, actual: false });
  for (let i = 1; i <= diasEnMes; i++) celdas.push({ dia: i, actual: true });
  while (celdas.length % 7 !== 0)
    celdas.push({
      dia: celdas.length - primerDia - diasEnMes + 1,
      actual: false,
    });

  const esHoy = (dia) =>
    dia === hoy.getDate() &&
    mes === hoy.getMonth() &&
    anio === hoy.getFullYear();

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {/* Header calendario */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">
          Calendario de citas
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (mes === 0) {
                setMes(11);
                setAnio((a) => a - 1);
              } else setMes((m) => m - 1);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-700">
            {MESES[mes]} {anio}
          </span>
          <button
            onClick={() => {
              if (mes === 11) {
                setMes(0);
                setAnio((a) => a + 1);
              } else setMes((m) => m + 1);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            ›
          </button>
        </div>
      </div>
      {/* Días semana */}
      <div className="grid grid-cols-7 mb-2">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Días */}
      <div className="grid grid-cols-7 gap-y-1">
        {celdas.map((celda, idx) => (
          <div key={idx} className="flex flex-col items-center py-1">
            <span
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm
              ${!celda.actual ? "text-gray-300" : "text-gray-700"}
              ${celda.actual && esHoy(celda.dia) ? "bg-blue-600 text-white font-bold" : ""}
              ${celda.actual && !esHoy(celda.dia) ? "hover:bg-blue-50 cursor-pointer" : ""}
            `}
            >
              {celda.dia}
            </span>
            {celda.actual &&
              diasConCitas.includes(celda.dia) &&
              !esHoy(celda.dia) && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5"></span>
              )}
            {celda.actual &&
              esHoy(celda.dia) &&
              diasConCitas.includes(celda.dia) && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-0.5"></span>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ seccion, setSeccion, user, onLogout }) {
  const items = [
    { id: "overview", label: "Overview", icon: "" },
    { id: "citas", label: "Mis citas", icon: "" },
    { id: "proximas", label: "Próximas", icon: "" },
    { id: "historial", label: "Historial", icon: "" },
  ];

  return (
    <aside className="w-65 min-h-screen bg-white flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-blue-900 font-semibold text-2xl leading-none">
              Citas Médicas
            </p>
          </div>
        </div>
      </div>

      {/* Avatar médico */}
      <div className="px-5 py-5 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center text-white text-xl font-bold border-2 border-blue-400">
          {user?.nombre
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "DR"}
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-x">
            {user?.nombre || "Dr. Médico"}
          </p>
          <p className="text-gray-400 text-sm">
            {user?.especialidad || "Médico general"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSeccion(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-all text-left
              ${seccion === item.id ? "bg-blue-700 text-white" : "text-blue-900 hover:bg-blue-400 hover:text-white"}`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-blue-900 hover:bg-blue-400 hover:text-white transition-all"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────
function Overview({ user, citas, setSeccion }) {
  const hoy = getToday();
  const citasHoy = citas.filter((c) => c.fecha === hoy);
  const confirmadas = citasHoy.filter((c) => c.estado === "confirmada").length;
  const pendientes = citasHoy.filter((c) => c.estado === "pendiente").length;
  const proxima = citas
    .filter((c) => c.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const proximas = citas
    .filter((c) => c.fecha > hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 4);

  const fechaHoy = new Date();
  const opciones = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const fechaStr = fechaHoy.toLocaleDateString("es-MX", opciones);

  function diasRestantes(fecha) {
    const hoyDate = new Date();
    hoyDate.setHours(0, 0, 0, 0);
    const citaDate = new Date(fecha + "T00:00:00");
    const diff = Math.round((citaDate - hoyDate) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Mañana";
    return `En ${diff} días`;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido de vuelta, {user?.nombre?.split(" ")[0] || "Dr."}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Aquí tienes un resumen de tus citas y pacientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:bg-gray-50">
            🔔
          </button>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <span className="text-blue-600 text-sm">📅</span>
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {fechaHoy.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-400">
                {fechaHoy.toLocaleDateString("es-MX", { weekday: "long" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Widgets top */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Citas hoy */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
              📅
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Citas de hoy</p>
              <p className="text-3xl font-bold text-gray-900 my-1">
                {citasHoy.length}
              </p>
              <p className="text-xs text-gray-400">citas programadas</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {confirmadas} confirm.
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {pendientes} pendientes
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSeccion("citas")}
            className="mt-3 text-xs text-blue-600 font-medium hover:underline"
          >
            Ver agenda del día →
          </button>
        </div>

        {/* Próxima cita */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-lg flex-shrink-0">
              👤
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-600 font-medium">Próxima cita</p>
              {proxima ? (
                <>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {proxima.paciente}
                  </p>
                  <p className="text-sm text-gray-500">{proxima.tipo}</p>
                  <p className="text-sm font-medium text-gray-700 mt-2">
                    {new Date(proxima.fecha + "T00:00:00").toLocaleDateString(
                      "es-MX",
                      { day: "numeric", month: "short" },
                    )}{" "}
                    • {proxima.hora}
                  </p>
                  <span className="mt-2 inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {diasRestantes(proxima.fecha)}
                  </span>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-2">Sin citas próximas</p>
              )}
            </div>
          </div>
        </div>

        {/* Pacientes atendidos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 text-lg flex-shrink-0">
              👥
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Pacientes atendidos</p>
              <p className="text-3xl font-bold text-gray-900 my-1">28</p>
              <p className="text-xs text-gray-400">esta semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario + Próximas citas */}
      <div className="grid grid-cols-2 gap-4">
        <Calendario diasConCitas={DIAS_CON_CITAS} />

        {/* Próximas citas lista */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Próximas citas
          </h3>
          <div className="flex flex-col gap-3">
            {proximas.map((cita) => {
              const fecha = new Date(cita.fecha + "T00:00:00");
              return (
                <div key={cita.id} className="flex items-center gap-3">
                  <div className="text-center flex-shrink-0 w-10">
                    <p className="text-xs font-bold text-blue-600 uppercase">
                      {MESES[fecha.getMonth()].slice(0, 3)}
                    </p>
                    <p className="text-lg font-bold text-gray-800 leading-none">
                      {fecha.getDate()}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-gray-100 flex-shrink-0"></div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: avatarColor(cita.avatar) }}
                    >
                      {cita.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {cita.paciente}
                      </p>
                      <p className="text-xs text-gray-400">
                        {cita.hora} · {cita.tipo}
                      </p>
                    </div>
                  </div>
                  <EstadoBadge estado={cita.estado} />
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setSeccion("proximas")}
            className="mt-4 text-sm text-blue-600 font-medium hover:underline"
          >
            Ver todas las próximas citas →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mis Citas ──────────────────────────────────────────────────────────────
function MisCitas({ citas }) {
  const [vista, setVista] = useState("dia");
  const hoy = getToday();

  const filtradas =
    vista === "dia"
      ? citas.filter((c) => c.fecha === hoy)
      : vista === "semana"
        ? citas.filter((c) => {
            const d = new Date(c.fecha + "T00:00:00");
            const h = new Date();
            const diff = (d - h) / 86400000;
            return diff >= -1 && diff <= 7;
          })
        : citas;

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mis citas</h2>
          <p className="text-gray-500 text-sm">Gestiona y revisa tus citas</p>
        </div>
        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {["dia", "semana", "mes"].map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-all
                ${vista === v ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500">No hay citas para este período</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map((cita) => (
            <div
              key={cita.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4"
            >
              <div
                className={`w-1 h-12 rounded-full flex-shrink-0 ${cita.estado === "confirmada" ? "bg-green-400" : "bg-orange-400"}`}
              ></div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: avatarColor(cita.avatar) }}
              >
                {cita.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{cita.paciente}</p>
                <p className="text-sm text-gray-500">{cita.tipo}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-gray-700">{cita.hora}</p>
                <p className="text-xs text-gray-400">
                  {new Date(cita.fecha + "T00:00:00").toLocaleDateString(
                    "es-MX",
                    { day: "numeric", month: "short" },
                  )}
                </p>
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
  const proximas = citas
    .filter((c) => c.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Próximas citas</h2>
        <p className="text-gray-500 text-sm">Citas agendadas a partir de hoy</p>
      </div>
      <div className="flex flex-col gap-3">
        {proximas.map((cita) => {
          const fecha = new Date(cita.fecha + "T00:00:00");
          return (
            <div
              key={cita.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4"
            >
              <div className="text-center flex-shrink-0 w-12">
                <p className="text-xs font-bold text-blue-600 uppercase">
                  {MESES[fecha.getMonth()].slice(0, 3)}
                </p>
                <p className="text-2xl font-bold text-gray-800 leading-none">
                  {fecha.getDate()}
                </p>
              </div>
              <div className="w-px h-12 bg-gray-100 flex-shrink-0"></div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: avatarColor(cita.avatar) }}
              >
                {cita.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{cita.paciente}</p>
                <p className="text-sm text-gray-500">
                  {cita.tipo} · {cita.hora}
                </p>
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
  const pasadas = citas
    .filter((c) => c.fecha < hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Historial de pacientes
        </h2>
        <p className="text-gray-500 text-sm">Citas anteriores atendidas</p>
      </div>
      {pasadas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">Sin historial por el momento</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pasadas.map((cita) => {
            const fecha = new Date(cita.fecha + "T00:00:00");
            return (
              <div
                key={cita.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: avatarColor(cita.avatar) }}
                >
                  {cita.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{cita.paciente}</p>
                  <p className="text-sm text-gray-500">{cita.tipo}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700">
                    {cita.hora}
                  </p>
                  <p className="text-xs text-gray-400">
                    {fecha.toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
                  Atendida
                </span>
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
  const [citas, setCitas] = useState(CITAS_EJEMPLO);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        seccion={seccion}
        setSeccion={setSeccion}
        user={user}
        onLogout={handleLogout}
      />
      {seccion === "overview" && (
        <Overview user={user} citas={citas} setSeccion={setSeccion} />
      )}
      {seccion === "citas" && <MisCitas citas={citas} />}
      {seccion === "proximas" && <Proximas citas={citas} />}
      {seccion === "historial" && <Historial citas={citas} />}
    </div>
  );
}
