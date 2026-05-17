import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
 
export default function AdminLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f9" }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}