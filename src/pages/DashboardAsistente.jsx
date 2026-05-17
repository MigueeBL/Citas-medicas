import { useState, useEffect } from "react"
import { db } from "../firebase/config"
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore"
import SeccionReportes from "./SeccionReportes"  // ← importa el nuevo componente
import logo from "../assets/logo.png"

const HORARIOS_MEDICO = {
  "Dr. Ramírez":  ["09:00","11:00","16:00"],
  "Dra. Soto":    ["10:30","13:30","17:00"],
  "Dr. Mendoza":  ["12:00","15:00"],
}

const COLOR = {
  pendiente:  { bg:"bg-amber-100",  text:"text-amber-800"  },
  confirmada: { bg:"bg-blue-100",   text:"text-blue-800"   },
  cobrada:    { bg:"bg-green-100",  text:"text-green-800"  },
  cancelada:  { bg:"bg-red-100",    text:"text-red-800"    },
}

function Navbar({ seccion }) {
  return (
    <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
      <span className="text-xl font-[Montserrat] text-[#2f4157] font-semibold">MediAsist</span>
      <span className="text-sm text-gray-500">{seccion}</span>
      <img src={logo} alt="Logo" style={{ width: '60px', height: '70px' }} />
    </nav>
  )
}

function PanelLateral({ activo, setActivo }) {
  const links = [
    { id:"inicio",   label:"Inicio",        icon:"🏠" },
    { id:"citas",    label:"Citas",          icon:"📅" },
    { id:"horario",  label:"Horario Médico", icon:"🩺" },
    { id:"cobros",   label:"Cobros",         icon:"💳" },
    { id:"reportes", label:"Reportes",       icon:"📊" },
  ]
  return (
    <aside className="w-56 bg-[#c7d9e5] border-r border-gray-100 flex flex-col gap-1 p-4 shrink-0 font-[Montserrat] rounded-[15px]">
      {links.map(l => (
        <button key={l.id} onClick={() => setActivo(l.id)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition font-[Montserrat]
            ${activo===l.id ? "bg-[#567c8e] text-white" : "text-gray-600 hover:bg-blue-50"}`}>
          <span>{l.icon}</span> {l.label}
        </button>
      ))}
    </aside>
  )
}

function Statcard({ label, value, color }) {
  const clrs = {
    blue:  { bg:"bg-blue-50",  text:"text-blue-700",  num:"text-blue-800"  },
    green: { bg:"bg-green-50", text:"text-green-700", num:"text-green-800" },
    red:   { bg:"bg-red-50",   text:"text-red-700",   num:"text-red-800"   },
    amber: { bg:"bg-amber-50", text:"text-amber-700", num:"text-amber-800" },
  }
  const c = clrs[color] || clrs.blue
  return (
    <div className={`${c.bg} rounded-2xl p-6 flex flex-col gap-2`}>
      <p className={`text-sm font-medium ${c.text}`}>{label}</p>
      <p className={`text-4xl font-bold ${c.num}`}>{value}</p>
    </div>
  )
}

function Badge({ estado }) {
  const c = COLOR[estado] || { bg:"bg-gray-100", text:"text-gray-700" }
  const etq = { pendiente:"Pendiente", confirmada:"Confirmada", cobrada:"Cobrada", cancelada:"Cancelada" }
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.bg} ${c.text}`}>{etq[estado]||estado}</span>
}

function ModalCancelar({ cita, onCerrar, onConfirmar }) {
  const [motivo, setMotivo] = useState("")
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
        <h3 className="font-bold text-lg mb-1 text-gray-800">Cancelar cita por emergencia</h3>
        <p className="text-sm text-gray-500 mb-4">Paciente: <strong>{cita.paciente}</strong> — {cita.hora}</p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de cancelación</label>
        <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          rows={3} placeholder="Describe la emergencia..." value={motivo} onChange={e=>setMotivo(e.target.value)} />
        <div className="flex gap-3 mt-4">
          <button onClick={onCerrar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Volver
          </button>
          <button onClick={() => motivo.trim() && onConfirmar(cita.id, motivo)} disabled={!motivo.trim()}
            className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-bold hover:bg-red-400 disabled:opacity-40 transition">
            Confirmar cancelación
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalCobrar({ cita, onCerrar, onConfirmar }) {
  const [metodo, setMetodo] = useState("efectivo")
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
        <h3 className="font-bold text-lg mb-1 text-gray-800">Registrar cobro</h3>
        <p className="text-sm text-gray-500 mb-1">Paciente: <strong>{cita.paciente}</strong></p>
        <p className="text-3xl font-bold text-green-700 mb-4">${cita.monto} MXN</p>
        <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
        <div className="flex flex-col gap-2 mb-4">
          {["efectivo","tarjeta","transferencia"].map(m => (
            <label key={m} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition
              ${metodo===m ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
              <input type="radio" className="accent-blue-600" checked={metodo===m} onChange={() => setMetodo(m)} />
              <span className="text-sm capitalize">{m}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onCerrar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={() => onConfirmar(cita.id, metodo)}
            className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-green-500 transition">
            Cobrar
          </button>
        </div>
      </div>
    </div>
  )
}

function SeccionInicio({ citas }) {
  const hoy         = new Date().toISOString().split("T")[0]
  const confirmadas = citas.filter(c=>c.estado==="confirmada").length
  const cobradas    = citas.filter(c=>c.estado==="cobrada").length
  const canceladas  = citas.filter(c=>c.estado==="cancelada").length
  const citasHoy    = citas.filter(c=>c.fecha===hoy)
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Bienvenido, Asistente 👋</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Statcard label="Citas Confirmadas" value={confirmadas} color="blue"  />
        <Statcard label="Citas Cobradas"    value={cobradas}    color="green" />
        <Statcard label="Canceladas"        value={canceladas}  color="red"   />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Citas de hoy — {citasHoy.length} citas</h2>
        {citasHoy.length===0
          ? <p className="text-gray-400 text-sm">No hay citas registradas para hoy</p>
          : (
            <ul className="flex flex-col gap-2">
              {citasHoy.map(c => (
                <li key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{c.paciente}</p>
                    <p className="text-xs text-gray-400">{c.hora} · {c.medico}</p>
                  </div>
                  <Badge estado={c.estado} />
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </main>
  )
}

function SeccionCitas({ citas }) {
  const [filtro, setFiltro]           = useState("todas")
  const [modalCancel, setModalCancel] = useState(null)

  const confirmar = async (id) => {
    await updateDoc(doc(db, "citas", id), { estado: "confirmada" })
  }
  const handleCancelar = async (id, motivo) => {
    await updateDoc(doc(db, "citas", id), { estado: "cancelada", motivo })
    setModalCancel(null)
  }

  const filtradas = filtro==="todas" ? citas : citas.filter(c=>c.estado===filtro)

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Citas</h1>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["todas","pendiente","confirmada","cobrada","cancelada"].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${filtro===f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50"}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs">
              <th className="px-4 py-3 font-semibold">Paciente</th>
              <th className="px-4 py-3 font-semibold">Médico</th>
              <th className="px-4 py-3 font-semibold">Hora</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((c,i) => (
              <tr key={c.id} className={`border-t border-gray-50 ${i%2===0?"":"bg-gray-50/50"}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{c.paciente}</td>
                <td className="px-4 py-3 text-gray-500">{c.medico}</td>
                <td className="px-4 py-3 text-gray-500">{c.hora}</td>
                <td className="px-4 py-3"><Badge estado={c.estado} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {c.estado==="pendiente" && (
                      <button onClick={() => confirmar(c.id)}
                        className="bg-blue-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-blue-400 transition font-medium">
                        ✓ Confirmar
                      </button>
                    )}
                    {(c.estado==="pendiente"||c.estado==="confirmada") && (
                      <button onClick={() => setModalCancel(c)}
                        className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-400 transition font-medium">
                        ✕ Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtradas.length===0 && <p className="text-center text-gray-400 py-8 text-sm">No hay citas con este filtro</p>}
      </div>
      {modalCancel && <ModalCancelar cita={modalCancel} onCerrar={() => setModalCancel(null)} onConfirmar={handleCancelar} />}
    </main>
  )
}

function SeccionHorario({ citas }) {
  const [medicoSel, setMedicoSel] = useState("Dr. Ramírez")
  const hoy = new Date().toISOString().split("T")[0]
  const medicos = Object.keys(HORARIOS_MEDICO)
  const citasDelMedico = citas
    .filter(c => c.medico===medicoSel && c.fecha===hoy)
    .sort((a,b) => a.hora.localeCompare(b.hora))
  const slots = HORARIOS_MEDICO[medicoSel] || []

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Horario del Médico</h1>
      <div className="flex gap-3 mb-6">
        {medicos.map(m => (
          <button key={m} onClick={() => setMedicoSel(m)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${medicoSel===m ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50"}`}>
            {m}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">📅 Citas de hoy</h2>
          {citasDelMedico.length===0 ? <p className="text-gray-400 text-sm">Sin citas hoy</p> : (
            <ul className="flex flex-col gap-3">
              {citasDelMedico.map(c => (
                <li key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{c.paciente}</p>
                    <p className="text-xs text-gray-400">{c.hora}</p>
                  </div>
                  <Badge estado={c.estado} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">🕐 Disponibilidad</h2>
          <ul className="flex flex-col gap-2">
            {slots.map(hora => {
              const ocupada = citasDelMedico.find(c=>c.hora===hora && c.estado!=="cancelada")
              return (
                <li key={hora} className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm
                  ${ocupada ? "bg-blue-50 border border-blue-200" : "bg-green-50 border border-green-200"}`}>
                  <span className="font-medium">{hora}</span>
                  {ocupada
                    ? <span className="text-blue-700 text-xs font-medium">Ocupado — {ocupada.paciente}</span>
                    : <span className="text-green-700 text-xs font-medium">Disponible</span>
                  }
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </main>
  )
}

function SeccionCobros({ citas, onCobrar }) {
  const [modalCobro, setModalCobro] = useState(null)
  const [historial, setHistorial]   = useState([])
  const pendientesCobro = citas.filter(c => c.estado==="confirmada")
  const totalCobrado    = citas.filter(c => c.estado==="cobrada").reduce((s,c)=>s+c.monto, 0)

  const handleCobrar = async (id, metodo) => {
    const cita = citas.find(c=>c.id===id)
    await updateDoc(doc(db, "citas", id), { estado: "cobrada", metodoPago: metodo })
    setHistorial(prev => [...prev, { ...cita, metodo, fechaCobro: new Date().toLocaleTimeString("es-MX") }])
    setModalCobro(null)
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Cobros</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Statcard label="Total cobrado hoy"   value={`$${totalCobrado}`}                          color="green" />
        <Statcard label="Pendientes de cobro" value={pendientesCobro.length}                      color="amber" />
        <Statcard label="Citas cobradas"      value={citas.filter(c=>c.estado==="cobrada").length} color="blue"  />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">⏳ Por cobrar</h2>
          {pendientesCobro.length===0 ? <p className="text-gray-400 text-sm">No hay citas confirmadas pendientes</p> : (
            <ul className="flex flex-col gap-3">
              {pendientesCobro.map(c => (
                <li key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{c.paciente}</p>
                    <p className="text-xs text-gray-400">{c.hora} · {c.medico}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-700 text-sm">${c.monto}</span>
                    <button onClick={() => setModalCobro(c)}
                      className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-500 transition font-medium">
                      Cobrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">✅ Historial de cobros</h2>
          {historial.length===0 ? <p className="text-gray-400 text-sm">Aún no hay cobros en esta sesión</p> : (
            <ul className="flex flex-col gap-2">
              {historial.map((c,i) => (
                <li key={i} className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{c.paciente}</p>
                    <p className="text-xs text-gray-400">{c.fechaCobro} · {c.metodo}</p>
                  </div>
                  <span className="font-bold text-green-700">${c.monto}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {modalCobro && <ModalCobrar cita={modalCobro} onCerrar={() => setModalCobro(null)} onConfirmar={handleCobrar} />}
    </main>
  )
}

// ─── App principal ────────────────────────────────────────────────────────────
export default function DashboardAsistente() {
  const [seccion, setSeccion]   = useState("inicio")
  const [citas, setCitas]       = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "citas"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setCitas(data)
      setCargando(false)
    })
    return () => unsub()
  }, [])

  // Cobro centralizado — lo usan SeccionCobros y SeccionReportes
  const handleCobrar = async (id, metodo, pmId = null) => {
    const payload = { estado: "cobrada", metodoPago: metodo }
    if (pmId) payload.stripePaymentMethodId = pmId
    await updateDoc(doc(db, "citas", id), payload)
  }

  const titulos = {
    inicio:   "Inicio",
    citas:    "Gestión de Citas",
    horario:  "Horario Médico",
    cobros:   "Cobros",
    reportes: "Reportes",
  }

  if (cargando) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-lg">
      Cargando citas...
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <Navbar seccion={titulos[seccion]} />
      <div className="flex flex-1 overflow-hidden">
        <PanelLateral activo={seccion} setActivo={setSeccion} />
        {seccion==="inicio"   && <SeccionInicio   citas={citas} />}
        {seccion==="citas"    && <SeccionCitas    citas={citas} />}
        {seccion==="horario"  && <SeccionHorario  citas={citas} />}
        {seccion==="cobros"   && <SeccionCobros   citas={citas} onCobrar={handleCobrar} />}
        {seccion==="reportes" && <SeccionReportes citas={citas} onCobrar={handleCobrar} />}
      </div>
    </div>
  )
}