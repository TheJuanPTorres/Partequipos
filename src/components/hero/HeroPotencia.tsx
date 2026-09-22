"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";

import type { SlideHero } from "./datosPrototipo";
import estilos from "./hero.module.css";

/**
 * HERO «POTENCIA HITACHI» — PROTOTIPO para validar el diseño de Andrés.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1 pide justificarlo): las
 * flechas son botones con estado y el revelado necesita un observador. El
 * MARCADO SE SIGUE RENDERIZANDO EN EL SERVIDOR —un componente de cliente
 * también se prerenderiza—, así que **los textos de los tres slides están en el
 * HTML inicial** y se ven sin JavaScript. Comprobable con `curl`.
 *
 * NO HAY VALORES DE DISEÑO EN ESTE FICHERO: todos viven en `hero.module.css`.
 */

type Props = {
  slides: SlideHero[];
  fondo: { url: string; alt: string };
  frontal: { url: string; alt: string; width: number; height: number };
  /** Clase de la fuente (next/font) que define `--fuente-hero`. */
  claseFuente?: string;
};

/**
 * Parte en palabras conservando el texto tal cual para el HTML.
 *
 * EL ESPACIO VA FUERA DE LA MÁSCARA. Dentro se pierde: la máscara es
 * `inline-block` con `overflow: hidden`, así que un espacio al final del bloque
 * se colapsa y las palabras salen pegadas («POTENCIAHITACHI»). Se vio pintado,
 * no leyendo el código.
 */
function Palabras({ texto, desde = 0 }: { texto: string; desde?: number }) {
  const palabras = texto.split(" ");
  return (
    <>
      {palabras.map((palabra, i) => (
        <Fragment key={`${palabra}-${i}`}>
          <span className={estilos.mascara}>
            <span className={estilos.palabra} style={{ ["--indice" as string]: String(desde + i) }}>
              {palabra}
            </span>
          </span>
          {i < palabras.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

function IconoFlecha({ hacia }: { hacia: "anterior" | "siguiente" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d={hacia === "siguiente" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoMas() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="m12 0a12 12 0 1 0 12 12 12.013 12.013 0 0 0 -12-12zm0 22a10 10 0 1 1 10-10 10.011 10.011 0 0 1 -10 10zm5-10a1 1 0 0 1 -1 1h-3v3a1 1 0 0 1 -2 0v-3h-3a1 1 0 0 1 0-2h3v-3a1 1 0 0 1 2 0v3h3a1 1 0 0 1 1 1z"
      />
    </svg>
  );
}

export function HeroPotencia({ slides, fondo, frontal, claseFuente = "" }: Props) {
  const [activo, setActivo] = useState(0);
  const raiz = useRef<HTMLElement>(null);
  const idSlides = useId();
  const slide = slides[activo]!;

  const mover = useCallback(
    (paso: number) => setActivo((i) => (i + paso + slides.length) % slides.length),
    [slides.length],
  );

  /*
   * REVELADO. El estado inicial oculto se pone AQUÍ y no en el CSS, para que sin
   * JavaScript el texto quede visible (§7 del encargo). Si el usuario pide menos
   * movimiento, no se prepara nada: se marca visible directamente.
   */
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;

    const menosMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (menosMovimiento) {
      el.dataset.revelar = "visible";
      return;
    }

    el.dataset.revelar = "preparado";
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            el.dataset.revelar = "visible";
            observador.disconnect();
          }
        }
      },
      // Equivalente aproximado del «start: top 85%» de ScrollTrigger.
      { rootMargin: "0px 0px -15% 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  /*
   * PARALLAX. Un listener pasivo con rAF que escribe una variable CSS; el
   * navegador solo compone. En el diseño el título va a velocidad 1 y el vidrio
   * a 0,5, los dos hacia arriba.
   */
  useEffect(() => {
    const el = raiz.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pendiente = false;
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        const caja = el.getBoundingClientRect();
        // Avance de 0 a 1 mientras la tarjeta cruza la ventana.
        const avance = Math.min(Math.max(-caja.top / Math.max(caja.height, 1), 0), 1);
        el.style.setProperty("--hero-parallax-base", String(avance));
      });
    };

    alDesplazar();
    addEventListener("scroll", alDesplazar, { passive: true });
    return () => removeEventListener("scroll", alDesplazar);
  }, []);

  return (
    <section
      ref={raiz}
      className={`${estilos.hero} ${claseFuente}`}
      aria-roledescription="carrusel"
      aria-label="Marcas de maquinaria"
    >
      <div className={estilos.tarjeta}>
        {/* El marco recorta el fondo con el radio; el vidrio queda fuera de él. */}
        <div className={estilos.marco}>
          <Image
            src={fondo.url}
            alt={fondo.alt}
            fill
            sizes="100vw"
            priority
            className={estilos.fondo}
          />
        </div>

        {/*
         * TÍTULO COMO <h1> (§4). Se renderizan los tres títulos para que estén
         * en el HTML inicial; los inactivos van ocultos a la accesibilidad y no
         * se pintan, así que no hay dos h1 visibles ni texto duplicado leído.
         */}
        <div className={`${estilos.filaTitulo} ${estilos.capaParallax}`}>
          <h1 className={estilos.titulo} id={idSlides}>
            {slides.map((s, i) => (
              <span key={s.titulo} hidden={i !== activo}>
                <Palabras texto={s.titulo} />
              </span>
            ))}
          </h1>
        </div>

        <Image
          src={frontal.url}
          alt={frontal.alt}
          width={frontal.width}
          height={frontal.height}
          /*
           * `sizes` ajustado al ancho REAL pintado en cada corte, no a 100vw:
           * Lighthouse marcaba 23 kB de sobrecoste por pedir una imagen mayor
           * que la caja. Los tres valores salen de las variables del CSS.
           */
          sizes="(max-width: 767px) 100vw, (max-width: 1024px) 631px, 809px"
          className={estilos.imagen}
        />

        <div className={estilos.fila}>
          <div className={estilos.flechas}>
            <button
              type="button"
              className={estilos.flecha}
              onClick={() => mover(-1)}
              aria-label="Marca anterior"
              aria-controls={idSlides}
            >
              <IconoFlecha hacia="anterior" />
            </button>
            <button
              type="button"
              className={estilos.flecha}
              onClick={() => mover(1)}
              aria-label="Marca siguiente"
              aria-controls={idSlides}
            >
              <IconoFlecha hacia="siguiente" />
            </button>
          </div>

          {/*
           * VIDRIO. Cuelga por debajo de la tarjeta, así que su bloque de
           * posición es esta columna. `aria-live` anuncia el cambio de marca sin
           * mover el foco. Oculto en móvil por CSS, igual que en el diseño.
           */}
          <div className={estilos.ancla}>
            <aside className={`${estilos.vidrio} ${estilos.capaParallax}`} aria-live="polite">
              <p className={estilos.parrafo}>
                {slides.map((s, i) => (
                  <span key={s.parrafo} hidden={i !== activo}>
                    <Palabras texto={s.parrafo} desde={4} />
                  </span>
                ))}
              </p>
              <Link
                href={slide.enlace.href}
                className={estilos.mas}
                aria-label={slide.enlace.nombreAccesible}
              >
                <IconoMas />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
