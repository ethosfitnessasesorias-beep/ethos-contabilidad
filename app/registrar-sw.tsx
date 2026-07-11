"use client";

import { useEffect } from "react";

// Registra el service worker (requisito para que el móvil ofrezca "instalar app")
export function RegistrarSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
