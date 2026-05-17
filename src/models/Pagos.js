import {
  collection, getDocs, query,
  where, Timestamp
} from "firebase/firestore";
import { db } from "../firebase/config";
 
const COL = "pagos";
 
// Pagos dentro de un rango de fechas
export async function getPagosPorPeriodo(inicio, fin) {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("fecha", ">=", Timestamp.fromDate(inicio)),
      where("fecha", "<=", Timestamp.fromDate(fin))
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
 
// Pagos del mes
export async function getPagosDelMes(mes, anio) {
  const inicio = new Date(anio, mes, 1);
  const fin    = new Date(anio, mes + 1, 0, 23, 59, 59);
  return getPagosPorPeriodo(inicio, fin);
}
 
// Total de ingresos de una lista de pagos
export function calcularTotalIngresos(pagos) {
  return pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0);
}
 
// Ingresos agrupados por médico
export function agruparIngresosPorMedico(pagos, medicosMap) {
  const mapa = {};
  pagos.forEach((p) => {
    const mid = p.medicoId;
    if (!mapa[mid]) {
      mapa[mid] = {
        medicoId:     mid,
        nombre:       medicosMap[mid]?.nombre ?? "Médico desconocido",
        especialidad: medicosMap[mid]?.especialidad ?? "—",
        citas:        0,
        ingresos:     0,
      };
    }
    mapa[mid].citas    += 1;
    mapa[mid].ingresos += p.monto ?? 0;
  });
  return Object.values(mapa).sort((a, b) => b.ingresos - a.ingresos);
}
 