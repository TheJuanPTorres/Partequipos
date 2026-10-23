"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * D5 de la franja de marca (`MEJORAS_FRANJA`): la franja ENTRA al llegar a ella, con el
 * barrido del color de izquierda a derecha y el logo deslizándose (el CSS cuelga de
 * `[data-anim~="D5"] [data-entrada]`). Como `Revelado`: el estado «preparado» lo pone este
 * componente al montarse, así que sin JavaScript —o con «reducir movimiento»— la franja se ve
 * entera; y una franja ya a la vista al cargar no se toca (ocultarla sería un parpadeo).
 */
export function EntradaFranja({ children }: { children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = caja.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < innerHeight) return;
    el.dataset.entrada = "preparada";
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        el.dataset.entrada = "visible";
        observador.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observador.observe(el);
    return () => {
      observador.disconnect();
      // Si se desmonta antes de llegar, que nada se quede oculto.
      el.dataset.entrada = "visible";
    };
  }, []);

  return <div ref={caja}>{children}</div>;
}
