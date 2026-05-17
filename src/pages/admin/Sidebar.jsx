import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
 
const navItems = [
  { section: "General" },
  { to: "/admin",            icon: "🏠", label: "Dashboard" },
  { section: "Reportes" },
  { to: "/admin/medicos",    icon: "🩺", label: "Médicos" },
  { to: "/admin/estadisticas", icon: "📊", label: "Estadísticas" },
  { to: "/admin/ingresos",   icon: "💰", label: "Ingresos" },
  { to: "/admin/citas",      icon: "📅", label: "Citas mensuales" },
  { section: "Usuarios" },
  { to: "/admin/pacientes",  icon: "👥", label: "Pacientes" },
];
 
export default function Sidebar() {
  const navigate = useNavigate();
 
  async function handleLogout() {
    await signOut(auth);
    navigate("/");
  }
 
  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoArea}>
        <div style={styles.logoIcon}>❤️</div>
        <div>
          <div style={styles.brandName}>Citas Médicas</div>
          <div style={styles.brandSub}>Administrador</div>
        </div>
      </div>
 
      {/* Navegación */}
      <nav style={styles.nav}>
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} style={styles.navSection}>{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
 
      {/* Footer */}
      <div style={styles.sidebarFooter}>
        <div style={styles.avatar}>AD</div>
        <div style={{ flex: 1 }}>
          <div style={styles.footerName}>Admin</div>
          <div style={styles.footerRole}>Administrador</div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
          🚪
        </button>
      </div>
    </aside>
  );
}
 
const BLUE = "#185FA5";
 
const styles = {
  sidebar: {
    width: 220,
    minHeight: "100vh",
    background: BLUE,
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 100,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 16px",
    borderBottom: "0.5px solid rgba(255,255,255,0.15)",
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: "white",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  brandName: {
    color: "white",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  brandSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  nav: {
    flex: 1,
    padding: "12px 0",
    overflowY: "auto",
  },
  navSection: {
    padding: "10px 16px 4px",
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 16px",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textDecoration: "none",
    borderLeft: "3px solid transparent",
    transition: "background 0.15s",
  },
  navItemActive: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    borderLeft: "3px solid white",
  },
  sidebarFooter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderTop: "0.5px solid rgba(255,255,255,0.15)",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "white",
  },
  footerName: {
    fontSize: 12,
    fontWeight: 500,
    color: "white",
  },
  footerRole: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
  },
};