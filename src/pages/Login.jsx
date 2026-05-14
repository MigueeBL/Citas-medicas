import { useState } from "react";
import { auth, googleProvider, db } from "../firebase/config";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
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
    setError("");
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const ref = doc(db, "usuarios", result.user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) redirigirPorRol(snap.data().rol);
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    }
  };

  const registrarse = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    if (!nombre.trim()) return setError("Escribe tu nombre completo");
    if (password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres");
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await setDoc(doc(db, "usuarios", result.user.uid), {
        nombre,
        email,
        foto: "",
        rol: "paciente",
      });
      setExito("¡Cuenta creada! Ahora inicia sesión.");
      setTab("login");
      setEmail("");
      setPassword("");
      setNombre("");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado");
      } else {
        setError("Error al crear la cuenta");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-200 p-4">
      <div className="flex w-full max-w-5xl min-h-[580px] rounded-2xl overflow-hidden shadow-2xl">
        {/* Panel izquierdo - oculto en móvil */}
        <div className="hidden md:flex flex-1 bg-gradient-to-b from-blue-300 to-blue-700 flex-col justify-between p-9">
          <span className="text-white font-bold text-4xl">Citas Médicas</span>
          <div className="flex flex-col items-center gap-4">
            <p className="text-white font-bold text-2xl text-center leading-snug">
              Aquí irá el logo y una frase
            </p>
          </div>
          <span className="text-white/40 text-sm text-center">
            © 2026 Citas Médicas
          </span>
        </div>

        {/* Panel derecho - full width en móvil */}
        <div className="flex-1 md:flex-[1.2] bg-white flex flex-col justify-center px-8 md:px-14 py-10">
          {/* Logo solo visible en móvil */}
          <div className="md:hidden mb-8 text-center">
            <span className="text-blue-600 font-bold text-3xl">
              Citas Médicas
            </span>
            <p className="text-gray-400 text-sm mt-1">Aquí irá el logo y una frase</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mb-8">
            <span
              onClick={() => {
                setTab("login");
                setError("");
                setExito("");
              }}
              className={`text-xl md:text-2xl font-bold pb-1 cursor-pointer transition-colors ${tab === "login" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-300"}`}
            >
              Iniciar sesión
            </span>
            <span
              onClick={() => {
                setTab("registro");
                setError("");
                setExito("");
              }}
              className={`text-xl md:text-2xl font-bold pb-1 cursor-pointer transition-colors ${tab === "registro" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-300"}`}
            >
              Registro
            </span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 rounded-xl px-4 py-3 text-sm mb-4 text-center">
              {error}
            </div>
          )}
          {exito && (
            <div className="bg-green-50 text-green-600 rounded-xl px-4 py-3 text-sm mb-4 text-center">
              {exito}
            </div>
          )}

          {/* Formulario login */}
          {tab === "login" && (
            <form onSubmit={loginConEmail} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-blue-500 tracking-wide">
                  CORREO ELECTRÓNICO
                </label>
                <input
                  type="email"
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-b border-gray-200 bg-transparent py-3 text-sm text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder-gray-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-blue-500 tracking-wide">
                  CONTRASEÑA
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-b border-gray-200 bg-transparent py-3 text-sm text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder-gray-300"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl tracking-widest text-sm transition-all shadow-lg shadow-blue-200 mt-1"
              >
                INICIAR SESIÓN
              </button>
            </form>
          )}

          {/* Formulario registro */}
          {tab === "registro" && (
            <form onSubmit={registrarse} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-blue-500 tracking-wide">
                  NOMBRE COMPLETO
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="border-b border-gray-200 bg-transparent py-3 text-sm text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder-gray-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-blue-500 tracking-wide">
                  CORREO ELECTRÓNICO
                </label>
                <input
                  type="email"
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-b border-gray-200 bg-transparent py-3 text-sm text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder-gray-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-blue-500 tracking-wide">
                  CONTRASEÑA
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-b border-gray-200 bg-transparent py-3 text-sm text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder-gray-300"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl tracking-widest text-sm transition-all shadow-lg shadow-blue-200 mt-1"
              >
                CREAR CUENTA
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-6">
            <hr className="flex-1 border-gray-200" />
            <span className="text-sm text-gray-400 font-semibold">
              O continúa con
            </span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <button
            onClick={loginConGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 bg-white hover:border-blue-500 hover:shadow-md transition-all text-sm font-semibold text-gray-600"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              width="20"
              height="20"
              alt="Google"
            />
            Continuar con Google
          </button>
          {/* Copyright solo móvil */}
          <p className="md:hidden text-center text-gray-400 text-sm mt-6">
            © 2026 Citas Médicas
          </p>
        </div>
      </div>
    </div>
  );
}
