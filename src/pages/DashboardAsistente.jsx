import { useState, useEffect } from "react";
import { db, auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import SeccionReportes from "./SeccionReportes";
import logo from "../assets/logo.png";

const COLOR = {
  pendiente: { bg: "bg-amber-100", text: "text-amber-800" },
  confirmada: { bg: "bg-blue-100", text: "text-blue-800" },
  cobrada: { bg: "bg-green-100", text: "text-green-800" },
  cancelada: { bg: "bg-red-100", text: "text-red-800" },
};

const METODOS = [
  { id: "efectivo", label: "💵 Efectivo" },
  { id: "tarjeta", label: "💳 Tarjeta" },
  { id: "transferencia", label: "🏦 Transferencia" },
];

function Reloj() {
  const [hora, setHora] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const hh = hora.getHours().toString().padStart(2, "0");
  const mm = hora.getMinutes().toString().padStart(2, "0");
  const ss = hora.getSeconds().toString().padStart(2, "0");
  const fecha = hora.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-base sm:text-lg font-bold text-[#2f4157] font-mono tracking-widest">
        {hh}:{mm}<span className="text-[#567c8e] text-sm sm:text-base">:{ss}</span>
      </span>
      <span className="text-xs text-gray-400 capitalize hidden sm:block">{fecha}</span>
    </div>
  );
}

function Navbar({ seccion, onCerrarSesion, onMenuToggle }) {
  return (
    <nav className="bg-white shadow-sm px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        {/* Botón hamburguesa — solo visible en móvil */}
        <button
          onClick={onMenuToggle}
          className="md:hidden flex flex-col gap-1 p-1.5 rounded-lg hover:bg-gray-100 transition"
          aria-label="Abrir menú"
        >
          <span className="w-5 h-0.5 bg-gray-600 rounded" />
          <span className="w-5 h-0.5 bg-gray-600 rounded" />
          <span className="w-5 h-0.5 bg-gray-600 rounded" />
        </button>
        <span className="text-lg sm:text-xl font-[Montserrat] text-[#2f4157] font-semibold">
          MediAsist
        </span>
      </div>

      <span className="text-xs sm:text-sm text-gray-500 hidden sm:block truncate max-w-[160px]">{seccion}</span>

      <div className="flex items-center gap-2 sm:gap-4">
        <Reloj />
        <img src={logo} alt="Logo" className="w-10 h-12 sm:w-[60px] sm:h-[70px]" />
        <button
          onClick={onCerrarSesion}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition"
        >
          🚪 <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </nav>
  );
}

function PanelLateral({ activo, setActivo, abierto, onCerrar }) {
  const links = [
    { id: "inicio", label: "Inicio", icon: "🏠" },
    { id: "citas", label: "Citas", icon: "📅" },
    { id: "horario", label: "Horario Médico", icon: "🩺" },
    { id: "horarios", label: "Gestionar Horarios", icon: "⚙️" },
    { id: "cobros", label: "Cobros", icon: "💳" },
    { id: "precios", label: "Precios de Consulta", icon: "🏷️" },
    { id: "reportes", label: "Reportes", icon: "📊" },
  ];

  const handleNav = (id) => {
    setActivo(id);
    onCerrar(); // cierra el menú en móvil al navegar
  };

  return (
    <>
      {/* Overlay oscuro en móvil */}
      {abierto && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onCerrar}
        />
      )}

      {/* Panel lateral */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-64 bg-[#c7d9e5] border-r border-gray-100
          flex flex-col gap-1 p-4 font-[Montserrat] rounded-r-[15px]
          transform transition-transform duration-300 ease-in-out
          ${abierto ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-56 md:h-auto md:rounded-[15px] md:shrink-0
        `}
      >
        {/* Botón cerrar en móvil */}
        <button
          onClick={onCerrar}
          className="md:hidden self-end mb-2 p-1.5 rounded-lg text-gray-600 hover:bg-white/40 transition text-lg leading-none"
          aria-label="Cerrar menú"
        >
          ✕
        </button>

        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => handleNav(l.id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition font-[Montserrat]
              ${activo === l.id ? "bg-[#567c8e] text-white" : "text-gray-600 hover:bg-blue-50"}`}
          >
            <span>{l.icon}</span> {l.label}
          </button>
        ))}
      </aside>
    </>
  );
}

