"use client";

import { useEffect, useRef } from "react";

import estilos from "./articuloPropio.module.css";

/**
 * Barra de progreso de lectura, discreta: 3 px arriba del todo que se llena
 * con lo leído del artículo (del inicio de `#articulo-cuerpo` a su final).
 * Decorativa (`aria-hidden`): no aporta nada a un lector de pantalla. Sin
 * JavaScript no se pinta. Se actualiza en `requestAnimationFrame` y escribe
 * una variable de CSS, sin re-renderizar React ni mover el diseño (CLS 0).
 */
export function ProgresoLectura({ idCuerpo }: { idCuerpo: string }) {
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cuerpo = document.getElementById(idCuerpo);
    const el = barra.current;
    if (!cuerpo || !el) return;
    let pendiente = 0;
    const calcular = () => {
      pendiente = 0;
      const caja = cuerpo.getBoundingClientRect();
      const alto = caja.height - window.innerHeight * 0.5;
      const leido = alto > 0 ? Math.min(1, Math.max(0, -caja.top / alto)) : 0;
      el.style.setProperty("--leido", leido.toFixed(4));
    };
    const alMover = () => {
      if (!pendiente) pendiente = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", alMover, { passive: true });
    window.addEventListener("resize", alMover);
    return () => {
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, [idCuerpo]);

  return <div ref={barra} className={estilos.progreso} aria-hidden="true" />;
}
