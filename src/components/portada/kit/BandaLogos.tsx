"use client";

import { useId, type CSSProperties } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { LogoDePortada } from "@/lib/portada/kitCliente";

import estilos from "./marcasKit.module.css";

/**
 * LA BANDA DE LOGOS EN BUCLE de la sección de marcas (diseño del cliente, 2026-10-26). El
 * movimiento es CSS: la pista lleva CUATRO copias de la lista y se desplaza la mitad, así el
 * empalme no se nota y nunca queda hueco aunque haya pocos logos. Se para con el ratón encima.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el botón de pausa del sitio (D2, WCAG 2.2.2),
 * que el prototipo no tenía; parado de partida con «reducir movimiento», y entonces la banda se
 * desplaza a mano. Solo la primera copia es accesible: las demás, `aria-hidden` y `alt` vacío.
 */

const COPIAS = 4;
/** El prototipo: 32 s por vuelta con 6 marcas (dos copias). */
const SEGUNDOS_POR_LOGO = 2.7;
const SIZES_LOGO = "(min-width: 1025px) 15vw, 180px";

export function BandaLogos({ logos }: { logos: LogoDePortada[] }) {
  const { pausado, alternar } = usePausa();
  const idPista = useId();
  const duracion = { "--banda-duracion": `${logos.length * 2 * SEGUNDOS_POR_LOGO}s` };
  return (
    <>
      <div className={estilos.banda}>
        <div
          id={idPista}
          className={estilos.carrusel}
          data-pausado={pausado ? "" : undefined}
          style={duracion as CSSProperties}
        >
          <div className={estilos.pista}>
            {Array.from({ length: COPIAS }, (_, copia) => (
              <ul
                key={copia}
                className={estilos.lista}
                aria-label={copia === 0 ? "Marcas con las que trabajamos" : undefined}
                aria-hidden={copia > 0 ? true : undefined}
              >
                {logos.map((l) => (
                  <li key={l.id} className={estilos.item}>
                    <span className={estilos.caja}>
                      <LogoMarca
                        logo={l.logo}
                        alt={copia === 0 ? l.logo.alt : ""}
                        sizes={SIZES_LOGO}
                        className={estilos.logo}
                      />
                    </span>
                    <span className={estilos.separador} aria-hidden="true" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <BotonPausa
        pausado={pausado}
        alPulsar={alternar}
        que="la banda de logos"
        controla={idPista}
        className={estilos.pausa}
      />
    </>
  );
}