function Statcard({ label, value, color }) {
  const clrs = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", num: "text-blue-800" },
    green: { bg: "bg-green-50", text: "text-green-700", num: "text-green-800" },
    red: { bg: "bg-red-50", text: "text-red-700", num: "text-red-800" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", num: "text-amber-800" },
  };
  const c = clrs[color] || clrs.blue;
  return (
    <div className={`${c.bg} rounded-2xl p-4 sm:p-6 flex flex-col gap-2`}>
      <p className={`text-xs sm:text-sm font-medium ${c.text}`}>{label}</p>
      <p className={`text-3xl sm:text-4xl font-bold ${c.num}`}>{value}</p>
    </div>
  );
}

function Badge({ estado }) {
  const c = COLOR[estado] || { bg: "bg-gray-100", text: "text-gray-700" };
  const etq = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    cobrada: "Cobrada",
    cancelada: "Cancelada",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.bg} ${c.text}`}>
      {etq[estado] || estado}
    </span>
  );
}

function ModalCancelar({ cita, onCerrar, onConfirmar }) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-lg mb-1 text-gray-800">
          Cancelar cita por emergencia
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Paciente: <strong>{cita.paciente}</strong> — {cita.hora}
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Motivo de cancelación
        </label>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          rows={3}
          placeholder="Describe la emergencia..."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCerrar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Volver
          </button>
          <button
            onClick={() => motivo.trim() && onConfirmar(cita.id, motivo)}
            disabled={!motivo.trim()}
            className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-bold hover:bg-red-400 disabled:opacity-40 transition"
          >
            Confirmar cancelación
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCobrar({ cita, onCerrar, onConfirmar }) {
  const total = cita.monto || 0;
  const [partidas, setPartidas] = useState([{ metodo: "efectivo", monto: total }]);
  const [error, setError] = useState("");

  const sumaPartidas = partidas.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
  const restante = parseFloat((total - sumaPartidas).toFixed(2));

  const agregarPartida = () =>
    setPartidas((prev) => [...prev, { metodo: "efectivo", monto: 0 }]);

  const quitarPartida = (i) =>
    setPartidas((prev) => prev.filter((_, idx) => idx !== i));

  const cambiarPartida = (i, campo, valor) =>
    setPartidas((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p))
    );

  const handleConfirmar = () => {
    if (Math.abs(restante) > 0.01) {
      setError(`Faltan $${restante.toFixed(2)} MXN por asignar.`);
      return;
    }
    onConfirmar(cita.id, partidas.filter((p) => parseFloat(p.monto) > 0));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm sm:max-w-[420px] shadow-xl">
        <h3 className="font-bold text-lg mb-1 text-gray-800">Registrar cobro</h3>
        <p className="text-sm text-gray-500 mb-1">
          Paciente: <strong>{cita.paciente}</strong>
        </p>
        <p className="text-3xl font-bold text-green-700 mb-4">${total} MXN</p>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método(s) de pago
        </label>
        <div className="flex flex-col gap-2 mb-3">
          {partidas.map((p, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <select
                value={p.metodo}
                onChange={(e) => cambiarPartida(i, "metodo", e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none border-none min-w-0"
              >
                {METODOS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <span className="text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                max={total}
                value={p.monto}
                onChange={(e) => cambiarPartida(i, "monto", e.target.value)}
                className="w-20 text-sm font-semibold text-gray-800 outline-none bg-transparent text-right"
              />
              <span className="text-gray-400 text-xs">MXN</span>
              {partidas.length > 1 && (
                <button
                  onClick={() => quitarPartida(i)}
                  className="text-red-400 hover:text-red-600 font-bold text-lg leading-none ml-1"
                >×</button>
              )}
            </div>
          ))}
        </div>

        <div className={`flex justify-between text-sm px-1 mb-2 ${Math.abs(restante) > 0.01 ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}`}>
          <span>{Math.abs(restante) <= 0.01 ? "✅ Total cubierto" : "Pendiente:"}</span>
          {Math.abs(restante) > 0.01 && <span>${restante.toFixed(2)} MXN</span>}
        </div>

        <button
          onClick={agregarPartida}
          className="w-full mb-4 border border-dashed border-blue-300 text-blue-500 text-sm rounded-xl py-2 hover:bg-blue-50 transition font-medium"
        >
          + Agregar otro método de pago
        </button>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onCerrar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleConfirmar}
            className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-green-500 transition">
            Cobrar
          </button>
        </div>
      </div>
    </div>
  );
}

function SeccionInicio({ citas }) {
  const hoy = new Date().toISOString().split("T")[0];
  const confirmadas = citas.filter((c) => c.estado === "confirmada").length;
  const cobradas = citas.filter((c) => c.estado === "cobrada").length;
  const canceladas = citas.filter((c) => c.estado === "cancelada").length;
  const citasHoy = citas.filter((c) => c.fecha === hoy);
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">
        Bienvenido, Asistente 👋
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Statcard label="Citas Confirmadas" value={confirmadas} color="blue" />
        <Statcard label="Citas Cobradas" value={cobradas} color="green" />
        <Statcard label="Canceladas" value={canceladas} color="red" />
      </div>
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">
          Citas de hoy — {citasHoy.length} citas
        </h2>
        {citasHoy.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay citas registradas para hoy</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {citasHoy.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-3 sm:px-4 py-3 gap-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{c.paciente}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {c.hora} · {c.medicoNombre || c.medico}
                  </p>
                </div>
                <Badge estado={c.estado} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function ModalConfirmarCobrar({ cita, onCerrar, onConfirmar }) {
  const total = cita.monto || 0;
  const [partidas, setPartidas] = useState([{ metodo: "efectivo", monto: total }]);
  const [error, setError] = useState("");

  const sumaPartidas = partidas.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
  const restante = parseFloat((total - sumaPartidas).toFixed(2));

  const agregarPartida = () =>
    setPartidas((prev) => [...prev, { metodo: "efectivo", monto: 0 }]);

  const quitarPartida = (i) =>
    setPartidas((prev) => prev.filter((_, idx) => idx !== i));

  const cambiarPartida = (i, campo, valor) =>
    setPartidas((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p))
    );

  const handleConfirmar = () => {
    if (Math.abs(restante) > 0.01) {
      setError(`Faltan $${restante.toFixed(2)} MXN por asignar.`);
      return;
    }
    onConfirmar(cita.id, partidas.filter((p) => parseFloat(p.monto) > 0));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm sm:max-w-[440px] shadow-xl">
        <h3 className="font-bold text-lg mb-1 text-gray-800">Confirmar y cobrar cita</h3>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Paciente</span>
            <span className="text-xs font-semibold text-gray-800">{cita.paciente}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Médico</span>
            <span className="text-xs font-semibold text-gray-800">{cita.medicoNombre || cita.medico}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Fecha</span>
            <span className="text-xs font-semibold text-gray-800">
              {cita.fecha ? new Date(cita.fecha + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" }) : "—"}
            </span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-xs text-gray-500">Hora</span>
            <span className="text-xs font-semibold text-gray-800">{cita.hora}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-700">Total a cobrar</span>
            <span className="text-lg font-bold text-green-700">${total} MXN</span>
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">Método(s) de pago</label>
        <div className="flex flex-col gap-2 mb-3">
          {partidas.map((p, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <select
                value={p.metodo}
                onChange={(e) => cambiarPartida(i, "metodo", e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none border-none min-w-0"
              >
                {METODOS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <span className="text-gray-400 text-sm">$</span>
              <input
                type="number" min="0" max={total} value={p.monto}
                onChange={(e) => cambiarPartida(i, "monto", e.target.value)}
                className="w-20 text-sm font-semibold text-gray-800 outline-none bg-transparent text-right"
              />
              <span className="text-gray-400 text-xs">MXN</span>
              {partidas.length > 1 && (
                <button onClick={() => quitarPartida(i)}
                  className="text-red-400 hover:text-red-600 font-bold text-lg leading-none ml-1">×</button>
              )}
            </div>
          ))}
        </div>

        <div className={`flex justify-between text-sm px-1 mb-2 ${Math.abs(restante) > 0.01 ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}`}>
          <span>{Math.abs(restante) <= 0.01 ? "✅ Total cubierto" : "Pendiente:"}</span>
          {Math.abs(restante) > 0.01 && <span>${restante.toFixed(2)} MXN</span>}
        </div>

        <button onClick={agregarPartida}
          className="w-full mb-4 border border-dashed border-blue-300 text-blue-500 text-sm rounded-xl py-2 hover:bg-blue-50 transition font-medium">
          + Agregar otro método de pago
        </button>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onCerrar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleConfirmar}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-blue-500 transition">
            ✓ Confirmar y cobrar
          </button>
        </div>
      </div>
    </div>
  );
}

function SeccionCitas({ citas }) {
  const [filtro, setFiltro] = useState("todas");
  const [modalCancel, setModalCancel] = useState(null);
  const [modalConfirmarCobrar, setModalConfirmarCobrar] = useState(null);

  const confirmarYCobrar = async (id, partidas) => {
    const metodoPago = partidas.length === 1
      ? partidas[0].metodo
      : partidas.map((p) => `${p.metodo}:$${p.monto}`).join(", ");
    await updateDoc(doc(db, "citas", id), {
      estado: "cobrada",
      metodoPago,
      pagosMixtos: partidas,
      fechaCobro: new Date().toISOString(),
    });
    setModalConfirmarCobrar(null);
  };

  const handleCancelar = async (id, motivo) => {
    await updateDoc(doc(db, "citas", id), { estado: "cancelada", motivo });
    setModalCancel(null);
  };

  const filtradas = filtro === "todas" ? citas : citas.filter((c) => c.estado === filtro);

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Gestión de Citas</h1>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["todas", "pendiente", "confirmada", "cobrada", "cancelada"].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition
            ${filtro === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabla con scroll horizontal en móvil */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                <th className="px-4 py-3 font-semibold">Paciente</th>
                <th className="px-4 py-3 font-semibold">Médico</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Hora</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c, i) => (
                <tr key={c.id} className={`border-t border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.paciente}</td>
                  <td className="px-4 py-3 text-gray-500">{c.medicoNombre || c.medico}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.fecha ? new Date(c.fecha + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.hora}</td>
                  <td className="px-4 py-3"><Badge estado={c.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      {c.estado === "pendiente" && (
                        <button onClick={() => setModalConfirmarCobrar(c)}
                          className="bg-blue-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-blue-400 transition font-medium">
                          ✓ Confirmar
                        </button>
                      )}
                      {(c.estado === "pendiente" || c.estado === "confirmada") && (
                        <button onClick={() => setModalCancel(c)}
                          className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-400 transition font-medium">
                          ✕ Cancelar
                        </button>
                      )}
                      {c.estado === "cobrada" && (
                        <span className="text-xs text-gray-400 italic">Completada</span>
                      )}
                      {c.estado === "cancelada" && (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtradas.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No hay citas con este filtro</p>
        )}
      </div>

      {modalCancel && (
        <ModalCancelar
          cita={modalCancel}
          onCerrar={() => setModalCancel(null)}
          onConfirmar={handleCancelar}
        />
      )}
      {modalConfirmarCobrar && (
        <ModalConfirmarCobrar
          cita={modalConfirmarCobrar}
          onCerrar={() => setModalConfirmarCobrar(null)}
          onConfirmar={confirmarYCobrar}
        />
      )}
    </main>
  );
}

