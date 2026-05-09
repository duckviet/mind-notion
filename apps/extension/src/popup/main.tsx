"use client";

import { App } from "./App";
import "./index.css"; // Ensure styles are imported if needed, otherwise it's handled by vite

export function PopupApp() {
  return <App />;
}

// Ensure it mounts to DOM (since we are creating an entry point here)
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
if (container && !container.innerHTML) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}