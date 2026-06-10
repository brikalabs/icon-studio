import { Toaster } from "@brika/clay/components/toast";
import { TooltipProvider } from "@brika/clay/components/tooltip";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Editor-first tool: dark chrome by default, like the rest of the trade.
document.documentElement.classList.add("dark");
document.documentElement.style.colorScheme = "dark";

const root = document.getElementById("root");
if (!root) {
  throw new Error("missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <TooltipProvider>
      <App />
      <Toaster position="bottom-center" />
    </TooltipProvider>
  </StrictMode>,
);
