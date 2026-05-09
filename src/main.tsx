import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initLocalization } from "./utils/localization";

//eruda.init();

const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
initLocalization();

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
