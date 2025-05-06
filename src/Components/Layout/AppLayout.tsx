"use client";

import React from "react";
import Sidebar from "./Sidebar";
import MobileNavBar from "./MobileNavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar solo per desktop */}
      <div className="hidden md:block">
        <Sidebar defaultSelectedKey="home" />
      </div>
      
      {/* Contenuto principale */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
        
        {/* Barra di navigazione mobile */}
        <MobileNavBar />
      </main>
    </div>
  );
} 