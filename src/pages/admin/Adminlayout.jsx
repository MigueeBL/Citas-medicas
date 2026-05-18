import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useWindowWidth } from "./useWindowWidth";
 
export default function AdminLayout() {
  const width    = useWindowWidth();
  const isMobile = width < 768;
  const isSmall  = width < 1024;
 
  const sidebarWidth = isMobile ? 0 : isSmall ? 60 : 220;
 
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f9" }}>
      <Sidebar collapsed={isSmall} hidden={isMobile} />
      <main style={{
        marginLeft: sidebarWidth,
        flex: 1,
        padding: isMobile ? 12 : isSmall ? 16 : 24,
        transition: "margin 0.2s",
        minWidth: 0,
      }}>
        <Outlet />
      </main>
    </div>
  );
}