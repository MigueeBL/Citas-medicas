import { useState } from "react";
import { auth, googleProvider, db } from "../firebase/config";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import logoHospital from "../assets/logoHospital.png";
import { storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [rol, setRol] = useState("paciente");
  const [especialidad, setEspecialidad] = useState("");
  const [cedula, setCedula] = useState("");
  const [archivoCedula, setArchivoCedula] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
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

  // loginConGoogle ya NO crea el doc ni navega manualmente.
  // App.jsx se encarga de ambas cosas via onAuthStateChanged.
  const loginConGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // App.jsx detecta el cambio de auth, crea el doc si no existe,
      // y redirige automáticamente según el rol.
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Error al iniciar sesión con Google");
      }
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
    if (rol === "medico" && !especialidad.trim())
      return setError("Escribe tu especialidad");
    if (rol === "medico" && !cedula.trim())
      return setError("Escribe tu número de cédula");
    if (rol === "medico" && !archivoCedula)
      return setError("Sube el archivo de tu cédula");

    setSubiendo(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      let urlCedula = "";
      if (rol === "medico" && archivoCedula) {
        const storageRef = ref(
          storage,
          `cedulas/${result.user.uid}/${archivoCedula.name}`,
        );
        await uploadBytes(storageRef, archivoCedula);
        urlCedula = await getDownloadURL(storageRef);
      }

      const datosUsuario = {
        nombre,
        email,
        foto: "",
        rol,
        fechaRegistro: new Date().toISOString(),
        ...(rol === "medico" && {
          especialidad,
          cedula,
          urlCedula,
          estado: "pendiente",
          horarios: [],
        }),
      };

      await setDoc(doc(db, "usuarios", result.user.uid), datosUsuario);

      if (rol === "medico") {
        setExito("¡Solicitud enviada! Un administrador revisará tu cuenta.");
      } else {
        setExito("¡Cuenta creada! Ahora inicia sesión.");
      }
      setTab("login");
      setEmail("");
      setPassword("");
      setNombre("");
      setEspecialidad("");
      setCedula("");
      setArchivoCedula(null);
      setRol("paciente");
    } catch (err) {
      if (err.code === "auth/email-already-in-use")
        setError("Este correo ya está registrado");
      else setError("Error al crear la cuenta");
    }
    setSubiendo(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-200 p-4">
      <div className="flex w-full max-w-5xl min-h-[580px] rounded-2xl overflow-hidden shadow-2xl">
        {/* Panel izquierdo - oculto en móvil */}
        <div className="hidden md:flex flex-1 bg-gradient-to-b from-blue-300 to-blue-700 flex-col justify-between p-9">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-20 h-24 object-contain" />
            <span className="text-white font-bold text-4xl">Citas Médicas</span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 gap-6">
            <img
              src={logoHospital}
              alt="Hospital"
              className="w-[380px] object-contain drop-shadow-2xl"
            />
            <p className="text-white text-2xl font-semibold text-center leading-relaxed max-w-md">
              Gestiona tus citas médicas de forma rápida, segura y moderna.
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
            <div className="flex items-center justify-center gap-3">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <span className="text-blue-600 font-bold text-3xl">
                Citas Médicas
              </span>
            </div>
            <p className="text-blue-600 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
              Gestiona tus citas médicas de forma rápida, segura y moderna.
            </p>
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
            <form onSubmit={registrarse} className="flex flex-col gap-4">
              {/* Selector de rol */}
              <div className="flex gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setRol("paciente")}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    background: rol === "paciente" ? "#1d4ed8" : "transparent",
                    color: rol === "paciente" ? "white" : "#6b7280",
                    borderColor: rol === "paciente" ? "#1d4ed8" : "#e5e7eb",
                  }}
                >
                  👤 Soy paciente
                </button>
                <button
                  type="button"
                  onClick={() => setRol("medico")}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    background: rol === "medico" ? "#1d4ed8" : "transparent",
                    color: rol === "medico" ? "white" : "#6b7280",
                    borderColor: rol === "medico" ? "#1d4ed8" : "#e5e7eb",
                  }}
                >
                  🩺 Soy médico
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-blue-500 tracking-wide">
                  NOMBRE COMPLETO
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
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

              {/* Campos extra para médico */}
              {rol === "medico" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-blue-500 tracking-wide">
                      ESPECIALIDAD
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Cardiología, Pediatría..."
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      className="border-b border-gray-200 bg-transparent py-3 text-sm text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder-gray-300"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-blue-500 tracking-wide">
                      NÚMERO DE CÉDULA
                    </label>
                    <input
                      type="text"
                      placeholder="Número de cédula profesional"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      className="border-b border-gray-200 bg-transparent py-3 text-sm text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder-gray-300"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-blue-500 tracking-wide">
                      CÉDULA PROFESIONAL (archivo)
                    </label>
                    <div
                      className="border border-dashed rounded-xl p-3 text-center cursor-pointer"
                      style={{ borderColor: "#c7d9e5", background: "#f3f6f9" }}
                      onClick={() =>
                        document.getElementById("inputCedula").click()
                      }
                    >
                      {archivoCedula ? (
                        <p className="text-xs text-blue-600 font-medium">
                          ✅ {archivoCedula.name}
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-gray-400">
                            📄 Haz clic para subir tu cédula
                          </p>
                          <p className="text-xs text-gray-300">
                            PDF, JPG o PNG
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      id="inputCedula"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setArchivoCedula(e.target.files[0])}
                    />
                  </div>

                  <div
                    className="rounded-xl p-3 text-xs"
                    style={{ background: "#fef3c7", color: "#92400e" }}
                  >
                    ⚠️ Tu cuenta será revisada por un administrador antes de
                    poder acceder.
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={subiendo}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl tracking-widest text-sm transition-all shadow-lg shadow-blue-200 mt-1 disabled:opacity-60"
              >
                {subiendo
                  ? "Creando cuenta..."
                  : rol === "medico"
                    ? "ENVIAR SOLICITUD"
                    : "CREAR CUENTA"}
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