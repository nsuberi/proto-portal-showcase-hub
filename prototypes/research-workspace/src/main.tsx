import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { installProjectFetch } from "./lib/projectStore";

// Scope every vault API request to the active project (X-Project-Id header).
installProjectFetch();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
