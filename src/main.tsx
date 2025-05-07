import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { ThemeProvider } from "./providers/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <main className="text-foreground bg-background">
          <App />
        </main>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
