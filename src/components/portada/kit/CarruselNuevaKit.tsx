"use client";

import { Children, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";

import estilos from "./nuevaKit.module.css";

const INTERVALO = 5000;

/**
 * LAS TARJETAS DE MARCA de «Maquinaria pesada nueva» (diseño del cliente, 2026-10-27): carrusel
 * en el teléfono y la tablet, y rejilla de 2 × 2 desde 1024 px (fila de 4 desde 1536 px), donde no
 * hay nada que deslizar y no salen puntos ni pausa. Como el de usados (`SliderUsados`): el
 * desplazamiento es NATIVO (scroll-snap); los puntos y el avance automático solo mueven
 * `scrollLeft`. Avanza cada 5 s, se para con el ratón o el foco dentro y lleva el botón de pausa
 * del sitio (D2), parado de partida con «reducir movimiento».
 *
 * `entrada` marca la lista para la entrada escalonada de las tarjetas (N1, `ZonaAnimada`).
 */
export function CarruselNuevaKit({
  etiqueta,
  entrada,
  children,
}: {
  etiqueta: string;
  entrada: boolean;
  children: ReactNode;
}) {
  const pista = useRef<HTMLUListElement>(null);
  const idPista = useId();
  const total = Children.count(children);
  const [posiciones, setPosiciones] = useState(1);
  const [actual, setActual] = useState(0);
  const { pausado, alternar } = usePausa();
  const [encima, setEncima] = useState(false);

  const paso = useCallback(() => {
    const p = pista.current;
    const item = p?.firstElementChild as HTMLElement | null;
    if (!p || !item) return 0;
    return item.offsetWidth + parseFloat(getComputedStyle(p).columnGap || "0");
  }, []);

  // Cuántas tarjetas caben cambia con el ancho, y con ello los puntos. En rejilla, ninguno.
  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    const medir = () => {
      const s = paso();
      if (!s) return;
      if (p.scrollWidth <= p.clientWidth + 1) {
        setPosiciones(1);
        return;
      }
      const visibles = Math.max(1, Math.round((p.clientWidth + 1) / s));
      setPosiciones(Math.max(1, total - visibles + 1));
      setActual(Math.round(p.scrollLeft / s));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(p);
    return () => ro.disconnect();
  }, [total, paso]);

  const ir = useCallback(
    (i: number) => {
      const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      pista.current?.scrollTo({ left: i * paso(), behavior: suave ? "smooth" : "auto" });
    },
    [paso],
  );

  useEffect(() => {
    if (pausado || encima || posiciones <= 1) return;
    const t = window.setTimeout(() => ir((actual + 1) % posiciones), INTERVALO);
    return () => window.clearTimeout(t);
  }, [actual, pausado, encima, posiciones, ir]);

  return (
    <div
      className={estilos.carrusel}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onFocusCapture={() => setEncima(true)}
      onBlurCapture={() => setEncima(false)}
    >
      <ul
        id={idPista}
        ref={pista}
        aria-label={etiqueta}
        className={estilos.pista}
        data-entrada={entrada ? "" : undefined}
        onScroll={(e) => {
          const s = paso();
          if (s) setActual(Math.round(e.currentTarget.scrollLeft / s));
        }}
      >
        {children}
      </ul>
      {posiciones > 1 ? (
        <div className={estilos.controles}>
          {Array.from({ length: posiciones }, (_, i) => (
            <button
              key={i}
              type="button"
              className={estilos.punto}
              onClick={() => ir(i)}
              aria-label={`Ir a la posición ${i + 1} de ${posiciones}`}
              aria-current={i === actual ? "true" : undefined}
            >
              <span />
            </button>
          ))}
          <BotonPausa
            pausado={pausado}
            alPulsar={alternar}
            que={`el carrusel de ${etiqueta.toLowerCase()}`}
            controla={idPista}
            className={estilos.pausa}
          />
        </div>
      ) : null}
    </div>
  );
}
