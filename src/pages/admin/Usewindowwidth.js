import { useState, useEffect } from "react";
 
export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
 
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
 
  return width;
}
 
// Breakpoints
// sm: < 1024px  (laptop pequeña)
// md: 1024-1280px (laptop normal)
// lg: > 1280px  (desktop)
 