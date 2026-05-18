import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import SeccionReportes from "./SeccionReportes"; // ← importa el nuevo componente
import logo from "../assets/logo.png";

const COLOR = {
  pendiente: { bg: "bg-amber-100", text: "text-amber-800" },
  confirmada: { bg: "bg-blue-100", text: "text-blue-800" },
  cobrada: { bg: "bg-green-100", text: "text-green-800" },
  cancelada: { bg: "bg-red-100", text: "text-red-800" },
};

function Navbar({ seccion }) {
  return (
    <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
      <span className="text-xl font-[Montserrat] text-[#2f4157] font-semibold">
        MediAsist
      </span>
      <span className="text-sm text-gray-500">{seccion}</span>
      <img src={logo} alt="Logo" style={{ width: "60px", height: "70px" }} />
    </nav>
  );
}

function PanelLateral({ activo, setActivo }) {
  const links = [
    { id: "inicio", label: "Inicio", icon: "🏠" },
    { id: "citas", label: "Citas", icon: "📅" },
    { id: "horario", label: "Horario Médico", icon: "🩺" },
    { id: "horarios", label: "Gestionar Horarios", icon: "⚙️" },
    { id: "cobros", label: "Cobros", icon: "💳" },
    { id: "reportes", label: "Reportes", icon: "📊" },
  ];
  return (
    <aside className="w-56 bg-[#c7d9e5] border-r border-gray-100 flex flex-col gap-1 p-4 shrink-0 font-[Montserrat] rounded-[15px]">
      {links.map((l) => (
        <button
          key={l.id}
          onClick={() => setActivo(l.id)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition font-[Montserrat]
            ${activo === l.id ? "bg-[#567c8e] text-white" : "text-gray-600 hover:bg-blue-50"}`}
        >
          <span>{l.icon}</span> {l.label}
        </button>
      ))}
    </aside>
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
    <div className={`${c.bg} rounded-2xl p-6 flex flex-col gap-2`}>
      <p className={`text-sm font-medium ${c.text}`}>{label}</p>
      <p className={`text-4xl font-bold ${c.num}`}>{value}</p>
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
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${c.bg} ${c.text}`}
    >
      {etq[estado] || estado}
    </span>
  );
}

function ModalCancelar({ cita, onCerrar, onConfirmar }) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
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
  const [metodo, setMetodo] = useState("efectivo");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
        <h3 className="font-bold text-lg mb-1 text-gray-800">
          Registrar cobro
        </h3>
        <p className="text-sm text-gray-500 mb-1">
          Paciente: <strong>{cita.paciente}</strong>
        </p>
        <p className="text-3xl font-bold text-green-700 mb-4">
          ${cita.monto} MXN
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método de pago
        </label>
        <div className="flex flex-col gap-2 mb-4">
          {["efectivo", "tarjeta", "transferencia"].map((m) => (
            <label
              key={m}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition
              ${metodo === m ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <input
                type="radio"
                className="accent-blue-600"
                checked={metodo === m}
                onChange={() => setMetodo(m)}
              />
              <span className="text-sm capitalize">{m}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(cita.id, metodo)}
            className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-green-500 transition"
          >
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
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Bienvenido, Asistente 👋
      </h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Statcard label="Citas Confirmadas" value={confirmadas} color="blue" />
        <Statcard label="Citas Cobradas" value={cobradas} color="green" />
        <Statcard label="Canceladas" value={canceladas} color="red" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">
          Citas de hoy — {citasHoy.length} citas
        </h2>
        {citasHoy.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No hay citas registradas para hoy
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {citasHoy.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm text-gray-800">
                    {c.paciente}
                  </p>
                  <p className="text-xs text-gray-400">
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
  const [metodo, setMetodo] = useState("efectivo");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
        <h3 className="font-bold text-lg mb-1 text-gray-800">
          Confirmar y cobrar cita
        </h3>

        {/* Info de la cita */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Paciente</span>
            <span className="text-xs font-semibold text-gray-800">
              {cita.paciente}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Médico</span>
            <span className="text-xs font-semibold text-gray-800">
              {cita.medicoNombre || cita.medico}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Fecha</span>
            <span className="text-xs font-semibold text-gray-800">
              {cita.fecha
                ? new Date(cita.fecha + "T00:00:00").toLocaleDateString(
                    "es-MX",
                    { day: "numeric", month: "long" },
                  )
                : "—"}
            </span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-xs text-gray-500">Hora</span>
            <span className="text-xs font-semibold text-gray-800">
              {cita.hora}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-700">
              Total a cobrar
            </span>
            <span className="text-lg font-bold text-green-700">
              ${cita.monto} MXN
            </span>
          </div>
        </div>

        {/* Método de pago */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método de pago
        </label>
        <div className="flex flex-col gap-2 mb-5">
          {[
            { id: "efectivo", label: "💵 Efectivo" },
            { id: "tarjeta", label: "💳 Tarjeta" },
            { id: "transferencia", label: "🏦 Transferencia" },
          ].map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition
                ${metodo === m.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <input
                type="radio"
                className="accent-blue-600"
                checked={metodo === m.id}
                onChange={() => setMetodo(m.id)}
              />
              <span className="text-sm">{m.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(cita.id, metodo)}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-blue-500 transition"
          >
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

  const confirmarYCobrar = async (id, metodo) => {
    await updateDoc(doc(db, "citas", id), {
      estado: "cobrada",
      metodoPago: metodo,
      fechaCobro: new Date().toISOString(),
    });
    setModalConfirmarCobrar(null);
  };
  const handleCancelar = async (id, motivo) => {
    await updateDoc(doc(db, "citas", id), { estado: "cancelada", motivo });
    setModalCancel(null);
  };

  const filtradas =
    filtro === "todas" ? citas : citas.filter((c) => c.estado === filtro);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Citas</h1>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["todas", "pendiente", "confirmada", "cobrada", "cancelada"].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
            ${filtro === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
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
                  {c.fecha ? new Date(c.fecha+"T00:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">{c.hora}</td>
                <td className="px-4 py-3"><Badge estado={c.estado} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
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
        {filtradas.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No hay citas con este filtro</p>
        )}
      </div>

      {/* ← Ambos modales DENTRO del return */}
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
  const hoyDia = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ][new Date().getDay()];

  useEffect(() => {
    const fetchMedicos = async () => {
      const snap = await getDocs(
        query(
          collection(db, "usuarios"),
          where("rol", "==", "medico"),
          where("estado", "==", "aprobado"),
        ),
      );
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMedicos(lista);
      if (lista.length > 0) setMedicoSel(lista[0]);
      setCargando(false);
    };
    fetchMedicos();
  }, []);

  if (cargando)
    return (
      <main className="flex-1 p-6">
        <p className="text-gray-400">Cargando...</p>
      </main>
    );
  if (medicos.length === 0)
    return (
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Horario del Médico
        </h1>
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🩺</p>
          <p className="text-gray-400">
            No hay médicos aprobados con horarios asignados
          </p>
        </div>
      </main>
    );

  const horarios = medicoSel?.horarios || {};
  const slots = Array.isArray(horarios) ? horarios : horarios[hoyDia] || [];
  const citasDelMedico = citas
    .filter((c) => c.medicoId === medicoSel?.id && c.fecha === hoy)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Horario del Médico
      </h1>
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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">📅 Citas de hoy</h2>
          {citasDelMedico.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin citas hoy</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {citasDelMedico.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {c.paciente}
                    </p>
                    <p className="text-xs text-gray-400">{c.hora}</p>
                  </div>
                  <Badge estado={c.estado} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">
            🕐 Disponibilidad hoy ({hoyDia})
          </h2>
          {slots.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Este médico no tiene horarios para hoy
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {slots.map((hora) => {
                const ocupada = citasDelMedico.find(
                  (c) => c.hora === hora && c.estado !== "cancelada",
                );
                return (
                  <li
                    key={hora}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
                      ocupada
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <span className="font-medium">{hora}</span>
                    {ocupada ? (
                      <span className="text-blue-700 text-xs font-medium">
                        Ocupado — {ocupada.paciente}
                      </span>
                    ) : (
                      <span className="text-green-700 text-xs font-medium">
                        Disponible
                      </span>
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
  const totalCobrado = citas
    .filter((c) => c.estado === "cobrada")
    .reduce((s, c) => s + c.monto, 0);

  const handleCobrar = async (id, metodo) => {
    const cita = citas.find((c) => c.id === id);
    await updateDoc(doc(db, "citas", id), {
      estado: "cobrada",
      metodoPago: metodo,
    });
    setHistorial((prev) => [
      ...prev,
      { ...cita, metodo, fechaCobro: new Date().toLocaleTimeString("es-MX") },
    ]);
    setModalCobro(null);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Cobros</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Statcard
          label="Total cobrado hoy"
          value={`$${totalCobrado}`}
          color="green"
        />
        <Statcard
          label="Pendientes de cobro"
          value={pendientesCobro.length}
          color="amber"
        />
        <Statcard
          label="Citas cobradas"
          value={citas.filter((c) => c.estado === "cobrada").length}
          color="blue"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">⏳ Por cobrar</h2>
          {pendientesCobro.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No hay citas confirmadas pendientes
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendientesCobro.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {c.paciente}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.hora} · {c.medicoNombre || c.medico}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-700 text-sm">
                      ${c.monto}
                    </span>
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
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">
            ✅ Historial de cobros
          </h2>
          {historial.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Aún no hay cobros en esta sesión
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {historial.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2.5"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {c.paciente}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.fechaCobro} · {c.metodo}
                    </p>
                  </div>
                  <span className="font-bold text-green-700">${c.monto}</span>
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
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
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

  useEffect(() => {
    fetchMedicos();
  }, []);

  const fetchMedicos = async () => {
    setCargando(true);
    const snap = await getDocs(
      query(
        collection(db, "usuarios"),
        where("rol", "==", "medico"),
        where("estado", "==", "aprobado"),
      ),
    );
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setMedicos(lista);
    setCargando(false);
  };

  const seleccionarMedico = (medico) => {
    setMedicoSel(medico);
    setExito("");
    // Si ya tiene horarios por día los carga, si no inicializa vacío
    const horariosExistentes =
      medico.horarios && !Array.isArray(medico.horarios) ? medico.horarios : {};
    const base = {};
    DIAS.forEach((d) => {
      base[d.id] = horariosExistentes[d.id] || [];
    });
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

  const quitarHora = (hora) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaActivo]: prev[diaActivo].filter((h) => h !== hora),
    }));
  };

  const agregarSugerida = (hora) => {
    if (horariosPorDia[diaActivo]?.includes(hora)) return;
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaActivo]: [...(prev[diaActivo] || []), hora].sort(),
    }));
  };

  const guardarHorarios = async () => {
    if (!medicoSel) return;
    setGuardando(true);
    const precio = parseFloat(horariosPorDia._precio || medicoSel.precio || 0);

    // Separar el precio de los horarios reales
    const { _precio, ...horariosSinPrecio } = horariosPorDia;

    await updateDoc(doc(db, "usuarios", medicoSel.id), {
      horarios: horariosSinPrecio,
      precio,
    });
    setMedicos((prev) =>
      prev.map((m) =>
        m.id === medicoSel.id
          ? { ...m, horarios: horariosSinPrecio, precio }
          : m,
      ),
    );
    setExito("✅ Horarios y precio guardados correctamente");
    setGuardando(false);
  };

  const totalHorarios = Object.entries(horariosPorDia).reduce(
    (sum, [key, arr]) =>
      key === "_precio" ? sum : sum + (Array.isArray(arr) ? arr.length : 0),
    0,
  );

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">
        Gestionar Horarios
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        Asigna los horarios de atención por día para cada médico
      </p>

      {cargando ? (
        <p className="text-gray-400">Cargando médicos...</p>
      ) : medicos.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🩺</p>
          <p className="text-gray-400">No hay médicos aprobados aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Lista de médicos */}
          <div className="col-span-1 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Médicos aprobados
            </p>
            {medicos.map((m) => {
              const total =
                m.horarios && !Array.isArray(m.horarios)
                  ? Object.values(m.horarios).reduce(
                      (s, a) => s + (a?.length || 0),
                      0,
                    )
                  : 0;
              return (
                <button
                  key={m.id}
                  onClick={() => seleccionarMedico(m)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    medicoSel?.id === m.id
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-100 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {m.nombre?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">
                        {m.nombre}
                      </p>
                      <p className="text-xs text-gray-400">{m.especialidad}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        total > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {total > 0
                        ? `${total} horarios configurados`
                        : "Sin horarios"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Editor */}
          <div className="col-span-2">
            {!medicoSel ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm h-full flex items-center justify-center">
                <div>
                  <p className="text-4xl mb-3">👈</p>
                  <p className="text-gray-400 text-sm">
                    Selecciona un médico para editar sus horarios
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                {/* Header médico */}
                {/* Header médico */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {medicoSel.nombre?.[0]}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800">
                      {medicoSel.nombre}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {medicoSel.especialidad} · {medicoSel.email}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-gray-400 font-medium">
                        Precio consulta
                      </span>
                      <span className="text-xs text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={horariosPorDia._precio || medicoSel.precio || ""}
                        onChange={(e) =>
                          setHorariosPorDia((prev) => ({
                            ...prev,
                            _precio: e.target.value,
                          }))
                        }
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
                          diaActivo === dia.id
                            ? "bg-[#2f4157] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {dia.label}
                        {count > 0 && (
                          <span
                            className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                              diaActivo === dia.id
                                ? "bg-white/20 text-white"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
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
                    <p className="text-sm text-gray-300 italic mb-3">
                      Sin horarios para este día
                    </p>
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
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agregar hora manual */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Agregar horario
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={nuevaHora}
                      onChange={(e) => setNuevaHora(e.target.value)}
                      onBlur={(e) => setNuevaHora(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") agregarHora();
                      }}
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
                  <p className="text-xs text-gray-400 mb-2">
                    Sugeridos (clic para agregar)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {HORAS_SUGERIDAS.filter(
                      (h) => !horariosPorDia[diaActivo]?.includes(h),
                    ).map((hora) => (
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
                  <div className="mb-4 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">
                    {exito}
                  </div>
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "citas"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a, b) =>
            (a.fecha || "").localeCompare(b.fecha || "") ||
            (a.hora || "").localeCompare(b.hora || ""),
        );
      setCitas(data);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  // Cobro centralizado — lo usan SeccionCobros y SeccionReportes
  const handleCobrar = async (id, metodo, pmId = null) => {
    const payload = { estado: "cobrada", metodoPago: metodo };
    if (pmId) payload.stripePaymentMethodId = pmId;
    await updateDoc(doc(db, "citas", id), payload);
  };

  const titulos = {
    inicio: "Inicio",
    citas: "Gestión de Citas",
    horario: "Horario Médico",
    cobros: "Cobros",
    reportes: "Reportes",
  };

  if (cargando)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-lg">
        Cargando citas...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <Navbar seccion={titulos[seccion]} />
      <div className="flex flex-1 overflow-hidden">
        <PanelLateral activo={seccion} setActivo={setSeccion} />
        {seccion === "inicio" && <SeccionInicio citas={citas} />}
        {seccion === "citas" && <SeccionCitas citas={citas} />}
        {seccion === "horario" && <SeccionHorario citas={citas} />}
        {seccion === "horarios" && <SeccionGestionarHorarios />}
        {seccion === "cobros" && (
          <SeccionCobros citas={citas} onCobrar={handleCobrar} />
        )}
        {seccion === "reportes" && (
          <SeccionReportes citas={citas} onCobrar={handleCobrar} />
        )}
      </div>
    </div>
  );
}
