import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ThemeProvider } from "@/contexts";
import { I18nProvider } from "@/i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <HelmetProvider>
          <I18nProvider>
            <AuthProvider>
              <TooltipProvider>
                <App />
              </TooltipProvider>
            </AuthProvider>
          </I18nProvider>
        </HelmetProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
