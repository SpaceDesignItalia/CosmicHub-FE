import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

// Chiave per il localStorage
export const THEME_STORAGE_KEY = "cosmichub-theme-mode";

// Tipo del tema
type ThemeType = "light" | "dark";

// Interfaccia del context
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

// Creazione del context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Props per il provider
interface ThemeProviderProps {
  children: ReactNode;
}

// Provider del tema
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Stato iniziale del tema (preferisci il tema del sistema o il valore salvato)
  const [theme, setThemeState] = useState<ThemeType>(() => {
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

  // Funzione per cambiare il tema
  const setTheme = (newTheme: ThemeType) => {
    // Salva in localStorage
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    // Aggiorna lo stato
    setThemeState(newTheme);
  };

  // Effetto per applicare il tema al documento
  useEffect(() => {
    // Aggiorna il tema nel documento
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);

    // Aggiorna il tema in localStorage ogni volta che cambia
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
