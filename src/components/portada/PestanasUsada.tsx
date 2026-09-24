"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import estilos from "./maquinariaUsada.module.css";

/**
 * PESTAÑAS DE LA SECCIÓN 3 — patrón ARIA de pestañas, sin el JS de Elementor.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): cambiar de pestaña es
 * estado. Los PANELES llegan ya pintados desde el servidor (`paneles`) y están
 * TODOS en el HTML: los inactivos con `hidden`. Así los enlaces de cada tarjeta
 * existen para buscadores y sin JavaScript.
 *
 * Teclado (WAI-ARIA APG): flechas izquierda/derecha y arriba/abajo cambian de
 * pestaña con activación automática; Inicio y Fin van a la primera y a la
 * última; Tab entra al panel. Solo la pestaña activa está en el orden de
 * tabulación.
 */

type Props = {
  pestanas: { clave: string; etiqueta: string }[];
  paneles: ReactNode[];
  /** Id del `<h2>` que nombra la lista de pestañas. */
  etiquetadoPor: string;
};

export function PestanasUsada({ pestanas, paneles, etiquetadoPor }: Props) {
  const [activa, setActiva] = useState(0);
  // La aparición solo tras un cambio: al cargar, el panel ya está ahí.
  const [cambiada, setCambiada] = useState(false);
  const base = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  const ir = (i: number) => {
    const n = (i + pestanas.length) % pestanas.length;
    setActiva(n);
    setCambiada(true);
    botones.current[n]?.focus();
  };

  const alTeclado = (e: KeyboardEvent<HTMLButtonElement>) => {
    const acciones: Record<string, () => void> = {
      ArrowRight: () => ir(activa + 1),
      ArrowDown: () => ir(activa + 1),
      ArrowLeft: () => ir(activa - 1),
      ArrowUp: () => ir(activa - 1),
      Home: () => ir(0),
      End: () => ir(pestanas.length - 1),
    };
    const accion = acciones[e.key];
    if (accion) {
      e.preventDefault();
      accion();
    }
  };

  return (
    <div className={estilos.pestanas}>
      <div role="tablist" aria-labelledby={etiquetadoPor} className={estilos.lista}>
        {pestanas.map((p, i) => (
          <button
            key={p.clave}
            ref={(el) => {
              botones.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-pestana-${i}`}
            aria-selected={i === activa}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={i === activa ? 0 : -1}
            className={estilos.pestana}
            onClick={() => {
              if (i !== activa) {
                setActiva(i);
                setCambiada(true);
              }
            }}
            onKeyDown={alTeclado}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>
      {paneles.map((panel, i) => (
        <div
          key={pestanas[i]?.clave ?? i}
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-pestana-${i}`}
          tabIndex={0}
          hidden={i !== activa}
          className={`${estilos.panel} ${cambiada && i === activa ? estilos.panelEntrando : ""}`}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
