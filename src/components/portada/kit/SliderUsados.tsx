"use client";

import { Children, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";

import estilos from "./usadosKit.module.css";

const INTERVALO = 5000;

/**
 * EL CARRUSEL DE UNA CATEGORÍA (diseño del cliente, 2026-10-26): tres tarjetas en escritorio, dos
 * en tablet y una en el móvil. El desplazamiento es NATIVO (scroll-snap: arrastre y gesto táctil
 * gratis); los puntos y el avance automático solo mueven `scrollLeft`. Cada punto es una posición
 * de arranque: con 5 tarjetas y 3 a la vista hay 3 puntos.
 *
 * Avanza solo cada 5 s, se para con el ratón o el foco dentro, y lleva el botón de pausa del sitio
 * (D2): parado de partida con «reducir movimiento». Escondido (otra categoría elegida), no avanza.
 */
export function SliderUsados({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
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

  // Cuántas tarjetas caben cambia con el ancho (y al dejar de estar escondido), y con ello los puntos.
  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    const medir = () => {
      const s = paso();
      if (!s) return;
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
    const t = window.setTimeout(() => {
      // Escondido (otra categoría elegida): no se mueve.
      if (pista.current?.offsetParent) ir((actual + 1) % posiciones);
    }, INTERVALO);
    return () => window.clearTimeout(t);
  }, [actual, pausado, encima, posiciones, ir]);

  return (
    <div
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
        onScroll={(e) => {
          const s = paso();
          if (s) setActual(Math.round(e.currentTarget.scrollLeft / s));
        }}
      >
        {children}
      </ul>
      {posiciones > 1 ? (
        <div className={estilos.controles}>
          {/* La pausa va delante de los puntos: al final de la fila, con muchos puntos, la tapaba el WhatsApp. */}
          <BotonPausa
            pausado={pausado}
            alPulsar={alternar}
            que={`el carrusel de ${etiqueta.toLowerCase()}`}
            controla={idPista}
            className={estilos.pausa}
          />
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
        </div>
      ) : null}
    </div>
  );
}
