"use client";

import React from "react";
import Sidebar from "./Sidebar";
import MobileNavBar from "./MobileNavBar";
import { sectionNestedItems } from "./Sidebar";

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
    <div className="flex h-screen bg-background overflow-y-auto">
      {/* Sidebar solo per desktop */}
      <div className="hidden md:block h-screen sticky top-0 w-64 min-w-64 max-w-64 flex-shrink-0">
        <Sidebar defaultSelectedKey="home" items={sectionNestedItems} />
      </div>

      {/* Contenuto principale */}
      <main className="flex-1">
        {children}

        {/* Barra di navigazione mobile */}
        <MobileNavBar />
      </main>
    </div>
  );
}
