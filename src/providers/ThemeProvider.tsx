import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

// Chiave per il localStorage
export const THEME_STORAGE_KEY = "cosmichub-theme-mode";

// Tipo del tema
type ThemeType = "light" | "dark";

// Interfaccia del context
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

// Creazione del context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Funzione di utilità per applicare il tema al documento
const applyThemeToHTML = (theme: ThemeType) => {
  const root = document.documentElement;
  
  // Rimuovi tutte le classi e attributi relativi al tema
  root.classList.remove("dark", "light");
  
  // Aggiungi la classe corretta per Tailwind
  root.classList.add(theme);
  
  // Imposta anche l'attributo data-theme per altri componenti che potrebbero usarlo
  root.setAttribute("data-theme", theme);
  
  // Imposta anche lo stile del colore di sfondo direttamente
  if (theme === "dark") {
    document.body.style.backgroundColor = "#000000";
    document.body.style.color = "#ffffff";
  } else {
    document.body.style.backgroundColor = "#ffffff";
    document.body.style.color = "#000000";
  }
};

// Props per il provider
interface ThemeProviderProps {
  children: ReactNode;
}

// Provider del tema
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Stato iniziale del tema (preferisci il tema del sistema o il valore salvato)
  const [theme, setThemeState] = useState<ThemeType>(() => {
    // Se siamo lato server, ritorna un valore di default
    if (typeof window === "undefined") return "light";
    
    // Controlla se c'è un tema salvato in localStorage
    const savedTheme = localStorage.getItem(
      THEME_STORAGE_KEY
    ) as ThemeType | null;

    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      return savedTheme;
    }

    // Fallback al tema in base alle preferenze del sistema
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  });
  
  // Calcola se il tema corrente è scuro
  const isDark = theme === "dark";

  // Funzione per cambiare il tema
  const setTheme = useCallback((newTheme: ThemeType) => {
    // Aggiorna lo stato
    setThemeState(newTheme);
    
    // Salva in localStorage
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    // Applica il tema al documento
    applyThemeToHTML(newTheme);
    
    // Forza un aggiornamento del body per triggerare il cambiamento di stile
    document.body.dataset.theme = newTheme;
  }, []);
  
  // Funzione per invertire il tema
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Effetto per applicare il tema al documento all'avvio
  useEffect(() => {
    // Applica il tema salvato al caricamento iniziale
    applyThemeToHTML(theme);
    
    // Aggiungi un listener per la preferenza del sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    
    try {
      // Cerca di usare il nuovo metodo per browser più recenti
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (e) {
      // Fallback per browser più vecchi
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  // Effetto per aggiornare il tema quando cambia lo stato
  useEffect(() => {
    applyThemeToHTML(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook per usare il tema
export const useCustomTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useCustomTheme deve essere usato all'interno di un ThemeProvider"
    );
  }

  return context;
};
