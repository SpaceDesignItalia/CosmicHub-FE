import React, { createContext, useContext, useState, useEffect } from 'react';

export type SidebarMode = 'pinned' | 'auto-hide';

interface SidebarContextType {
  mode: SidebarMode;
  isVisible: boolean;
  isHovered: boolean;
  toggleMode: () => void;
  setIsVisible: (visible: boolean) => void;
  setIsHovered: (hovered: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Carica modalità salvata o default a 'pinned'
  const [mode, setMode] = useState<SidebarMode>(() => {
    const saved = localStorage.getItem('sidebar-mode');
    return (saved as SidebarMode) || 'pinned';
  });
  
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Salva la modalità nel localStorage quando cambia
  useEffect(() => {
    localStorage.setItem('sidebar-mode', mode);
  }, [mode]);

  // Gestione visibilità in base alla modalità
  useEffect(() => {
    if (mode === 'pinned') {
      setIsVisible(true);
    } else {
      // In modalità auto-hide, mostra solo se è hovered
      setIsVisible(isHovered);
    }
  }, [mode, isHovered]);

  const toggleMode = () => {
    setMode(current => {
      const newMode = current === 'pinned' ? 'auto-hide' : 'pinned';
      return newMode;
    });
  };

  const value: SidebarContextType = {
    mode,
    isVisible,
    isHovered,
    toggleMode,
    setIsVisible,
    setIsHovered,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}; 