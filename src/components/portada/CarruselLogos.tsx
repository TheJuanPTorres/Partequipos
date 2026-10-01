"use client";

import Image from "next/image";
import { useId, type CSSProperties } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { LogoMarca } from "@/lib/portada/seccionesE";

import estilos from "./logos.module.css";

/**
 * SECCIÓN 4 DE LA PORTADA — carrusel de logos de marcas (ux-9, widget
 * «Logo Marquee» de Unlimited Elements).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el botón de pausa tiene
 * estado. El movimiento es CSS puro; aquí solo se decide si está parado.
 *
 * Replica de ux-9, medido pintado (docs/diseno/decisiones-home-ux9.md §18):
 * 5 / 3 / 2 logos por vista, caja de 180 px, 4,5 s por logo, pausa al pasar
 * el ratón. La pista lleva CUATRO copias de la lista, como ux-9, y se desplaza
 * la mitad: así nunca queda hueco a la derecha aunque haya pocos logos.
 *
 * Lo que se aparta (D2, aprobado): botón de pausa visible y quieto con
 * `prefers-reduced-motion`. Solo la primera copia es accesible; las demás van
 * con `aria-hidden` y `alt` vacío, para no leer cada logo cuatro veces.
 */

const COPIAS = 4;
/** ux-9: `transition_speed` 9000 ms por logo y vuelta de dos copias → 4,5 s por logo. */
const SEGUNDOS_POR_LOGO = 4.5;
/** Ancho pintado de cada logo: 218 / 267 / 125 px en los tres cortes de ux-9. */
const SIZES_LOGO = "(max-width: 767px) 125px, (max-width: 1024px) 267px, 218px";

export function CarruselLogos({ logos }: { logos: LogoMarca[] }) {
  const { pausado, alternar } = usePausa();
  const idPista = useId();
  if (logos.length === 0) return null;

  // Media pista = dos copias: es lo que recorre una vuelta.
  const duracion = { "--logos-duracion": `${logos.length * 2 * SEGUNDOS_POR_LOGO}s` };

  return (
    <section className={estilos.seccion} aria-label="Marcas con las que trabajamos">
      <div
        id={idPista}
        className={estilos.ventana}
        data-pausado={pausado ? "" : undefined}
        style={duracion as CSSProperties}
      >
        <div className={estilos.pista}>
          {Array.from({ length: COPIAS }, (_, copia) => (
            <ul key={copia} className={estilos.lista} aria-hidden={copia > 0 ? true : undefined}>
              {logos.map((l) => (
                <li key={l.id} className={estilos.caja}>
                  <Image
                    src={l.logo.url}
                    alt={copia === 0 ? l.logo.alt : ""}
                    width={l.logo.width}
                    height={l.logo.height}
                    sizes={SIZES_LOGO}
                    className={estilos.logo}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <BotonPausa
        pausado={pausado}
        alPulsar={alternar}
        que="el carrusel de logos"
        controla={idPista}
        className={estilos.pausa}
      />
    </section>
  );
}
