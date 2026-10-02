"use client";

import Image from "next/image";
import { useId } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { VistaFranjaMarquee as Datos } from "@/lib/bloques/vista";

import estilos from "./franjaMarquee.module.css";

/**
 * ux-9 pinta OCHO copias del texto y desplaza la pista la mitad en 80 s
 * (widget «List Marquee», `ue_speed` 80): así nunca queda hueco a la derecha.
 */
const COPIAS = 8;

/**
 * BLOQUE «FRANJA CON MARQUEE» — foto de fondo, un texto enorme en movimiento
 * y una máquina recortada delante (Nosotros de ux-9, contenedor `71d4927`).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el botón de pausa tiene
 * estado. El movimiento es CSS puro.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-nosotros.md §4):
 * - D2: botón de pausa, y quieto con movimiento reducido.
 * - En ux-9 cada copia es un enlace a «#»; aquí es texto. El lector lee el
 *   texto UNA vez: las copias van con `aria-hidden`.
 * - La foto de fondo es decorativa (`alt` vacío); la máquina también: repite
 *   lo que ya dice el texto y no enlaza a nada.
 */
export function BloqueFranjaMarquee({ texto, imagenFondo, imagenFrontal }: Datos) {
  const { pausado, alternar } = usePausa();
  const idPista = useId();

  return (
    <section className={estilos.seccion}>
      <div className={estilos.tarjeta}>
        {imagenFondo ? (
          <Image
            src={imagenFondo.url}
            alt=""
            fill
            sizes="97vw"
            className={estilos.fondo}
            style={{ objectPosition: imagenFondo.posicion }}
          />
        ) : null}
        <div className={estilos.velo} aria-hidden="true" />
        <div id={idPista} className={estilos.marquee} data-pausado={pausado ? "" : undefined}>
          <p className="sr-only">{texto}</p>
          <div className={estilos.pista} aria-hidden="true">
            {Array.from({ length: COPIAS }, (_, i) => (
              <span key={i} className={estilos.item}>
                <span className={estilos.punto} />
                <span className={estilos.texto}>{texto}</span>
              </span>
            ))}
          </div>
        </div>
        {imagenFrontal ? (
          <Image
            src={imagenFrontal.url}
            alt=""
            width={imagenFrontal.width}
            height={imagenFrontal.height}
            sizes="(max-width: 767px) 80vw, 704px"
            className={estilos.maquina}
          />
        ) : null}
        <BotonPausa
          pausado={pausado}
          alPulsar={alternar}
          que="el texto en movimiento"
          controla={idPista}
          className={estilos.pausa}
        />
      </div>
    </section>
  );
}
