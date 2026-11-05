"use client";

import Link from "next/link";
import { useId, type CSSProperties } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { LogoDePortada } from "@/lib/portada/kitCliente";
import { rellenoDeBanda } from "@/lib/portada/marcasBanda";
import { sizesDeLogo } from "@/lib/portada/sizesLogo";

import estilos from "./marcasKit.module.css";

/**
 * LA BANDA DE LOGOS EN BUCLE de la sección de marcas (diseño del cliente, 2026-10-26). El
 * movimiento es CSS: la pista lleva CUATRO copias de la lista y se desplaza la mitad, así el
 * empalme no se nota y nunca queda hueco aunque haya pocos logos. Se para con el ratón encima.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el botón de pausa del sitio (D2, WCAG 2.2.2),
 * que el prototipo no tenía; parado de partida con «reducir movimiento», y entonces la banda se
 * desplaza a mano. Solo la primera copia es accesible: las demás, `aria-hidden` y `alt` vacío. Con
 * pocos logos, cada copia los repite (`MINIMO_POR_COPIA`) y las repeticiones tampoco se leen.
 */

const COPIAS = 4;
/** El prototipo: 32 s por vuelta con 6 marcas (dos copias). */
const SEGUNDOS_POR_LOGO = 2.7;
/**
 * Logos mínimos por copia (2026-11-05, #429): la pista se desplaza la mitad, así que DOS copias
 * tienen que cubrir el ancho de la banda o el bucle deja un hueco. Con «Marcas de la banda» se
 * pueden elegir solo una o dos marcas (~210 px cada una frente a una banda de ~1200 px a 1440), y
 * entonces cada copia repite sus logos hasta tener al menos estos.
 */
const MINIMO_POR_COPIA = 8;

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
  const relleno = rellenoDeBanda(logos, MINIMO_POR_COPIA);
  // La duración cuenta los logos pintados: la velocidad no cambia al repetirlos.
  const duracion = { "--banda-duracion": `${relleno.length * 2 * SEGUNDOS_POR_LOGO}s` };
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
                {relleno.map((l, k) => {
                  // Solo la primera vez de cada logo en la primera copia es accesible.
                  const accesible = copia === 0 && k < logos.length;
                  return (
                    <li
                      key={`${l.id}-${k}`}
                      className={estilos.item}
                      aria-hidden={copia === 0 && !accesible ? true : undefined}
                    >
                      {l.href && accesible ? (
                        // Solo la primera copia es enlace: las demás son decorativas y no se enfocan.
                        <Link href={l.href} className={estilos.caja} prefetch={false}>
                          <LogoMarca
                            logo={l.logo}
                            alt={l.logo.alt}
                            sizes={sizesDeLogo(l.logo, espejo)}
                            className={estilos.logo}
                          />
                        </Link>
                      ) : (
                        <span className={estilos.caja}>
                          <LogoMarca
                            logo={l.logo}
                            alt={accesible ? l.logo.alt : ""}
                            sizes={sizesDeLogo(l.logo, espejo)}
                            className={estilos.logo}
                          />
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
