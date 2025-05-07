import React, { createContext, useContext, useMemo } from "react";
import { useCustomTheme } from "../../providers/ThemeProvider";

// Tipi di veicolo
export type VehicleType = "Large Van" | "Small Van";

// Stati possibili del veicolo
export type VehicleStatus = "Available" | "In use" | "Maintenance";

// Interfaccia per i colori del tema del veicolo
interface VehicleThemeColors {
  // Colori di base per lo sfondo delle card
  cardBackground: string;
  cardBorder: string;
  cardHoverBorder: string;
  cardSelectedBg: string;
  cardSelectedBorder: string;
  
  // Colori per gli stati dei veicoli
  statusColors: {
    available: {
      bg: string;
      border: string;
      text: string;
    };
    inUse: {
      bg: string;
      border: string;
      text: string;
    };
    maintenance: {
      bg: string;
      border: string;
      text: string;
    };
  };
  
  // Colori per il tipo di veicolo
  typeColors: {
    largeVan: {
      bg: string;
      border: string;
    };
    smallVan: {
      bg: string;
      border: string;
    };
  };
  
  // Colori per la mappa
  map: {
    background: string;
    streets: string;
    path: {
      completed: string;
      active: string;
    };
    points: {
      start: string;
      delivery: string;
      end: string;
    };
  };
  
