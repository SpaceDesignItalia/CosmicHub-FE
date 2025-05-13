import React, { createContext, useContext, useMemo } from "react";
import { useCustomTheme } from "../../../providers/ThemeProvider";

// Interfaccia per i colori del tema dei prodotti
interface ProductThemeColors {
  // Colori di base per lo sfondo delle card
  cardBackground: string;
  cardBorder: string;
  cardHeaderBg: string;
  cardHeaderBorder: string;

  // Colori per gli stati dei prodotti
  statusColors: {
    disponibile: {
      bg: string;
      text: string;
    };
    bassaGiacenza: {
      bg: string;
      text: string;
    };
    esaurito: {
      bg: string;
      text: string;
    };
  };

  // Colori per le azioni
  actionButtons: {
    bg: string;
    hoverBg: string;
    text: string;
  };

  // Colori per la tabella
  table: {
    headerBg: string;
    headerText: string;
    rowBorder: string;
    rowHover: string;
    text: string;
    paginationBg: string;
  };

  // Colori per gli input
  input: {
    bg: string;
    border: string;
    text: string;
    placeholder: string;
  };

  // Colori per i dropdown
  dropdown: {
    bg: string;
    border: string;
    itemHover: string;
  };

  // Colori per il modale
  modal: {
    bg: string;
    border: string;
    text: string;
    headerBorder: string;
    footerBorder: string;
  };

