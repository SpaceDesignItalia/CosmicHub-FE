"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNavBar from "./MobileNavBar";
import { sectionNestedItems } from "./Sidebar";
import { useSidebar } from "../../providers/SidebarProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function AppLayout() {
  const [isMobile, setIsMobile] = React.useState(false);
  const { mode, isVisible, setIsHovered } = useSidebar();

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const sidebarVariants = {
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        duration: 0.3
      }
    },
    hidden: {
      x: -260,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        duration: 0.2
      }
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar per desktop con auto-hide */}
      {!isMobile && (
        <>
          {/* Area di hover per attivare la sidebar in modalità auto-hide */}
          {mode === 'auto-hide' && !isVisible && (
            <div 
              className="fixed left-0 top-0 w-16 h-full z-50"
              onMouseEnter={() => {
                console.log("🖱️ Hover area activated");
                setIsHovered(true);
              }}
              title="Avvicinati per mostrare la sidebar"
            >
              {/* Indicatore sottile */}
              <div className="w-1 h-full bg-primary/20 hover:bg-primary/40 transition-colors" />
            </div>
          )}
          
          <AnimatePresence>
            {(mode === 'pinned' || isVisible) && (
              <motion.div
                key="sidebar"
                variants={sidebarVariants}
                initial={mode === 'pinned' ? 'visible' : 'hidden'}
                animate="visible"
                exit="hidden"
                className={`flex-shrink-0 ${
                  mode === 'auto-hide' 
                    ? 'fixed left-0 top-0 z-40 h-screen p-6 pt-8 pb-8' // Ridotto padding per più spazio interno
                    : 'relative h-screen'
                }`}
                style={{ width: mode === 'auto-hide' ? '18rem' : '16rem' }} // Sidebar più larga in auto-hide
                onMouseLeave={() => {
                  if (mode === 'auto-hide') {
                    console.log("🖱️ Left sidebar area");
                    setIsHovered(false);
                  }
                }}
              >
                {/* Sidebar content con altezza adattiva */}
                <div className={`${
                  mode === 'auto-hide'
                    ? 'h-full rounded-xl shadow-xl bg-background/98 border border-default-200/50 dark:border-default-300/50 backdrop-blur-md overflow-hidden' // Container con overflow hidden per bordi
                    : 'h-full' // Altezza piena in modalità pinned
                }`}>
                  <div className="h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden">
                    <Sidebar defaultSelectedKey="home" items={sectionNestedItems} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Contenuto principale con padding adattivo */}
      <main 
        className="flex-1 overflow-auto"
      >
        <Outlet />

        {/* Barra di navigazione mobile */}
        <MobileNavBar />
      </main>
    </div>
  );
}
