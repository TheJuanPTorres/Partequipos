"use client";

import Link from "next/link";
import { useId } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { EnlaceDeTipo } from "@/lib/nueva/paginaMarcaAndres";

import estilos from "./marcaNueva.module.css";

/** Copias de la lista: la pista recorre la mitad, así nunca queda hueco a la derecha. */
const COPIAS = 6;

/**
 * FRANJA EN MOVIMIENTO con los TIPOS de la marca (widget «List Marquee» de la
 * plantilla de Andrés 4023, con los tipos en lugar de sus textos de ejemplo).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el botón de pausa tiene estado;
 * el movimiento es CSS puro. Solo la PRIMERA copia lleva enlaces; las demás son
 * `aria-hidden` y sin foco. Con movimiento reducido no se mueve y el botón de pausa
 * (WCAG 2.2.2) sigue disponible.
 */
export function FranjaTipos({ tipos }: { tipos: EnlaceDeTipo[] }) {
  const { pausado, alternar } = usePausa();
  const idPista = useId();
  if (tipos.length === 0) return null;
  return (
    <div className={estilos.franja}>
      <div id={idPista} className={estilos.marquee} data-pausado={pausado ? "" : undefined}>
        <div className={estilos.pista}>
          {Array.from({ length: COPIAS }, (_, i) => (
            <ul
              key={i}
              className={estilos.copia}
              aria-hidden={i === 0 ? undefined : "true"}
              aria-label={i === 0 ? "Tipos de equipo de la marca" : undefined}
            >
              {tipos.map((t) => (
                <li key={t.clave} className={estilos.itemFranja}>
                  <span className={estilos.punto} aria-hidden="true" />
                  {i === 0 ? (
                    <Link href={t.href} className={estilos.enlaceFranja}>
                      {t.nombre}
                    </Link>
                  ) : (
                    <span className={estilos.enlaceFranja}>{t.nombre}</span>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <BotonPausa
        pausado={pausado}
        alPulsar={alternar}
        que="la franja de tipos de equipo"
        controla={idPista}
        className={estilos.pausa}
      />
    </div>
  );
}
