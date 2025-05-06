"use client";

import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { key: "home", title: "Home", icon: "solar:home-2-bold", path: "/dashboard" },
  { key: "analytics", title: "Analytics", icon: "solar:chart-2-bold", path: "/analytics" },
  { key: "inventory", title: "Magazzino", icon: "solar:box-bold", path: "/inventory" },
  { key: "clients", title: "Clienti", icon: "solar:users-group-rounded-bold", path: "/clients" },
  { key: "profile", title: "Profilo", icon: "solar:user-rounded-bold", path: "/profile" }
];

export default function MobileNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Funzione per gestire lo swipe
  const handleSwipe = (direction: 'left' | 'right') => {
    const currentIndex = navItems.findIndex(item => item.path === currentPath);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'left') {
      // Swipe a sinistra, vai alla pagina successiva
      newIndex = (currentIndex + 1) % navItems.length;
    } else {
      // Swipe a destra, vai alla pagina precedente
      newIndex = (currentIndex - 1 + navItems.length) % navItems.length;
    }
    
    navigate(navItems[newIndex].path);
  };
  
  // Gestione degli eventi touch
  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      handleSwipe('left');
    } else if (isRightSwipe) {
      handleSwipe('right');
    }
    
    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-content1 border-t border-content2 shadow-lg z-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between px-2 py-2 max-w-screen-lg mx-auto">
        {navItems.map(item => {
          const isActive = currentPath === item.path;
          return (
            <Button
              key={item.key}
              className={`relative flex flex-col items-center justify-center py-2 px-1 flex-1 min-w-16 transition-all duration-200 ${
                isActive ? 'scale-110' : 'scale-100'
              }`}
              variant="light"
              disableRipple
              onPress={() => navigate(item.path)}
            >
              {isActive && (
                <span className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-primary" />
              )}
              <div className={`rounded-full p-2 ${isActive ? 'bg-primary-100 dark:bg-primary-900' : ''}`}>
                <Icon 
                  icon={item.icon} 
                  width={isActive ? 26 : 22}
                  height={isActive ? 26 : 22}
                  className={`transition-all duration-200 ${isActive ? 'text-primary' : 'text-default-600'}`}
                />
              </div>
              <span className={`text-tiny mt-1 transition-all duration-200 ${
                isActive 
                  ? 'text-primary font-medium' 
                  : 'text-default-600'
              }`}>
                {item.title}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
} 