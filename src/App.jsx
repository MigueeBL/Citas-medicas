import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from "./pages/Login";
import DashboardMedico from "./pages/DashboardMedico";
import DashboardPaciente from "./pages/DashboardPaciente";
import DashboardAsistente from "./pages/DashboardAsistente";
//import DashboardAdmin from "./pages/DashboardAdmin";
import AdminLayout from "./pages/admin/Adminlayout";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Medicos from "./pages/admin/Medicos";
import Pacientes from "./pages/admin/Pacientes";
import Ingresos from "./pages/admin/Ingresos";
import CitasMensuales from "./pages/admin/Citasmensuales";

function RutaProtegida({ user, rolRequerido, children }) {
  if (!user) return <Navigate to="/" />;
  if (user.rol !== rolRequerido) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, "usuarios", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUser({ uid: firebaseUser.uid, ...snap.data() });
        }
      } else {
        setUser(null);
      }
      setCargando(false);
    });
    return () => unsub();
  }, []);

  if (cargando) return (
    <div className="flex items-center justify-center h-screen text-xl">
      Cargando...
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/medico" element={
          <RutaProtegida user={user} rolRequerido="medico">
            <DashboardMedico user={user} />
          </RutaProtegida>
        } />
        <Route path="/paciente" element={
          <RutaProtegida user={user} rolRequerido="paciente">
            <DashboardPaciente user={user} />
          </RutaProtegida>
        } />
        <Route path="/asistente" element={
          <RutaProtegida user={user} rolRequerido="asistente">
            <DashboardAsistente user={user} />
          </RutaProtegida>
        } />
        <Route path="/admin" element={
          <RutaProtegida user={user} rolRequerido="admin">
            <DashboardAdmin user={user} />
          </RutaProtegida>
        } />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardAdmin />} />
          <Route path="medicos" element={<Medicos />} />
          <Route path="validar" element={<Medicos />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="ingresos" element={<Ingresos />} />
          <Route path="citas" element={<CitasMensuales />} />
          <Route path="estadisticas" element={<DashboardAdmin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}