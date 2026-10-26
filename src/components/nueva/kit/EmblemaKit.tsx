"use client";

import { useEffect, useRef, type ReactNode } from "react";

import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./kit.module.css";

/**
 * EMBLEMA DE FONDO del «Kit de marca» (2026-10-25): el grabado de la marca, enorme y casi
 * transparente, detrás de las secciones. Va en una capa del alto de esa zona con el emblema
 * `sticky`: acompaña el recorrido por los tipos sin salirse de ella, y gira despacio con el
 * scroll (de −8° a 8°, como una moneda). El grabado es una máscara rellena de tinta: una sola
 * imagen. Las tarjetas, blancas, quedan encima. Con «reducir movimiento», quieto.
 *
 * Solo se monta si la marca tiene emblema y la casilla «Mostrar el emblema de fondo» está
 * marcada: si no, las secciones quedan sobre el gris liso.
 */
export function EmblemaKit({
  emblema,
  children,
}: {
  emblema: ImagenLista | null;
  children: ReactNode;
}) {
  const capa = useRef<HTMLDivElement>(null);
  const grabado = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const zona = capa.current;
    const sello = grabado.current;
    if (!emblema || !zona || !sello || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let pendiente = 0;
    const girar = () => {
      pendiente = 0;
      const r = zona.getBoundingClientRect();
      // 0 cuando la zona asoma por abajo, 1 cuando sale por arriba.
      const avance = (innerHeight - r.top) / (innerHeight + r.height);
      const t = Math.min(1, Math.max(0, avance));
      sello.style.setProperty("--giro", `${(-8 + 16 * t).toFixed(2)}deg`);
    };
    const alMover = () => {
      if (!pendiente) pendiente = requestAnimationFrame(girar);
    };
    girar();
    addEventListener("scroll", alMover, { passive: true });
    addEventListener("resize", alMover);
    return () => {
      removeEventListener("scroll", alMover);
      removeEventListener("resize", alMover);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, [emblema]);

  if (!emblema) return <>{children}</>;
  const url = `url("${emblema.url}")`;
  return (
    <div ref={capa} className={estilos.emblemaCapa}>
      <div aria-hidden="true" className={estilos.emblemaFondo}>
        <div className={estilos.emblemaPegado}>
          <span
            ref={grabado}
            className={estilos.emblema}
            style={{
              aspectRatio: `${emblema.width} / ${emblema.height}`,
              maskImage: url,
              WebkitMaskImage: url,
            }}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