  // Altre proprietà UI
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

// Interfaccia del context
interface ProductThemeContextType {
  colors: ProductThemeColors;
  isDark: boolean;
  getStatusColor: (
    status: "Disponibile" | "Esaurito" | "Bassa giacenza"
  ) => string;
  getCardClasses: () => {
    card: string;
    header: string;
    input: string;
    dropdown: {
      trigger: string;
      menu: string;
      item: string;
    };
    table: {
      wrapper: string;
      header: string;
      row: string;
      pagination: string;
    };
  };
}

// Creazione del context
const ProductThemeContext = createContext<ProductThemeContextType | undefined>(
  undefined
);

interface ProductThemeProviderProps {
  children: React.ReactNode;
}

export const ProductThemeProvider: React.FC<ProductThemeProviderProps> = ({
  children,
}) => {
  // Utilizziamo il tema dell'applicazione
  const { isDark } = useCustomTheme();

  // Definiamo i colori del tema in base al tema dell'applicazione
  const colors: ProductThemeColors = useMemo(
    () => ({
      cardBackground: isDark ? "#18181b" : "#ffffff", // dark:bg-zinc-900 : bg-white
      cardBorder: isDark ? "#27272a" : "#e4e4e7", // dark:border-zinc-800 : border-zinc-200
      cardHeaderBg: isDark ? "#27272a" : "#ffffff", // dark:bg-zinc-800 : bg-white
      cardHeaderBorder: isDark ? "#3f3f46" : "#e4e4e7", // dark:border-zinc-700 : border-zinc-200

      statusColors: {
        disponibile: {
          bg: isDark ? "#052e16" : "#f0fdf4", // dark:bg-green-950 : bg-green-50
          text: isDark ? "#4ade80" : "#15803d", // dark:text-green-300 : text-green-700
        },
        bassaGiacenza: {
          bg: isDark ? "#451a03" : "#fffbeb", // dark:bg-amber-950 : bg-amber-50
          text: isDark ? "#fbbf24" : "#b45309", // dark:text-amber-300 : text-amber-700
        },
        esaurito: {
          bg: isDark ? "#450a0a" : "#fef2f2", // dark:bg-red-950 : bg-red-50
          text: isDark ? "#f87171" : "#b91c1c", // dark:text-red-300 : text-red-700
        },
      },

      actionButtons: {
        bg: isDark ? "#27272a" : "#ffffff", // dark:bg-zinc-800 : bg-white
        hoverBg: isDark ? "#3f3f46" : "#f4f4f5", // dark:hover:bg-zinc-700 : hover:bg-zinc-100
        text: isDark ? "#f4f4f5" : "#18181b", // dark:text-zinc-100 : text-zinc-900
      },

      table: {
        headerBg: isDark ? "#27272a" : "#fafafa", // dark:bg-zinc-800 : bg-zinc-50
        headerText: isDark ? "#d4d4d8" : "#52525b", // dark:text-zinc-300 : text-zinc-600
        rowBorder: isDark ? "#3f3f46" : "#e4e4e7", // dark:border-zinc-700 : border-zinc-200
        rowHover: isDark ? "#27272a" : "#f4f4f5", // dark:hover:bg-zinc-800 : hover:bg-zinc-100
        text: isDark ? "#f4f4f5" : "#18181b", // dark:text-zinc-100 : text-zinc-900
        paginationBg: isDark ? "#27272a" : "#f4f4f5", // dark:bg-zinc-800 : bg-zinc-100
      },

      input: {
        bg: isDark ? "#27272a" : "#ffffff", // dark:bg-zinc-800 : bg-white
        border: isDark ? "#3f3f46" : "#e4e4e7", // dark:border-zinc-700 : border-zinc-200
        text: isDark ? "#f4f4f5" : "#18181b", // dark:text-zinc-100 : text-zinc-900
        placeholder: isDark ? "#71717a" : "#a1a1aa", // dark:text-zinc-500 : text-zinc-400
      },

      dropdown: {
        bg: isDark ? "#27272a" : "#ffffff", // dark:bg-zinc-800 : bg-white
        border: isDark ? "#3f3f46" : "#e4e4e7", // dark:border-zinc-700 : border-zinc-200
        itemHover: isDark ? "#3f3f46" : "#f4f4f5", // dark:hover:bg-zinc-700 : hover:bg-zinc-100
      },

      modal: {
        bg: isDark ? "#18181b" : "#ffffff", // dark:bg-zinc-900 : bg-white
        border: isDark ? "#3f3f46" : "#e4e4e7", // dark:border-zinc-700 : border-zinc-200
        text: isDark ? "#f4f4f5" : "#18181b", // dark:text-zinc-100 : text-zinc-900
        headerBorder: isDark ? "#3f3f46" : "#e4e4e7", // dark:border-zinc-700 : border-zinc-200
        footerBorder: isDark ? "#3f3f46" : "#e4e4e7", // dark:border-zinc-700 : border-zinc-200
      },

      text: {
        primary: isDark ? "#fafafa" : "#18181b", // dark:text-zinc-50 : text-zinc-900
        secondary: isDark ? "#d4d4d8" : "#3f3f46", // dark:text-zinc-200 : text-zinc-700
        tertiary: isDark ? "#a1a1aa" : "#71717a", // dark:text-zinc-300 : text-zinc-500
      },
    }),
    [isDark]
  );

  // Funzione per ottenere il colore dello stato del prodotto
  const getStatusColor = useMemo(
    () => (status: "Disponibile" | "Esaurito" | "Bassa giacenza") => {
      switch (status) {
        case "Disponibile":
          return colors.statusColors.disponibile.text;
        case "Bassa giacenza":
          return colors.statusColors.bassaGiacenza.text;
        case "Esaurito":
          return colors.statusColors.esaurito.text;
        default:
          return colors.statusColors.disponibile.text;
      }
    },
    [colors]
  );

  // Funzione per ottenere le classi Tailwind da usare per i componenti
  const getCardClasses = useMemo(
    () => () => {
      return {
        card: `w-full mt-6 shadow-sm rounded-xl overflow-hidden ${
          isDark
            ? "border border-zinc-700 bg-zinc-900"
            : "border-2 border-zinc-200 bg-white"
        }`,
        header: `${
          isDark ? "border-zinc-700 bg-zinc-800" : "border-b bg-white"
        }`,
        input: isDark ? "bg-zinc-800 border-zinc-700 text-white" : "",
        dropdown: {
          trigger: `${
            isDark ? "bg-zinc-800 text-white border-zinc-700" : "bg-white"
          } px-4`,
          menu: isDark ? "bg-zinc-800 border-zinc-700" : "",
          item: isDark ? "text-white data-[hover=true]:bg-zinc-700" : "",
        },
        table: {
          wrapper: "shadow-none",
          header: isDark
            ? "bg-zinc-800 border-none text-zinc-300"
            : "border-none text-zinc-700",
          row: isDark
            ? "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-zinc-700 hover:bg-zinc-800 text-white"
            : "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-zinc-200 hover:bg-zinc-50",
          pagination: `flex w-full justify-center py-5 ${
            isDark ? "bg-zinc-800" : "bg-zinc-100"
          }`,
        },
      };
    },
    [isDark, colors]
  );

  // Il valore del context viene memorizzato con useMemo per prevenire render non necessari
  const value = useMemo(
    () => ({
      colors,
      isDark,
      getStatusColor,
      getCardClasses,
    }),
    [colors, isDark, getStatusColor, getCardClasses]
  );

  return (
    <ProductThemeContext.Provider value={value}>
      {children}
    </ProductThemeContext.Provider>
  );
};

// Hook per usare il tema dei prodotti
export const useProductTheme = (): ProductThemeContextType => {
  const context = useContext(ProductThemeContext);

  if (context === undefined) {
    throw new Error(
      "useProductTheme deve essere usato all'interno di un ProductThemeProvider"
    );
  }

  return context;
};
