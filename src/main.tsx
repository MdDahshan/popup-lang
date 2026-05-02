import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { DialogProvider } from "./components/app/DialogContext";
import { ContextMenuProvider } from "./components/app/ContextMenuContext";

// Disable the default browser context menu globally
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ContextMenuProvider>
      <DialogProvider>
        <App />
      </DialogProvider>
    </ContextMenuProvider>
  </React.StrictMode>
);