  // Altre proprietà UI
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

// Interfaccia del context
interface VehicleThemeContextType {
  colors: VehicleThemeColors;
  getStatusStyles: (status: VehicleStatus) => {
    bgColor: string;
    borderColor: string;
    textColor: string;
  };
  getTypeStyles: (type: VehicleType) => {
    bgColor: string;
    borderColor: string;
  };
  getSelectionStyles: (selected: boolean) => {
    backgroundColor: string;
    borderColor: string;
    boxShadow?: string;
  };
  getCardClasses: (selected: boolean) => string;
  isDark: boolean;
}

// Creazione del context
const VehicleThemeContext = createContext<VehicleThemeContextType | undefined>(undefined);

interface VehicleThemeProviderProps {
  children: React.ReactNode;
}

export const VehicleThemeProvider: React.FC<VehicleThemeProviderProps> = ({ children }) => {
  // Utilizziamo il tema dell'applicazione
  const { isDark } = useCustomTheme();
  
  // Definiamo i colori del tema in base al tema dell'applicazione
  const colors: VehicleThemeColors = useMemo(() => ({
    cardBackground: isDark ? "#18181b" : "#ffffff", // dark:bg-zinc-900 : bg-white
    cardBorder: isDark ? "#27272a" : "#e4e4e7", // dark:border-zinc-800 : border-zinc-200
    cardHoverBorder: isDark ? "#3f3f46" : "#93c5fd", // dark:hover:border-blue-700 : hover:border-blue-300
    cardSelectedBg: isDark ? "#0c0a2e" : "#eff6ff", // dark:bg-blue-950 : bg-blue-50
    cardSelectedBorder: isDark ? "#1e40af" : "#60a5fa", // dark:border-blue-700 : border-blue-400
    
    statusColors: {
      available: {
        bg: isDark ? "#052e16" : "#f0fdf4", // dark:bg-green-950 : bg-green-50
        border: isDark ? "#166534" : "#bbf7d0", // dark:border-green-700 : border-green-200
        text: isDark ? "#4ade80" : "#15803d", // dark:text-green-300 : text-green-700
      },
      inUse: {
        bg: isDark ? "#172554" : "#eff6ff", // dark:bg-blue-950 : bg-blue-50
        border: isDark ? "#1e40af" : "#bfdbfe", // dark:border-blue-700 : border-blue-200
        text: isDark ? "#60a5fa" : "#1d4ed8", // dark:text-blue-300 : text-blue-700
      },
      maintenance: {
        bg: isDark ? "#451a03" : "#fffbeb", // dark:bg-amber-950 : bg-amber-50
        border: isDark ? "#92400e" : "#fde68a", // dark:border-amber-700 : border-amber-200
        text: isDark ? "#fbbf24" : "#b45309", // dark:text-amber-300 : text-amber-700
      },
    },
    
    typeColors: {
      largeVan: {
        bg: isDark ? "#172554" : "#eff6ff", // dark:bg-blue-950 : bg-blue-50
        border: isDark ? "#1e40af" : "#bfdbfe", // dark:border-blue-700 : border-blue-200
      },
      smallVan: {
        bg: isDark ? "#0f172a" : "#f8fafc", // dark:bg-slate-950 : bg-slate-50
        border: isDark ? "#1e293b" : "#e2e8f0", // dark:border-slate-800 : border-slate-200
      },
    },
    
    map: {
      background: isDark ? "#09090b" : "#fafafa", // dark:fill-[#09090b] : fill-[#fafafa]
      streets: isDark ? "#3f3f46" : "#e4e4e7", // dark:stroke-[#3f3f46] : stroke-[#e4e4e7]
      path: {
        completed: isDark ? "#52525b" : "#d4d4d8", // dark:stroke-[#52525b] : stroke-[#d4d4d8]
        active: "#2563eb", // stroke="#2563eb"
      },
      points: {
        start: "#22c55e", // fill="#22c55e"
        delivery: "#0ea5e9", // fill="#0ea5e9"
        end: "#ef4444", // fill="#ef4444"
      },
    },
    
    text: {
      primary: isDark ? "#fafafa" : "#18181b", // dark:text-zinc-50 : text-zinc-900
      secondary: isDark ? "#d4d4d8" : "#3f3f46", // dark:text-zinc-200 : text-zinc-700
      tertiary: isDark ? "#a1a1aa" : "#71717a", // dark:text-zinc-300 : text-zinc-500
    },
  }), [isDark]);
  
  // Funzioni helper per ottenere gli stili in base allo stato
  const getStatusStyles = useMemo(() => (status: VehicleStatus) => {
    switch (status) {
      case "Available":
        return {
          bgColor: colors.statusColors.available.bg,
          borderColor: colors.statusColors.available.border,
          textColor: colors.statusColors.available.text,
        };
      case "In use":
        return {
          bgColor: colors.statusColors.inUse.bg,
          borderColor: colors.statusColors.inUse.border,
          textColor: colors.statusColors.inUse.text,
        };
      case "Maintenance":
        return {
          bgColor: colors.statusColors.maintenance.bg,
          borderColor: colors.statusColors.maintenance.border,
          textColor: colors.statusColors.maintenance.text,
        };
      default:
        return {
          bgColor: colors.statusColors.available.bg,
          borderColor: colors.statusColors.available.border,
          textColor: colors.statusColors.available.text,
        };
    }
  }, [colors]);
  
  // Funzioni helper per ottenere gli stili in base al tipo
  const getTypeStyles = useMemo(() => (type: VehicleType) => {
    return type === "Large Van"
      ? {
          bgColor: colors.typeColors.largeVan.bg,
          borderColor: colors.typeColors.largeVan.border,
        }
      : {
          bgColor: colors.typeColors.smallVan.bg,
          borderColor: colors.typeColors.smallVan.border,
        };
  }, [colors]);
  
  // Funzione per gestire lo stile di selezione (ora usa oggetti di stile anziché classi Tailwind)
  const getSelectionStyles = useMemo(() => (selected: boolean) => {
    return selected
      ? {
          backgroundColor: colors.cardSelectedBg,
          borderColor: colors.cardSelectedBorder,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }
      : {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        };
  }, [colors]);
  
  // Fornisce classi Tailwind statiche per la card, combinandole con lo stato di selezione
  const getCardClasses = useMemo(() => (selected: boolean) => {
    return `mb-2 cursor-pointer transition-colors border ${
      selected 
        ? (isDark 
           ? 'bg-blue-950 border-blue-700 shadow-sm' 
           : 'bg-blue-50 border-blue-400 shadow-sm')
        : (isDark 
           ? 'bg-zinc-900 border-zinc-800 hover:border-blue-700' 
           : 'bg-white border-zinc-200 hover:border-blue-300 hover:shadow-sm')
    }`;
  }, [isDark]);
  
  // Il valore del context viene memorizzato con useMemo per prevenire render non necessari
  const value = useMemo(() => ({
    colors,
    getStatusStyles,
    getTypeStyles,
    getSelectionStyles,
    getCardClasses,
    isDark
  }), [colors, getStatusStyles, getTypeStyles, getSelectionStyles, getCardClasses, isDark]);
  
  return (
    <VehicleThemeContext.Provider value={value}>
      {children}
    </VehicleThemeContext.Provider>
  );
};

// Hook per usare il tema dei veicoli
export const useVehicleTheme = () => {
  const context = useContext(VehicleThemeContext);
  
  if (context === undefined) {
    throw new Error("useVehicleTheme deve essere usato all'interno di un VehicleThemeProvider");
  }
  
  return context;
}; 