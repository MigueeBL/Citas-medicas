import {
  collection, getDocs, getDoc,
  doc, deleteDoc, updateDoc,
  query, where, Timestamp
} from "firebase/firestore";
import { db } from "../firebase/config";
 
const COL = "usuarios";
 
// Obtener todos los pacientes
export async function getPacientes() {
  const snap = await getDocs(
    query(collection(db, COL), where("rol", "==", "paciente"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
 
// Obtener usuario por ID
export async function getUsuarioById(id) {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
 
// Eliminar cuenta de usuario
export async function eliminarUsuario(id) {
  await deleteDoc(doc(db, COL, id));
}
 
// Activar o desactivar usuario
export async function toggleActivoUsuario(id, activo) {
  await updateDoc(doc(db, COL, id), { activo });
}
 
// Pacientes nuevos en los últimos N días
export async function getPacientesNuevos(dias = 7) {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("rol", "==", "paciente"),
      where("fechaRegistro", ">=", Timestamp.fromDate(desde))
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
 