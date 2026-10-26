"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { VistaFranjaMarquee as Datos } from "@/lib/bloques/vista";

import estilos from "./franjaMarquee.module.css";

/**
 * ux-9 pinta OCHO copias del texto y desplaza la pista la mitad en 80 s
 * (widget «List Marquee», `ue_speed` 80): así nunca queda hueco a la derecha.
 */
const COPIAS = 8;

/** El «slideshow» de Elementor por defecto: 5 s por foto y 0,5 s de fundido. */
const POR_FOTO_MS = 5000;

/**
 * BLOQUE «FRANJA CON MARQUEE» — un texto enorme en movimiento sobre una foto de fondo
 * (Nosotros de ux-9). Desde la plantilla 4089 de Andrés (2026-10-26): el fondo es un PASE DE
 * FOTOS con Ken Burns hacia fuera (cada foto empieza ampliada y se aleja mientras se ve), la
 * tarjeta mide 64vh (85vh en móvil), el texto va en el centro, algo por encima, y ya no hay
 * máquina recortada (si el panel tiene una, se sigue pintando).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el botón de pausa y el pase de fotos
 * tienen estado. El movimiento es CSS.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-nosotros.md §4):
 * - D2: un botón de pausa para TODO lo que se mueve (texto y fotos); con movimiento reducido,
 *   quieto: sin zoom y en la primera foto.
 * - El `fa-circle` de ux-9 pasa a «|» DESPUÉS de cada texto, con el mismo margen a los dos
 *   lados (también en la unión de las copias y del bucle).
 * - En ux-9 cada copia es un enlace a «#»; aquí es texto. El lector lee el
 *   texto UNA vez: las copias van con `aria-hidden`.
 * - Las fotos son decorativas (`alt` vacío).
 */
export function BloqueFranjaMarquee({ texto, fondos, imagenFrontal }: Datos) {
  const { pausado, alternar } = usePausa();
  const idPista = useId();
  const [actual, setActual] = useState(0);

  // Con más de una foto, la siguiente cada 5 s (parado mientras está en pausa).
  useEffect(() => {
    if (pausado || fondos.length < 2) return;
    const reloj = window.setInterval(() => setActual((i) => (i + 1) % fondos.length), POR_FOTO_MS);
    return () => window.clearInterval(reloj);
  }, [pausado, fondos.length]);

  return (
    <section className={estilos.seccion}>
      <div className={estilos.tarjeta} data-pausado={pausado ? "" : undefined}>
        {fondos.map((f, i) => (
          <div
            key={f.url}
            className={estilos.diapositiva}
            data-actual={i === actual ? "" : undefined}
            aria-hidden="true"
          >
            <Image
              src={f.url}
              alt=""
              fill
              sizes="97vw"
              loading={i === 0 ? undefined : "lazy"}
              className={estilos.fondo}
              style={{ objectPosition: f.posicion }}
            />
          </div>
        ))}
        <div className={estilos.velo} aria-hidden="true" />
        <div className={estilos.centro}>
          <div id={idPista} className={estilos.marquee}>
            <p className="sr-only">{texto}</p>
            <div className={estilos.pista} aria-hidden="true">
              {Array.from({ length: COPIAS }, (_, i) => (
                <span key={i} className={estilos.item}>
                  <span className={estilos.texto}>{texto}</span>
                  <span className={estilos.separador}>|</span>
                </span>
              ))}
            </div>
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
          que={fondos.length > 1 ? "el texto y las fotos en movimiento" : "el texto en movimiento"}
          controla={idPista}
          className={estilos.pausa}
        />
      </div>
    </section>
  );
}
