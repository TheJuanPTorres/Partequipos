"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { TarjetaMarca } from "@/lib/portada/secciones";

import estilos from "./maquinariaNueva.module.css";

/**
 * CARRUSEL DE MARCAS — sección 2 de ux-9, con `scroll-snap` y sin Swiper.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): las flechas desplazan la
 * pista y los puntos siguen la posición. Las tarjetas están enteras en el HTML
 * prerenderizado, con sus enlaces: sin JavaScript se desplaza con el gesto y
 * se tabula igual.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-home-ux9.md §11):
 * - D7: sin bucle. Si todas las tarjetas caben, no hay flechas ni puntos: no
 *   habría adónde ir. En ux-9 Swiper las duplica para dar la vuelta.
 * - D8: los puntos indican, no se pulsan (ver el CSS).
 * - D9: cada tarjeta ENLAZA a su marca. En ux-9 no lleva a ninguna parte.
 */

type Props = { tarjetas: TarjetaMarca[]; etiqueta: string };

function Chevron({ hacia }: { hacia: "anterior" | "siguiente" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d={hacia === "siguiente" ? "M9 4l8 8-8 8" : "M15 4l-8 8 8 8"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** `sizes` de la foto de fondo: el ancho de una diapositiva en cada corte. */
const SIZES_FONDO = "(max-width: 767px) 94vw, (max-width: 1024px) 47vw, 31vw";

export function CarruselMarcas({ tarjetas, etiqueta }: Props) {
  const pista = useRef<HTMLUListElement>(null);
  const [posicion, setPosicion] = useState({ indice: 0, pasos: 1 });

  const medir = useCallback(() => {
    const el = pista.current;
    const primera = el?.firstElementChild as HTMLElement | null;
    if (!el || !primera) return;
    // Paso = ancho de una diapositiva + el hueco entre diapositivas.
    const ancho =
      primera.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || "0");
    if (!ancho) return;
    const porVista = Math.max(
      1,
      Math.round((el.clientWidth + ancho - primera.getBoundingClientRect().width) / ancho),
    );
    const pasos = Math.max(1, tarjetas.length - porVista + 1);
    const indice = Math.min(pasos - 1, Math.round(el.scrollLeft / ancho));
    setPosicion((p) => (p.indice === indice && p.pasos === pasos ? p : { indice, pasos }));
  }, [tarjetas.length]);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [medir]);

  const mover = (sentido: -1 | 1) => {
    const el = pista.current;
    const primera = el?.firstElementChild as HTMLElement | null;
    if (!el || !primera) return;
    // El `scroll-behavior` del CSS decide si anima: con movimiento reducido, no.
    const paso =
      primera.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || "0");
    el.scrollBy({ left: sentido * paso });
  };

  const hayMas = posicion.pasos > 1;

  return (
    <div
      className={estilos.carrusel}
      role="region"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
    >
      <div className={estilos.marco}>
        <ul ref={pista} className={estilos.pista}>
          {tarjetas.map((t) => (
            <li key={t.id} className={estilos.diapositiva}>
              <Link href={t.href} className={estilos.tarjeta}>
                <Image
                  src={t.fondo.url}
                  alt=""
                  fill
                  sizes={SIZES_FONDO}
                  className={estilos.fondo}
                  style={{ objectPosition: t.fondo.posicion }}
                  loading="lazy"
                />
                <span className={estilos.fila}>
                  <span className={estilos.logoCol}>
                    {t.logo ? (
                      <Image
                        src={t.logo.url}
                        alt={t.logo.alt}
                        width={t.logo.width}
                        height={t.logo.height}
                        sizes="120px"
                        className={estilos.logo}
                      />
                    ) : (
                      // Sin logo, el nombre: la tarjeta no puede quedar sin nombre accesible.
                      <span className="sr-only">{t.nombre}</span>
                    )}
                  </span>
                  <span className={estilos.textoCol}>
                    {t.texto ? (
                      <span className={`${estilos.texto} texto-cuerpo block`}>{t.texto}</span>
                    ) : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {hayMas ? (
          <>
            <button
              type="button"
              className={`${estilos.flecha} ${estilos.anterior}`}
              onClick={() => mover(-1)}
              disabled={posicion.indice === 0}
              aria-label="Marcas anteriores"
            >
              <Chevron hacia="anterior" />
            </button>
            <button
              type="button"
              className={`${estilos.flecha} ${estilos.siguiente}`}
              onClick={() => mover(1)}
              disabled={posicion.indice >= posicion.pasos - 1}
              aria-label="Marcas siguientes"
            >
              <Chevron hacia="siguiente" />
            </button>
          </>
        ) : null}
      </div>
      {/* Siempre en el marcado: reserva el alto de los puntos, como ux-9, y así
          no hay salto al hidratar cuando aparecen. */}
      <div className={estilos.puntos} aria-hidden="true">
        {hayMas
          ? Array.from({ length: posicion.pasos }, (_, i) => (
              <span
                key={i}
                className={`${estilos.punto} ${i === posicion.indice ? estilos.puntoActivo : ""}`}
              />
            ))
          : null}
      </div>
    </div>
  );
}