function SeccionHorario({ citas }) {
  const [medicos, setMedicos] = useState([]);
  const [medicoSel, setMedicoSel] = useState(null);
  const [cargando, setCargando] = useState(true);
  const hoy = new Date().toISOString().split("T")[0];
  const hoyDia = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][new Date().getDay()];

  useEffect(() => {
    const fetchMedicos = async () => {
      const snap = await getDocs(
        query(collection(db, "usuarios"), where("rol", "==", "medico"), where("estado", "==", "aprobado"))
      );
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMedicos(lista);
      if (lista.length > 0) setMedicoSel(lista[0]);
      setCargando(false);
    };
    fetchMedicos();
  }, []);

  if (cargando) return <main className="flex-1 p-6"><p className="text-gray-400">Cargando...</p></main>;
  if (medicos.length === 0)
    return (
      <main className="flex-1 p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Horario del Médico</h1>
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🩺</p>
          <p className="text-gray-400">No hay médicos aprobados con horarios asignados</p>
        </div>
      </main>
    );

  const horarios = medicoSel?.horarios || {};
  const slots = Array.isArray(horarios) ? horarios : horarios[hoyDia] || [];
  const citasDelMedico = citas
    .filter((c) => c.medicoId === medicoSel?.id && c.fecha === hoy)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Horario del Médico</h1>
      <div className="flex gap-3 mb-6 flex-wrap">
        {medicos.map((m) => (
          <button
            key={m.id}
            onClick={() => setMedicoSel(m)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              medicoSel?.id === m.id
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50"
            }`}
          >
            {m.nombre}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">📅 Citas de hoy</h2>
          {citasDelMedico.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin citas hoy</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {citasDelMedico.map((c) => (
                <li key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{c.paciente}</p>
                    <p className="text-xs text-gray-400">{c.hora}</p>
                  </div>
                  <Badge estado={c.estado} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">🕐 Disponibilidad hoy ({hoyDia})</h2>
          {slots.length === 0 ? (
            <p className="text-gray-400 text-sm">Este médico no tiene horarios para hoy</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {slots.map((hora) => {
                const ocupada = citasDelMedico.find((c) => c.hora === hora && c.estado !== "cancelada");
                return (
                  <li key={hora}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
                      ocupada ? "bg-blue-50 border border-blue-200" : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <span className="font-medium">{hora}</span>
                    {ocupada ? (
                      <span className="text-blue-700 text-xs font-medium truncate ml-2">Ocupado — {ocupada.paciente}</span>
                    ) : (
                      <span className="text-green-700 text-xs font-medium">Disponible</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function SeccionCobros({ citas, onCobrar }) {
  const [modalCobro, setModalCobro] = useState(null);
  const [historial, setHistorial] = useState([]);
  const pendientesCobro = citas.filter((c) => c.estado === "confirmada");
  const totalCobrado = citas.filter((c) => c.estado === "cobrada").reduce((s, c) => s + c.monto, 0);

  const handleCobrar = async (id, partidas) => {
    const cita = citas.find((c) => c.id === id);
    const metodoPago = partidas.length === 1
      ? partidas[0].metodo
      : partidas.map((p) => `${p.metodo}:$${p.monto}`).join(", ");
    await updateDoc(doc(db, "citas", id), {
      estado: "cobrada",
      metodoPago,
      pagosMixtos: partidas,
    });
    setHistorial((prev) => [
      ...prev,
      { ...cita, partidas, fechaCobro: new Date().toLocaleTimeString("es-MX") },
    ]);
    setModalCobro(null);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Cobros</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Statcard label="Total cobrado hoy" value={`$${totalCobrado}`} color="green" />
        <Statcard label="Pendientes de cobro" value={pendientesCobro.length} color="amber" />
        <Statcard label="Citas cobradas" value={citas.filter((c) => c.estado === "cobrada").length} color="blue" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">⏳ Por cobrar</h2>
          {pendientesCobro.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay citas confirmadas pendientes</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendientesCobro.map((c) => (
                <li key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 sm:px-4 py-3 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{c.paciente}</p>
                    <p className="text-xs text-gray-400 truncate">{c.hora} · {c.medicoNombre || c.medico}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-green-700 text-sm">${c.monto}</span>
                    <button
                      onClick={() => setModalCobro(c)}
                      className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-500 transition font-medium"
                    >
                      Cobrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">✅ Historial de cobros</h2>
          {historial.length === 0 ? (
            <p className="text-gray-400 text-sm">Aún no hay cobros en esta sesión</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {historial.map((c, i) => (
                <li key={i} className="flex items-start justify-between bg-green-50 rounded-xl px-3 sm:px-4 py-2.5 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{c.paciente}</p>
                    <p className="text-xs text-gray-400">{c.fechaCobro}</p>
                    {c.partidas && c.partidas.length > 1 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.partidas.map((p, j) => (
                          <span key={j} className="text-xs bg-white border border-green-200 text-green-700 px-2 py-0.5 rounded-full">
                            {p.metodo} ${p.monto}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">{c.partidas?.[0]?.metodo}</p>
                    )}
                  </div>
                  <span className="font-bold text-green-700 flex-shrink-0">${c.monto}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {modalCobro && (
        <ModalCobrar
          cita={modalCobro}
          onCerrar={() => setModalCobro(null)}
          onConfirmar={handleCobrar}
        />
      )}
    </main>
  );
}

function SeccionPrecios() {
  const [medicos, setMedicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [precios, setPrecios] = useState({});
  const [guardando, setGuardando] = useState({});
  const [exitos, setExitos] = useState({});
  const [errores, setErrores] = useState({});

  useEffect(() => {
    const fetchMedicos = async () => {
      const snap = await getDocs(
        query(collection(db, "usuarios"), where("rol", "==", "medico"), where("estado", "==", "aprobado"))
      );
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMedicos(lista);
      const init = {};
      lista.forEach((m) => { init[m.id] = m.precio ?? ""; });
      setPrecios(init);
      setCargando(false);
    };
    fetchMedicos();
  }, []);

  const guardarPrecio = async (medicoId) => {
    const valor = parseFloat(precios[medicoId]);
    if (isNaN(valor) || valor < 0) {
      setErrores((prev) => ({ ...prev, [medicoId]: "Ingresa un precio válido" }));
      return;
    }
    setGuardando((prev) => ({ ...prev, [medicoId]: true }));
    setErrores((prev) => ({ ...prev, [medicoId]: "" }));
    try {
      await updateDoc(doc(db, "usuarios", medicoId), { precio: valor });
      setMedicos((prev) => prev.map((m) => m.id === medicoId ? { ...m, precio: valor } : m));
      setExitos((prev) => ({ ...prev, [medicoId]: true }));
      setTimeout(() => setExitos((prev) => ({ ...prev, [medicoId]: false })), 2500);
    } catch {
      setErrores((prev) => ({ ...prev, [medicoId]: "Error al guardar" }));
    }
    setGuardando((prev) => ({ ...prev, [medicoId]: false }));
  };

  if (cargando) return <main className="flex-1 p-6"><p className="text-gray-400">Cargando médicos...</p></main>;

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">Precios de Consulta</h1>
      <p className="text-gray-400 text-sm mb-6">
        Actualiza el precio de consulta de cada médico. El cambio aplica a las nuevas citas.
      </p>
      {medicos.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🩺</p>
          <p className="text-gray-400">No hay médicos aprobados aún</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl">
          {medicos.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                  {m.nombre?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{m.nombre}</p>
                  <p className="text-xs text-gray-400">{m.especialidad}</p>
                  {m.precio !== undefined && m.precio !== "" && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">Precio actual: ${m.precio} MXN</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 transition">
                  <span className="text-gray-400 text-sm mr-1">$</span>
                  <input
                    type="number" min="0" placeholder="0"
                    value={precios[m.id] ?? ""}
                    onChange={(e) => setPrecios((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && guardarPrecio(m.id)}
                    className="w-20 text-sm font-bold text-gray-800 outline-none"
                  />
                  <span className="text-gray-400 text-xs ml-1">MXN</span>
                </div>
                <button
                  onClick={() => guardarPrecio(m.id)}
                  disabled={guardando[m.id]}
                  className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60"
                  style={{ background: "#2f4157" }}
                >
                  {guardando[m.id] ? "..." : exitos[m.id] ? "✅ Guardado" : "Guardar"}
                </button>
              </div>
              {errores[m.id] && <p className="text-red-500 text-xs">{errores[m.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const DIAS = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const HORAS_SUGERIDAS = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00",
];

function SeccionGestionarHorarios() {
  const [medicos, setMedicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [medicoSel, setMedicoSel] = useState(null);
  const [horariosPorDia, setHorariosPorDia] = useState({});
  const [diaActivo, setDiaActivo] = useState("lunes");
  const [nuevaHora, setNuevaHora] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");

  useEffect(() => { fetchMedicos(); }, []);

  const fetchMedicos = async () => {
    setCargando(true);
    const snap = await getDocs(
      query(collection(db, "usuarios"), where("rol", "==", "medico"), where("estado", "==", "aprobado"))
    );
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setMedicos(lista);
    setCargando(false);
  };

  const seleccionarMedico = (medico) => {
    setMedicoSel(medico);
    setExito("");
    const horariosExistentes = medico.horarios && !Array.isArray(medico.horarios) ? medico.horarios : {};
    const base = {};
    DIAS.forEach((d) => { base[d.id] = horariosExistentes[d.id] || []; });
    setHorariosPorDia(base);
    setDiaActivo("lunes");
  };

  const agregarHora = () => {
    if (!nuevaHora || !nuevaHora.trim()) return;
    const horaFormateada = nuevaHora.trim();
    if (horariosPorDia[diaActivo]?.includes(horaFormateada)) return;
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaActivo]: [...(prev[diaActivo] || []), horaFormateada].sort(),
    }));
    setNuevaHora("");
  };

  const agregarSugerida = (hora) => {
    if (horariosPorDia[diaActivo]?.includes(hora)) return;
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaActivo]: [...(prev[diaActivo] || []), hora].sort(),
    }));
  };

  const quitarHora = (hora) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaActivo]: prev[diaActivo].filter((h) => h !== hora),
    }));
  };

  const guardarHorarios = async () => {
    if (!medicoSel) return;
    setGuardando(true);
    try {
      await updateDoc(doc(db, "usuarios", medicoSel.id), { horarios: horariosPorDia });
      setExito("✅ Horarios guardados correctamente");
      setTimeout(() => setExito(""), 3000);
    } catch {
      setExito("❌ Error al guardar");
    }
    setGuardando(false);
  };

  const totalHorarios = Object.values(horariosPorDia).reduce((s, arr) => s + arr.length, 0);

  if (cargando) return <main className="flex-1 p-6"><p className="text-gray-400">Cargando...</p></main>;

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Gestionar Horarios</h1>

      {medicos.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🩺</p>
          <p className="text-gray-400">No hay médicos aprobados aún</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Selector de médico */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Selecciona un médico</p>
            <div className="flex flex-wrap gap-2">
              {medicos.map((m) => (
                <button
                  key={m.id}
                  onClick={() => seleccionarMedico(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    medicoSel?.id === m.id
                      ? "bg-[#2f4157] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {m.nombre}
                </button>
              ))}
            </div>
          </div>

          {medicoSel && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
              {/* Encabezado con precio */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="flex-1">
                  <h2 className="font-bold text-gray-800">{medicoSel.nombre}</h2>
                  <p className="text-xs text-gray-400">{medicoSel.especialidad}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-blue-400 transition">
                    <span className="text-gray-400 text-xs mr-1">$</span>
                    <input
                      type="number" min="0" placeholder="Precio"
                      value={medicoSel._precio ?? medicoSel.precio ?? ""}
                      onChange={(e) => setMedicoSel((prev) => ({ ...prev, _precio: e.target.value }))}
                      className="w-20 text-sm font-bold text-gray-800 outline-none"
                    />
                    <span className="text-xs text-gray-400">MXN</span>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                    {totalHorarios} horarios en total
                  </span>
                </div>
              </div>

              {/* Tabs de días */}
              <div className="flex gap-1 mb-5 flex-wrap">
                {DIAS.map((dia) => {
                  const count = horariosPorDia[dia.id]?.length || 0;
                  return (
                    <button
                      key={dia.id}
                      onClick={() => setDiaActivo(dia.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all relative ${
                        diaActivo === dia.id ? "bg-[#2f4157] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {dia.label}
                      {count > 0 && (
                        <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                          diaActivo === dia.id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Horarios del día activo */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Horarios del {DIAS.find((d) => d.id === diaActivo)?.label}
                </p>
                {(horariosPorDia[diaActivo]?.length || 0) === 0 ? (
                  <p className="text-sm text-gray-300 italic mb-3">Sin horarios para este día</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {horariosPorDia[diaActivo].map((hora) => (
                      <span
                        key={hora}
                        className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-3 py-1.5 rounded-xl"
                      >
                        🕐 {hora}
                        <button
                          onClick={() => quitarHora(hora)}
                          className="text-blue-400 hover:text-red-500 transition-colors font-bold leading-none"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Agregar hora */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Agregar horario</p>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") agregarHora(); }}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={agregarHora}
                    className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-blue-500 hover:bg-blue-400 transition"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Horas sugeridas */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 mb-2">Sugeridos (clic para agregar)</p>
                <div className="flex flex-wrap gap-1.5">
                  {HORAS_SUGERIDAS.filter((h) => !horariosPorDia[diaActivo]?.includes(h)).map((hora) => (
                    <button
                      key={hora}
                      onClick={() => agregarSugerida(hora)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              </div>

              {exito && (
                <div className="mb-4 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">{exito}</div>
              )}

              <button
                onClick={guardarHorarios}
                disabled={guardando}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60"
                style={{ background: "#2f4157" }}
              >
                {guardando ? "Guardando..." : "💾 Guardar horarios"}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// ─── App principal ────────────────────────────────────────────────────────────
export default function DashboardAsistente() {
  const [seccion, setSeccion] = useState("inicio");
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "citas"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a, b) =>
            (a.fecha || "").localeCompare(b.fecha || "") ||
            (a.hora || "").localeCompare(b.hora || "")
        );
      setCitas(data);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const handleCobrar = async (id, metodo, pmId = null) => {
    const payload = { estado: "cobrada", metodoPago: metodo };
    if (pmId) payload.stripePaymentMethodId = pmId;
    await updateDoc(doc(db, "citas", id), payload);
  };

  const titulos = {
    inicio: "Inicio",
    citas: "Gestión de Citas",
    horario: "Horario Médico",
    horarios: "Gestionar Horarios",
    cobros: "Cobros",
    precios: "Precios de Consulta",
    reportes: "Reportes",
  };

  const handleCerrarSesion = async () => { await signOut(auth); };

  if (cargando)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-lg">
        Cargando citas...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <Navbar
        seccion={titulos[seccion]}
        onCerrarSesion={handleCerrarSesion}
        onMenuToggle={() => setMenuAbierto((v) => !v)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <PanelLateral
          activo={seccion}
          setActivo={setSeccion}
          abierto={menuAbierto}
          onCerrar={() => setMenuAbierto(false)}
        />
        <div className="flex-1 overflow-hidden">
          {seccion === "inicio" && <SeccionInicio citas={citas} />}
          {seccion === "citas" && <SeccionCitas citas={citas} />}
          {seccion === "horario" && <SeccionHorario citas={citas} />}
          {seccion === "horarios" && <SeccionGestionarHorarios />}
          {seccion === "cobros" && <SeccionCobros citas={citas} onCobrar={handleCobrar} />}
          {seccion === "precios" && <SeccionPrecios />}
          {seccion === "reportes" && <SeccionReportes citas={citas} onCobrar={handleCobrar} />}
        </div>
      </div>
    </div>
  );
}