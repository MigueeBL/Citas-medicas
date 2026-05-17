import {
  collection, getDocs, query,
  where, Timestamp
} from "firebase/firestore";
import { db } from "../firebase/config";
 
const COL = "citas";
 
// Citas dentro de un rango de fechas
export async function getCitasPorPeriodo(inicio, fin) {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("fecha", ">=", Timestamp.fromDate(inicio)),
      where("fecha", "<=", Timestamp.fromDate(fin))
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
 
// Citas del mes actual
export async function getCitasDelMes(mes, anio) {
  const inicio = new Date(anio, mes, 1);
  const fin    = new Date(anio, mes + 1, 0, 23, 59, 59);
  return getCitasPorPeriodo(inicio, fin);
}
 
// Citas por médico en un período
export async function getCitasPorMedico(medicoId, mes, anio) {
  const inicio = new Date(anio, mes, 1);
  const fin    = new Date(anio, mes + 1, 0, 23, 59, 59);
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("medicoId", "==", medicoId),
      where("fecha", ">=", Timestamp.fromDate(inicio)),
      where("fecha", "<=", Timestamp.fromDate(fin))
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
