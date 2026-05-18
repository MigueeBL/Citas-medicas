import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from "./pages/Login";
import DashboardMedico from "./pages/DashboardMedico";
import DashboardPaciente from "./pages/DashboardPaciente";
import DashboardAsistente from "./pages/DashboardAsistente";
import AdminLayout from "./pages/admin/Adminlayout";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Medicos from "./pages/admin/Medicos";
import Pacientes from "./pages/admin/Pacientes";
import Ingresos from "./pages/admin/Ingresos";
import CitasMensuales from "./pages/admin/Citasmensuales";
import Estadisticas from "./pages/admin/Estadisticas";

function RutaProtegida({ user, rolRequerido, children }) {
  if (!user) return <Navigate to="/" />;
  if (user.rol !== rolRequerido) return <Navigate to="/" />;
  // Si es médico pero no está aprobado, manda a pantalla de espera
  if (rolRequerido === "medico" && user.estado !== "aprobado") {
    return <PantallaEspera user={user} />;
  }
  return children;
}

function PantallaEspera({ user }) {
  const { signOut } = require("firebase/auth");
  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: "#f3f6f9"}}>
      <div className="bg-white rounded-2xl p-10 shadow-sm text-center max-w-md" style={{border: "1px solid #c7d9e5"}}>
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-bold mb-2" style={{color: "#2f4157"}}>Solicitud en revisión</h2>
        <p className="text-sm mb-1" style={{color: "#567c8e"}}>Hola, <strong>{user?.nombre}</strong></p>
        <p className="text-sm mb-6" style={{color: "#a2c1d1"}}>
          Tu cuenta está siendo revisada por un administrador. Te notificaremos cuando sea aprobada.
        </p>
        <button
          onClick={() => { import("firebase/auth").then(({signOut, getAuth}) => signOut(getAuth())); window.location.href = "/"; }}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{background: "#567c8e"}}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
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
    <div className="flex items-center justify-center h-screen text-xl" style={{color: "#567c8e"}}>
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
            <AdminLayout />
          </RutaProtegida>
        }>
          <Route index element={<DashboardAdmin />} />
          <Route path="medicos" element={<Medicos />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="ingresos" element={<Ingresos />} />
          <Route path="citas" element={<CitasMensuales />} />
          <Route path="estadisticas" element={<Estadisticas />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}