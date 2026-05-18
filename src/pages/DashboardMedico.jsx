import { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

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

const C = {
  dark: "#2f4157",
  mid: "#567c8e",
  light: "#a2c1d1",
  soft: "#c7d9e5",
  pale: "#e3ecf2",
  bg: "#f3f6f9",
};

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function avatarColor(str) {
  const colors = [C.dark, C.mid, "#3d6b7d", "#4a7a8a", "#2a5068", "#1e3a4f"];
  const idx = (str?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

function getInitials(nombre) {
  if (!nombre) return "??";
  return nombre
    .split(" ")
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EstadoBadge({ estado }) {
  if (estado === "confirmada")
    return (
      <span
        className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap"
        style={{ background: C.pale, color: C.dark }}
      >
        Confirmada
      </span>
    );
  if (estado === "pendiente")
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
        Pendiente
      </span>
    );
  if (estado === "cobrada")
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium whitespace-nowrap">
        Cobrada
      </span>
    );
  return (
    <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap">
      Cancelada
    </span>
  );
}

function Calendario({ citas }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasPrevios = new Date(anio, mes, 0).getDate();

  // Días del mes actual que tienen citas reales
  const diasConCitas = [
    ...new Set(
      citas
        .filter((c) => {
          const f = new Date(c.fecha + "T00:00:00");
          return (
            f.getMonth() === mes &&
            f.getFullYear() === anio &&
            c.estado !== "cancelada"
          );
        })
        .map((c) => new Date(c.fecha + "T00:00:00").getDate()),
    ),
  ];

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
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "white", border: `1px solid ${C.soft}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: C.dark }}>
          Calendario de citas
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (mes === 0) {
                setMes(11);
                setAnio((a) => a - 1);
              } else setMes((m) => m - 1);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-full text-sm"
            style={{ color: C.mid }}
          >
            ‹
          </button>
          <span className="text-xs font-medium" style={{ color: C.dark }}>
            {MESES[mes].slice(0, 3)} {anio}
          </span>
          <button
            onClick={() => {
              if (mes === 11) {
                setMes(0);
                setAnio((a) => a + 1);
              } else setMes((m) => m + 1);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-full text-sm"
            style={{ color: C.mid }}
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="text-center text-xs py-1 font-medium"
            style={{ color: C.light }}
          >
            {d.slice(0, 1)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {celdas.map((celda, idx) => (
          <div key={idx} className="flex flex-col items-center py-0.5">
            <span
              className="w-7 h-7 flex items-center justify-center rounded-full text-xs cursor-pointer transition-all"
              style={{
                color: !celda.actual
                  ? C.light
                  : esHoy(celda.dia)
                    ? "white"
                    : C.dark,
                background: esHoy(celda.dia) ? C.dark : "transparent",
                fontWeight: esHoy(celda.dia) ? "700" : "400",
              }}
            >
              {celda.dia}
            </span>
            {celda.actual && diasConCitas.includes(celda.dia) && (
              <span
                className="w-1 h-1 rounded-full mt-0.5"
                style={{ background: esHoy(celda.dia) ? C.soft : C.mid }}
              ></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar desktop ────────────────────────────────────────────────────────
function Sidebar({ seccion, setSeccion, user, onLogout }) {
  const items = [
    { id: "inicio", label: "Inicio", icon: "🏠" },
    { id: "citas", label: "Mis citas", icon: "📅" },
    { id: "proximas", label: "Próximas", icon: "⏰" },
    { id: "historial", label: "Historial", icon: "📚" },
    { id: "horarios", label: "Mis horarios", icon: "🕒" },
  ];
  return (
    <aside
      className="hidden md:flex w-65 min-h-screen flex-col flex-shrink-0"
      style={{ background: C.dark }}
    >
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
          <p className="font-semibold text-2xl leading-none text-white">
            Citas Médicas
          </p>
        </div>
      </div>
      <div
        className="px-5 py-4 flex flex-col items-center gap-2"
        style={{ borderBottom: `1px solid ${C.mid}40` }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold border-2"
          style={{ background: C.mid, borderColor: C.light }}
        >
          {user?.nombre
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "DR"}
        </div>
        <div className="text-center">
          <p className="font-semibold text-xl text-white">
            {user?.nombre || "Dr. Médico"}
          </p>
          <p className="text-base" style={{ color: C.light }}>
            {user?.especialidad || "Médico"}
          </p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {items.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setSeccion(id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-all text-left"
            style={{
              background: seccion === id ? C.mid : "transparent",
              color: seccion === id ? "white" : C.soft,
            }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
      <div
        className="px-3 pb-5 pt-3"
        style={{ borderTop: `1px solid ${C.mid}40` }}
      >
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base transition-all text-left"
          style={{ color: C.light }}
        >
          <span>🚪</span>
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}

// ── Bottom nav móvil ───────────────────────────────────────────────────────
function BottomNav({ seccion, setSeccion, onLogout }) {
  const items = [
    { id: "inicio", label: "Inicio", icon: "🏠" },
    { id: "citas", label: "Citas", icon: "📅" },
    { id: "proximas", label: "Próximas", icon: "⏰" },
    { id: "historial", label: "Historial", icon: "📚" },
    { id: "horarios", label: "Horarios", icon: "🕒" },
  ];
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{ background: "white", borderTop: `1px solid ${C.soft}` }}
    >
      {items.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setSeccion(id)}
          className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-all"
          style={{ color: seccion === id ? C.dark : C.light }}
        >
          <span className="text-lg leading-none">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
      <button
        onClick={onLogout}
        className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium"
        style={{ color: C.light }}
      >
        <span className="text-lg leading-none">🚪</span>
        <span>Salir</span>
      </button>
    </nav>
  );
}

// ── Header móvil ───────────────────────────────────────────────────────────
function HeaderMovil({ user, seccion }) {
  const titulos = {
    inicio: "Inicio",
    citas: "Mis citas",
    proximas: "Próximas",
    historial: "Historial",
    horarios: "Horarios",
  };
  return (
    <div
      className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
      style={{ background: "white", borderBottom: `1px solid ${C.soft}` }}
    >
      <div className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
        <span className="font-semibold text-sm" style={{ color: C.dark }}>
          {titulos[seccion]}
        </span>
      </div>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ background: C.mid }}
      >
        {user?.nombre
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "DR"}
      </div>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────
function Overview({ user, citas, setSeccion }) {
  const hoy = getToday();
  const citasHoy = citas.filter(
    (c) => c.fecha === hoy && c.estado !== "cancelada",
  );
  const confirmadas = citasHoy.filter((c) => c.estado === "confirmada").length;
  const pendientes = citasHoy.filter((c) => c.estado === "pendiente").length;
  const proxima = citas
    .filter((c) => c.fecha >= hoy && c.estado !== "cancelada")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const proximas = citas
    .filter((c) => c.fecha > hoy && c.estado !== "cancelada")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 4);
  const pacientesUnicos = new Set(
    citas.filter((c) => c.estado !== "cancelada").map((c) => c.pacienteId),
  ).size;
  const fechaHoy = new Date();

  function diasRestantes(fecha) {
    const hoyD = new Date();
    hoyD.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(fecha + "T00:00:00") - hoyD) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Mañana";
    return `En ${diff} días`;
  }

  return (
    <div
      className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6"
      style={{ background: C.bg }}
    >
      {/* Header desktop */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: C.dark }}>
            ¡Bienvenido, {user?.nombre?.split(" ")[0] || "Dr."}! 👋
          </h1>
          <p className="text-xl mt-0.5" style={{ color: C.mid }}>
            Aquí tienes un resumen de tus citas y pacientes.
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <span className="text-sm">📅</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: C.dark }}>
              {fechaHoy.toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-xs" style={{ color: C.light }}>
              {fechaHoy.toLocaleDateString("es-MX", { weekday: "long" })}
            </p>
          </div>
        </div>
      </div>

      {/* Saludo móvil */}
      <div className="md:hidden mb-4">
        <h1 className="text-lg font-bold" style={{ color: C.dark }}>
          ¡Hola, {user?.nombre?.split(" ")[0] || "Dr."}! 👋
        </h1>
        <p className="text-xs" style={{ color: C.mid }}>
          {fechaHoy.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Citas hoy */}
        <div
          className="rounded-2xl p-4 shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: C.pale }}
            >
              📅
            </div>
            <div>
              <p className="text-xs" style={{ color: C.mid }}>
                Citas de hoy
              </p>
              <p className="text-2xl font-bold" style={{ color: C.dark }}>
                {citasHoy.length}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: C.pale, color: C.dark }}
            >
              {confirmadas} confirm.
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
              {pendientes} pend.
            </span>
          </div>
          <button
            onClick={() => setSeccion("citas")}
            className="mt-2 text-xs font-medium"
            style={{ color: C.mid }}
          >
            Ver agenda →
          </button>
        </div>

        {/* Próxima cita */}
        <div
          className="rounded-2xl p-4 shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: C.pale }}
            >
              👤
            </div>
            <p className="text-xs font-medium" style={{ color: C.mid }}>
              Próxima cita
            </p>
          </div>
          {proxima ? (
            <>
              <p
                className="text-base font-bold truncate"
                style={{ color: C.dark }}
              >
                {proxima.paciente}
              </p>
              <p className="text-xs" style={{ color: C.mid }}>
                {proxima.especialidad || "Consulta"}
              </p>
              <p className="text-xs font-medium mt-1" style={{ color: C.dark }}>
                {new Date(proxima.fecha + "T00:00:00").toLocaleDateString(
                  "es-MX",
                  { day: "numeric", month: "short" },
                )}{" "}
                · {proxima.hora}
              </p>
              <span
                className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: C.pale, color: C.mid }}
              >
                {diasRestantes(proxima.fecha)}
              </span>
            </>
          ) : (
            <p className="text-xs" style={{ color: C.light }}>
              Sin citas próximas
            </p>
          )}
        </div>

        {/* Pacientes */}
        <div
          className="rounded-2xl p-4 shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: C.pale }}
            >
              👥
            </div>
            <div>
              <p className="text-xs" style={{ color: C.mid }}>
                Pacientes totales
              </p>
              <p className="text-2xl font-bold" style={{ color: C.dark }}>
                {pacientesUnicos}
              </p>
              <p className="text-xs" style={{ color: C.light }}>
                {citas.length} citas en total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario + próximas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Calendario citas={citas} />

        <div
          className="rounded-2xl p-4 shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.dark }}>
            Próximas citas
          </h3>
          {proximas.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: C.light }}>
              No hay citas próximas
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {proximas.map((cita) => {
                const fecha = new Date(cita.fecha + "T00:00:00");
                return (
                  <div key={cita.id} className="flex items-center gap-3">
                    <div className="text-center flex-shrink-0 w-9">
                      <p
                        className="text-xs font-bold uppercase"
                        style={{ color: C.mid }}
                      >
                        {MESES[fecha.getMonth()].slice(0, 3)}
                      </p>
                      <p
                        className="text-base font-bold leading-none"
                        style={{ color: C.dark }}
                      >
                        {fecha.getDate()}
                      </p>
                    </div>
                    <div
                      className="w-px h-8 flex-shrink-0"
                      style={{ background: C.soft }}
                    ></div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: avatarColor(cita.paciente) }}
                      >
                        {getInitials(cita.paciente)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: C.dark }}
                        >
                          {cita.paciente}
                        </p>
                        <p className="text-xs" style={{ color: C.light }}>
                          {cita.hora}
                        </p>
                      </div>
                    </div>
                    <EstadoBadge estado={cita.estado} />
                  </div>
                );
              })}
            </div>
          )}
          <button
            onClick={() => setSeccion("proximas")}
            className="mt-3 text-xs font-medium"
            style={{ color: C.mid }}
          >
            Ver todas →
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
            const diff =
              (new Date(c.fecha + "T00:00:00") - new Date()) / 86400000;
            return diff >= -1 && diff <= 7;
          })
        : citas;

  const ordenadas = [...filtradas].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
  );

  return (
    <div
      className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6"
      style={{ background: C.bg }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-lg md:text-xl font-bold"
            style={{ color: C.dark }}
          >
            Mis citas
          </h2>
          <p className="text-xs md:text-sm" style={{ color: C.mid }}>
            Gestiona y revisa tus citas
          </p>
        </div>
        <div
          className="flex rounded-xl overflow-hidden shadow-sm"
          style={{ border: `1px solid ${C.soft}` }}
        >
          {["dia", "semana", "mes"].map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: vista === v ? C.dark : "white",
                color: vista === v ? "white" : C.mid,
              }}
            >
              {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {ordenadas.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm" style={{ color: C.mid }}>
            No hay citas para este período
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ordenadas.map((cita) => (
            <div
              key={cita.id}
              className="rounded-2xl p-3 md:p-4 shadow-sm flex items-center gap-3"
              style={{ background: "white", border: `1px solid ${C.soft}` }}
            >
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{
                  background:
                    cita.estado === "confirmada"
                      ? C.mid
                      : cita.estado === "cobrada"
                        ? "#10b981"
                        : "#f59e0b",
                }}
              ></div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: avatarColor(cita.paciente) }}
              >
                {getInitials(cita.paciente)}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm truncate"
                  style={{ color: C.dark }}
                >
                  {cita.paciente}
                </p>
                <p className="text-xs truncate" style={{ color: C.mid }}>
                  {cita.especialidad || "Consulta"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium" style={{ color: C.dark }}>
                  {cita.hora}
                </p>
                <p className="text-xs" style={{ color: C.light }}>
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
    .filter((c) => c.fecha >= hoy && c.estado !== "cancelada")
    .sort(
      (a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
    );

  return (
    <div
      className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6"
      style={{ background: C.bg }}
    >
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold" style={{ color: C.dark }}>
          Próximas citas
        </h2>
        <p className="text-xs md:text-sm" style={{ color: C.mid }}>
          Citas agendadas a partir de hoy
        </p>
      </div>
      {proximas.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm" style={{ color: C.mid }}>
            No hay citas próximas
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {proximas.map((cita) => {
            const fecha = new Date(cita.fecha + "T00:00:00");
            return (
              <div
                key={cita.id}
                className="rounded-2xl p-3 md:p-4 shadow-sm flex items-center gap-3"
                style={{ background: "white", border: `1px solid ${C.soft}` }}
              >
                <div className="text-center flex-shrink-0 w-10">
                  <p
                    className="text-xs font-bold uppercase"
                    style={{ color: C.mid }}
                  >
                    {MESES[fecha.getMonth()].slice(0, 3)}
                  </p>
                  <p
                    className="text-xl font-bold leading-none"
                    style={{ color: C.dark }}
                  >
                    {fecha.getDate()}
                  </p>
                </div>
                <div
                  className="w-px h-10 flex-shrink-0"
                  style={{ background: C.soft }}
                ></div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: avatarColor(cita.paciente) }}
                >
                  {getInitials(cita.paciente)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: C.dark }}
                  >
                    {cita.paciente}
                  </p>
                  <p className="text-xs" style={{ color: C.mid }}>
                    {cita.especialidad || "Consulta"} · {cita.hora}
                  </p>
                </div>
                <EstadoBadge estado={cita.estado} />
              </div>
            );
          })}
        </div>
      )}
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
    <div
      className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6"
      style={{ background: C.bg }}
    >
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold" style={{ color: C.dark }}>
          Historial de pacientes
        </h2>
        <p className="text-xs md:text-sm" style={{ color: C.mid }}>
          Citas anteriores atendidas
        </p>
      </div>
      {pasadas.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm" style={{ color: C.mid }}>
            Sin historial por el momento
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pasadas.map((cita) => {
            const fecha = new Date(cita.fecha + "T00:00:00");
            return (
              <div
                key={cita.id}
                className="rounded-2xl p-3 md:p-4 shadow-sm flex items-center gap-3"
                style={{ background: "white", border: `1px solid ${C.soft}` }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: avatarColor(cita.paciente) }}
                >
                  {getInitials(cita.paciente)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: C.dark }}
                  >
                    {cita.paciente}
                  </p>
                  <p className="text-xs" style={{ color: C.mid }}>
                    {cita.especialidad || "Consulta"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: C.dark }}>
                    {cita.hora}
                  </p>
                  <p className="text-xs" style={{ color: C.light }}>
                    {fecha.toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <EstadoBadge estado={cita.estado} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MisHorarios({ user }) {
  const DIAS = [
    { id: "lunes", label: "Lunes" },
    { id: "martes", label: "Martes" },
    { id: "miercoles", label: "Miércoles" },
    { id: "jueves", label: "Jueves" },
    { id: "viernes", label: "Viernes" },
    { id: "sabado", label: "Sábado" },
    { id: "domingo", label: "Domingo" },
  ];

  const horarios = user?.horarios || {};
  const precio = user?.precio || 0;
  const tieneHorarios =
    !Array.isArray(horarios) &&
    Object.values(horarios).some((arr) => arr?.length > 0);

  return (
    <div
      className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6"
      style={{ background: C.bg }}
    >
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: C.dark }}>
            Mis horarios
          </h2>
          <p className="text-sm mt-0.5" style={{ color: C.mid }}>
            Horarios de atención configurados por el asistente
          </p>
        </div>
        {precio > 0 && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2 shadow-sm"
            style={{ background: "white", border: `1px solid ${C.soft}` }}
          >
            <span className="text-sm">💰</span>
            <div>
              <p className="text-xs" style={{ color: C.mid }}>
                Precio por consulta
              </p>
              <p className="text-base font-bold" style={{ color: C.dark }}>
                ${precio} MXN
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Móvil */}
      <div className="md:hidden mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: C.dark }}>
            Mis horarios
          </h2>
          <p className="text-xs" style={{ color: C.mid }}>
            Configurados por el asistente
          </p>
        </div>
        {precio > 0 && (
          <span
            className="text-sm font-bold px-3 py-1 rounded-xl"
            style={{ background: C.pale, color: C.dark }}
          >
            ${precio} MXN
          </span>
        )}
      </div>

      {!tieneHorarios ? (
        <div
          className="rounded-2xl p-10 text-center shadow-sm"
          style={{ background: "white", border: `1px solid ${C.soft}` }}
        >
          <p className="text-4xl mb-3">🕐</p>
          <p className="text-sm font-medium mb-1" style={{ color: C.dark }}>
            Sin horarios configurados
          </p>
          <p className="text-xs" style={{ color: C.light }}>
            El asistente aún no ha asignado tus horarios de atención.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DIAS.map((dia) => {
            const slots = Array.isArray(horarios) ? [] : horarios[dia.id] || [];
            if (slots.length === 0) return null;
            return (
              <div
                key={dia.id}
                className="rounded-2xl p-4 shadow-sm"
                style={{ background: "white", border: `1px solid ${C.soft}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: C.dark }}
                  >
                    {dia.label}
                  </h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: C.pale, color: C.mid }}
                  >
                    {slots.length} {slots.length === 1 ? "horario" : "horarios"}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {slots.map((hora) => (
                    <div
                      key={hora}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: C.bg }}
                    >
                      <span className="text-sm">🕐</span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: C.dark }}
                      >
                        {hora}
                      </span>
                    </div>
                  ))}
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
export default function DashboardMedico({ user }) {
  const [seccion, setSeccion] = useState("inicio");
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  // Escuchar en tiempo real solo las citas de este médico
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, "citas"), where("medicoId", "==", user.uid)),
      (snap) => {
        setCitas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCargando(false);
      },
    );
    return () => unsub();
  }, [user?.uid]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (cargando)
    return (
      <div
        className="flex items-center justify-center h-screen text-sm"
        style={{ color: C.mid }}
      >
        Cargando tus citas...
      </div>
    );

  return (
    <div className="flex min-h-screen" style={{ background: C.bg }}>
      <Sidebar
        seccion={seccion}
        setSeccion={setSeccion}
        user={user}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderMovil user={user} seccion={seccion} />
        {seccion === "inicio" && (
          <Overview user={user} citas={citas} setSeccion={setSeccion} />
        )}
        {seccion === "citas" && <MisCitas citas={citas} />}
        {seccion === "proximas" && <Proximas citas={citas} />}
        {seccion === "historial" && <Historial citas={citas} />}
        {seccion === "horarios" && <MisHorarios user={user} />}
      </div>
      <BottomNav
        seccion={seccion}
        setSeccion={setSeccion}
        onLogout={handleLogout}
      />
    </div>
  );
}
