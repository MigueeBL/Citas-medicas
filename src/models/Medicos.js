import {
  collection, getDocs, getDoc,
  doc, updateDoc, query, where
} from "firebase/firestore";
import { db } from "../firebase/config";
 
const COL = "medicos";
 
// Obtener todos los médicos
export async function getMedicos() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
 
// Obtener médico por ID
export async function getMedicoById(id) {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
 
// Médicos activos y validados
export async function getMedicosActivos() {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("activo", "==", true),
      where("validado", "==", true)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
 
// Médicos pendientes de validación
export async function getMedicosPendientes() {
  const snap = await getDocs(
    query(collection(db, COL), where("validado", "==", false))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
 
// Validar o quitar validación a un médico
export async function toggleValidarMedico(id, validado) {
  await updateDoc(doc(db, COL, id), { validado });
}
 
// Activar o desactivar médico
export async function toggleActivoMedico(id, activo) {
  await updateDoc(doc(db, COL, id), { activo });
}
