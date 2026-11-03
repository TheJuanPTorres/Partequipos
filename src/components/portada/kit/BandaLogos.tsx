"use client";

import Link from "next/link";
import { IconExternalLink } from "@tabler/icons-react";
import { useId, type CSSProperties } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import { AVISO_OTRA_PESTANA } from "@/lib/nueva/enlaceExterno";
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

export function BandaLogos({
  logos,
  etiqueta = "Marcas con las que trabajamos",
  espejo = false,
}: {
  logos: LogoDePortada[];
  /** El nombre de la lista para lectores de pantalla. */
  etiqueta?: string;
  /** La banda de «Marcas de repuestos»: los logos corren de izquierda a derecha. */
  espejo?: boolean;
}) {
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
          data-espejo={espejo ? "" : undefined}
          style={duracion as CSSProperties}
        >
          <div className={estilos.pista}>
            {Array.from({ length: COPIAS }, (_, copia) => (
              <ul
                key={copia}
                className={estilos.lista}
                aria-label={copia === 0 ? etiqueta : undefined}
                aria-hidden={copia > 0 ? true : undefined}
              >
                {logos.map((l) => {
                  const imagen = (alt: string) => (
                    <LogoMarca
                      logo={l.logo}
                      alt={alt}
                      sizes={SIZES_LOGO}
                      className={estilos.logo}
                    />
                  );
                  return (
                    <li key={l.id} className={estilos.item}>
                      {l.enlace ? (
                        /*
                         * Marca sin página propia (LiuGong, 2026-11-03): el logo lleva a su
                         * distribuidor, en otra pestaña. Las copias ocultas no entran en el
                         * orden del teclado (`tabIndex={-1}`).
                         */
                        <a
                          href={l.enlace}
                          className={`${estilos.caja} ${estilos.cajaEnlace}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${l.nombre} (${AVISO_OTRA_PESTANA})`}
                          tabIndex={copia === 0 ? undefined : -1}
                        >
                          {imagen("")}
                          <IconExternalLink
                            aria-hidden="true"
                            focusable="false"
                            stroke={1.75}
                            className={estilos.cajaEnlaceIcono}
                          />
                        </a>
                      ) : l.href && copia === 0 ? (
                        // Solo la primera copia es enlace: las demás son decorativas y no se enfocan.
                        <Link href={l.href} className={estilos.caja} prefetch={false}>
                          {imagen(l.logo.alt)}
                        </Link>
                      ) : (
                        <span className={estilos.caja}>
                          {imagen(copia === 0 ? l.logo.alt : "")}
                        </span>
                      )}
                      <span className={estilos.separador} aria-hidden="true" />
                    </li>
                  );
                })}
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
