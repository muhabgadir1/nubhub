import React, { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Hub from "./hub/Hub";
import Wordle from "./wordle/Wordle";
import Connections from "./connections/Connections";
import MathNub from "./math/MathNub";
import "./theme.css";
import "./index.css";

/**
 * Routing, all of it.
 *
 * Three screens and no nested state does not need a router library — it needs
 * the History API and a re-render. `public/_redirects` is what makes a cold
 * load of /wordle work on Netlify; without it the host looks for a file at
 * that path and 404s.
 */
const ROUTES = {
  "/wordle": Wordle,
  "/connections": Connections,
  "/math": MathNub,
};

function App() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, "") || "/");

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname.replace(/\/+$/, "") || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to) => {
    if (to !== window.location.pathname) window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  // The tab title should say which game you are in, not which site.
  useEffect(() => {
    document.title =
      path === "/wordle" ? "WordNUB — NUBHUB"
      : path === "/connections" ? "ConnectNUB — NUBHUB"
      : path === "/math" ? "MathNUB — NUBHUB"
      : "NUBHUB";
  }, [path]);

  const Screen = ROUTES[path];
  return Screen ? <Screen navigate={navigate} /> : <Hub navigate={navigate} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
