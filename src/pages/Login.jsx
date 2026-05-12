import { useState } from "react";
import { auth, googleProvider, db } from "../firebase/config";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const redirigirPorRol = (rol) => {
    const rutas = {
      medico: "/medico",
      paciente: "/paciente",
      asistente: "/asistente",
      admin: "/admin",
    };
    navigate(rutas[rol] || "/");
  };

  const loginConGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // Primera vez: se registra como paciente por defecto
        await setDoc(ref, {
          nombre: user.displayName,
          email: user.email,
          foto: user.photoURL,
          rol: "paciente",
        });
        navigate("/paciente");
      } else {
        redirigirPorRol(snap.data().rol);
      }
    } catch (err) {
      setError("Error al iniciar sesión con Google");
    }
  };

  const loginConEmail = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const ref = doc(db, "usuarios", result.user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) redirigirPorRol(snap.data().rol);
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
          Citas Médicas
        </h1>
        <p className="text-center text-gray-500 mb-8">Inicia sesión para continuar</p>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={loginConGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 mb-6 hover:bg-gray-50 transition font-medium"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <hr className="flex-1 border-gray-200" />
          <span className="text-gray-400 text-sm">o</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <form onSubmit={loginConEmail} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}