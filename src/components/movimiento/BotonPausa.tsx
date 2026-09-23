"use client";

import estilos from "./movimiento.module.css";
import { etiquetaPausa } from "./pausa";

type Props = {
  pausado: boolean;
  alPulsar: () => void;
  /** Qué se pausa, para el nombre accesible: «el vídeo», «el carrusel de logos». */
  que: string;
  /** Id del elemento que controla, si lo tiene. */
  controla?: string;
  className?: string;
};

/**
 * Botón de pausa de todo lo que se mueve solo (desviación D2, WCAG 2.2.2).
 * El estado lo lleva `usePausa()`; este componente solo lo dibuja.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (§3.1): recibe un manejador de clic.
 */
export function BotonPausa({ pausado, alPulsar, que, controla, className }: Props) {
  return (
    <button
      type="button"
      className={`${estilos.pausa} ${className ?? ""}`}
      onClick={alPulsar}
      aria-label={etiquetaPausa(pausado, que)}
      aria-controls={controla}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {pausado ? (
          <path
            fill="currentColor"
            d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z"
          />
        ) : (
          <path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
        )}
      </svg>
    </button>
  );
}
