import { useState, useMemo } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Document, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, Packer, WidthType, BorderStyle } from "docx"
import { saveAs } from "file-saver"

const stripePromise = loadStripe("pk_test_TU_CLAVE_PUBLICA_DE_STRIPE")

const hoy = new Date()
const isoHoy = hoy.toISOString().split("T")[0]
const inicioSemana = (() => {
  const d = new Date(hoy)
  d.setDate(hoy.getDate() - hoy.getDay())
  return d.toISOString().split("T")[0]
})()
const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`

function enRango(fecha, desde) { return fecha >= desde }

function BarraProgreso({ label, value, total, color }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0
  return (
    <li>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800 text-xs sm:text-sm">${value.toLocaleString()} MXN ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  )
}

function FormularioPago({ monto, paciente, onExito, onCerrar }) {
  const stripe = useStripe()
  const elements = useElements()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState(false)

  const handlePagar = async () => {
    if (!stripe || !elements) return
    setCargando(true)
    setError("")
    const card = elements.getElement(CardElement)
    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({ type: "card", card })
    if (stripeError) {
      setError(stripeError.message)
      setCargando(false)
      return
    }
    setExito(true)
    setCargando(false)
    setTimeout(() => onExito(paymentMethod.id), 1500)
  }

  if (exito) return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✅</div>
      <p className="font-bold text-gray-800">¡Pago procesado!</p>
      <p className="text-sm text-gray-500">Tarjeta autorizada exitosamente</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 rounded-xl px-4 py-3 text-center">
        <p className="text-sm text-gray-500">Total a cobrar</p>
        <p className="text-3xl font-bold text-blue-700">${monto} MXN</p>
        <p className="text-xs text-gray-400 mt-1">Paciente: {paciente}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Datos de tarjeta</label>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <CardElement options={{
            style: {
              base: { fontSize: "16px", color: "#374151", "::placeholder": { color: "#9ca3af" } },
              invalid: { color: "#ef4444" }
            }
          }} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Prueba: usa <strong>4242 4242 4242 4242</strong> · cualquier fecha futura · cualquier CVC
        </p>
      </div>
      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3 mt-1">
        <button onClick={onCerrar}
          className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button onClick={handlePagar} disabled={cargando || !stripe}
          className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition flex items-center justify-center gap-2">
          {cargando ? <><span className="animate-spin">⏳</span> Procesando...</> : "💳 Pagar con tarjeta"}
        </button>
      </div>
      <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
        🔒 Pago seguro con <strong>Stripe</strong>
      </p>
    </div>
  )
}

function ModalPagoStripe({ cita, onCerrar, onExito }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Pago con tarjeta</h3>
        <Elements stripe={stripePromise}>
          <FormularioPago
            monto={cita.monto}
            paciente={cita.paciente}
            onExito={(pmId) => onExito(cita.id, "tarjeta", pmId)}
            onCerrar={onCerrar}
          />
        </Elements>
      </div>
    </div>
  )
}

export default function SeccionReportes({ citas, onCobrar }) {
  const [periodo, setPeriodo] = useState("dia")
  const [modalPago, setModalPago] = useState(null)
  const [exportando, setExportando] = useState(false)

  const desde = periodo === "dia" ? isoHoy : periodo === "semana" ? inicioSemana : inicioMes

  const cobradas = useMemo(() =>
    citas.filter(c => c.estado === "cobrada" && enRango(c.fecha, desde)),
    [citas, desde]
  )

  const totalGeneral = cobradas.reduce((s, c) => s + c.monto, 0)

  const porMedico = useMemo(() => {
    const medicos = [...new Set(citas.map(c => c.medico))]
    return medicos.map(m => ({
      medico: m,
      totalCobrado: cobradas.filter(c => c.medico === m).reduce((s, c) => s + c.monto, 0),
      numCitas: cobradas.filter(c => c.medico === m).length,
      efectivo: cobradas.filter(c => c.medico === m && c.metodoPago === "efectivo").reduce((s, c) => s + c.monto, 0),
      tarjeta: cobradas.filter(c => c.medico === m && c.metodoPago === "tarjeta").reduce((s, c) => s + c.monto, 0),
      transferencia: cobradas.filter(c => c.medico === m && c.metodoPago === "transferencia").reduce((s, c) => s + c.monto, 0),
    })).sort((a, b) => b.totalCobrado - a.totalCobrado)
  }, [cobradas, citas])

  const porMetodo = useMemo(() => ({
    efectivo: cobradas.filter(c => c.metodoPago === "efectivo").reduce((s, c) => s + c.monto, 0),
    tarjeta: cobradas.filter(c => c.metodoPago === "tarjeta").reduce((s, c) => s + c.monto, 0),
    transferencia: cobradas.filter(c => c.metodoPago === "transferencia").reduce((s, c) => s + c.monto, 0),
  }), [cobradas])

  const pendientesTarjeta = citas.filter(c => c.estado === "confirmada")

  const exportarCSV = () => {
    setExportando(true)
    const filas = [
      ["Médico", "Citas", "Total Cobrado", "Efectivo", "Tarjeta", "Transferencia"],
      ...porMedico.map(m => [m.medico, m.numCitas, m.totalCobrado, m.efectivo, m.tarjeta, m.transferencia])
    ]
    const csv = filas.map(f => f.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-medicos-${desde}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportando(false)
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Reporte de Ingresos", 14, 20)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Periodo: ${periodo === "dia" ? "Hoy" : periodo === "semana" ? "Esta semana" : "Este mes"}`, 14, 28)
    doc.text(`Total recaudado: $${totalGeneral.toLocaleString()} MXN`, 14, 35)
    autoTable(doc, {
      startY: 42,
      head: [["Médico", "Consultas", "Efectivo", "Tarjeta", "Transferencia", "Total"]],
      body: porMedico.map(m => [
        m.medico, m.numCitas,
        `$${m.efectivo.toLocaleString()}`,
        `$${m.tarjeta.toLocaleString()}`,
        `$${m.transferencia.toLocaleString()}`,
        `$${m.totalCobrado.toLocaleString()}`,
      ]),
      foot: [["TOTAL", cobradas.length,
        `$${porMetodo.efectivo.toLocaleString()}`,
        `$${porMetodo.tarjeta.toLocaleString()}`,
        `$${porMetodo.transferencia.toLocaleString()}`,
        `$${totalGeneral.toLocaleString()}`
      ]],
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    })
    doc.save(`reporte-${desde}.pdf`)
  }

  const exportarWord = async () => {
    const filaEncabezado = new TableRow({
      children: ["Médico", "Consultas", "Efectivo", "Tarjeta", "Transferencia", "Total"].map(txt =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: txt, bold: true })] })],
          shading: { fill: "2563EB" },
        })
      ),
    })
    const filasDatos = porMedico.map(m =>
      new TableRow({
        children: [
          m.medico, String(m.numCitas),
          `$${m.efectivo.toLocaleString()}`,
          `$${m.tarjeta.toLocaleString()}`,
          `$${m.transferencia.toLocaleString()}`,
          `$${m.totalCobrado.toLocaleString()}`,
        ].map(txt => new TableCell({ children: [new Paragraph(txt)] }))
      })
    )
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Reporte de Ingresos", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Total recaudado: $${totalGeneral.toLocaleString()} MXN`, spacing: { after: 300 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [filaEncabezado, ...filasDatos],
          }),
        ],
      }],
    })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `reporte-${desde}.docx`)
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      {/* Encabezado con botones de exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reportes</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportarCSV}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm">
            📊 CSV
          </button>
          <button onClick={exportarPDF}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm">
            📄 PDF
          </button>
          <button onClick={exportarWord}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm">
            📝 Word
          </button>
        </div>
      </div>

      {/* Selector de periodo */}
      <div className="flex gap-2 mb-4 sm:mb-6 flex-wrap">
        {[["dia", "Hoy"], ["semana", "Esta semana"], ["mes", "Este mes"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setPeriodo(id)}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition
              ${periodo === id ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50"}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Stats generales — 2 cols en móvil, 4 en desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { label: "Total recaudado", value: `$${totalGeneral.toLocaleString()}`, bg: "bg-green-50", text: "text-green-700", num: "text-green-800" },
          { label: "Consultas cobradas", value: cobradas.length, bg: "bg-blue-50", text: "text-blue-700", num: "text-blue-800" },
          { label: "En efectivo", value: `$${porMetodo.efectivo.toLocaleString()}`, bg: "bg-amber-50", text: "text-amber-700", num: "text-amber-800" },
          { label: "Con tarjeta / transfer.", value: `$${(porMetodo.tarjeta + porMetodo.transferencia).toLocaleString()}`, bg: "bg-purple-50", text: "text-purple-700", num: "text-purple-800" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 sm:p-5 flex flex-col gap-1`}>
            <p className={`text-xs font-medium ${s.text} leading-tight`}>{s.label}</p>
            <p className={`text-xl sm:text-3xl font-bold ${s.num}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Dos tarjetas — apiladas en móvil, lado a lado en desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Ranking por médico */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">🏆 Ingresos por médico</h2>
          {porMedico.length === 0
            ? <p className="text-gray-400 text-sm">Sin cobros en este periodo</p>
            : (
              <ul className="flex flex-col gap-4">
                {porMedico.map((m, i) => (
                  <li key={m.medico} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                          ${i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : "bg-gray-100 text-gray-500"}`}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-sm text-gray-800 truncate">{m.medico}</span>
                      </div>
                      <span className="font-bold text-green-700 text-sm flex-shrink-0 ml-2">${m.totalCobrado.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${totalGeneral > 0 ? Math.round(m.totalCobrado / totalGeneral * 100) : 0}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-400">
                      <span>💵 ${m.efectivo}</span>
                      <span>💳 ${m.tarjeta}</span>
                      <span>🏦 ${m.transferencia}</span>
                      <span className="ml-auto">{m.numCitas} consultas</span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          }
        </div>

        {/* Métodos de pago */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">💳 Métodos de pago</h2>
          <ul className="flex flex-col gap-4">
            <BarraProgreso label="💵 Efectivo" value={porMetodo.efectivo} total={totalGeneral} color="bg-amber-400" />
            <BarraProgreso label="💳 Tarjeta" value={porMetodo.tarjeta} total={totalGeneral} color="bg-blue-500" />
            <BarraProgreso label="🏦 Transferencia" value={porMetodo.transferencia} total={totalGeneral} color="bg-purple-500" />
          </ul>

          {/* Cobro rápido con tarjeta */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="font-bold text-sm text-gray-700 mb-3">⚡ Cobro rápido con tarjeta</h3>
            {pendientesTarjeta.length === 0
              ? <p className="text-gray-400 text-xs">No hay citas confirmadas pendientes</p>
              : (
                <ul className="flex flex-col gap-2">
                  {pendientesTarjeta.slice(0, 3).map(c => (
                    <li key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.paciente}</p>
                        <p className="text-xs text-gray-400 truncate">{c.hora} · {c.medico}</p>
                      </div>
                      <button onClick={() => setModalPago(c)}
                        className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500 transition font-medium flex-shrink-0">
                        💳 Cobrar
                      </button>
                    </li>
                  ))}
                </ul>
              )
            }
          </div>
        </div>
      </div>

      {/* Tabla detallada — scroll horizontal en móvil */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">📋 Detalle por médico</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-semibold rounded-l-xl">Médico</th>
                <th className="px-4 py-3 font-semibold">Consultas</th>
                <th className="px-4 py-3 font-semibold">Efectivo</th>
                <th className="px-4 py-3 font-semibold">Tarjeta</th>
                <th className="px-4 py-3 font-semibold">Transferencia</th>
                <th className="px-4 py-3 font-semibold rounded-r-xl">Total</th>
              </tr>
            </thead>
            <tbody>
              {porMedico.length === 0
                ? <tr><td colSpan={6} className="text-center text-gray-400 py-6 text-sm">Sin datos en este periodo</td></tr>
                : porMedico.map((m, i) => (
                  <tr key={m.medico} className={`border-t border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{m.medico}</td>
                    <td className="px-4 py-3 text-gray-600">{m.numCitas}</td>
                    <td className="px-4 py-3 text-amber-700">${m.efectivo.toLocaleString()}</td>
                    <td className="px-4 py-3 text-blue-700">${m.tarjeta.toLocaleString()}</td>
                    <td className="px-4 py-3 text-purple-700">${m.transferencia.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-green-700">${m.totalCobrado.toLocaleString()}</td>
                  </tr>
                ))
              }
            </tbody>
            {porMedico.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-800">TOTAL</td>
                  <td className="px-4 py-3 font-bold">{cobradas.length}</td>
                  <td className="px-4 py-3 font-bold text-amber-700">${porMetodo.efectivo.toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-blue-700">${porMetodo.tarjeta.toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-purple-700">${porMetodo.transferencia.toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-green-700">${totalGeneral.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {modalPago && (
        <ModalPagoStripe
          cita={modalPago}
          onCerrar={() => setModalPago(null)}
          onExito={(id, metodo, pmId) => {
            onCobrar(id, metodo, pmId)
            setModalPago(null)
          }}
        />
      )}
    </main>
  )
}