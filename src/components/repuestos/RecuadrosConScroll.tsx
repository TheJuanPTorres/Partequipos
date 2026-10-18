"use client";

import { useEffect, useRef } from "react";

import { desplazamientoRecuadro } from "@/lib/repuestos/desplazamiento";

/**
 * DESPLAZAMIENTO DEL RECUADRO CON EL SCROLL de las tarjetas de la «Plantilla 1»
 * (2026-10-18, dirección), el efecto del export (`motion_fx_translateY`,
 * velocidad 0,5, sobre el recuadro de cada tarjeta): el recuadro baja 25 px
 * cuando su tarjeta entra por abajo, está en su sitio con la tarjeta en el
 * centro de la ventana y sube 25 px cuando sale por arriba.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): depende del scroll. No
 * pinta nada: mueve los recuadros de su sección (`[data-recuadro-scroll]`) con
 * `transform`, que no cuenta como CLS, y solo los que están a la vista. Con
 * «reducir movimiento» no hace nada (y el CSS lo anula además).
 */
export function RecuadrosConScroll() {
  const ancla = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const seccion = ancla.current?.closest("section");
    if (!seccion) return;
    const movimiento = matchMedia("(prefers-reduced-motion: reduce)");
    if (movimiento.matches) return;

    const recuadros = [...seccion.querySelectorAll<HTMLElement>("[data-recuadro-scroll]")];
    const visibles = new Set<HTMLElement>();
    let frame = 0;

    const colocar = () => {
      frame = 0;
      const alto = innerHeight;
      for (const r of visibles) {
        // La posición de su TARJETA (el recuadro se mueve; la tarjeta no).
        const caja = (r.parentElement ?? r).getBoundingClientRect();
        r.style.setProperty(
          "--recuadro-desplazamiento",
          `${desplazamientoRecuadro(caja.top, caja.height, alto)}px`,
        );
      }
    };
    const pedir = () => {
      if (!frame) frame = requestAnimationFrame(colocar);
    };

    const observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        const r = e.target.querySelector<HTMLElement>("[data-recuadro-scroll]");
        if (!r) continue;
        if (e.isIntersecting) visibles.add(r);
        else visibles.delete(r);
      }
      pedir();
    });
    for (const r of recuadros) if (r.parentElement) observador.observe(r.parentElement);

    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    return () => {
      observador.disconnect();
      removeEventListener("scroll", pedir);
      removeEventListener("resize", pedir);
      if (frame) cancelAnimationFrame(frame);
      for (const r of recuadros) r.style.removeProperty("--recuadro-desplazamiento");
    };
  }, []);

  return <span ref={ancla} hidden />;
}
