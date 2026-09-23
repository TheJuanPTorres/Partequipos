"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { SlideHero } from "./datosPrototipo";
import estilos from "./hero.module.css";

/**
 * HERO «POTENCIA HITACHI» — PROTOTIPO para validar el diseño de Andrés.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1 pide justificarlo): las
 * flechas son botones con estado y el revelado necesita un observador. El
 * MARCADO SE SIGUE RENDERIZANDO EN EL SERVIDOR —un componente de cliente
 * también se prerenderiza—, así que **los textos de todas las diapositivas
 * están en el HTML inicial** y se ven sin JavaScript. Comprobable con `curl`.
 *
 * NO HAY VALORES DE DISEÑO EN ESTE FICHERO: todos viven en `hero.module.css`.
 *
 * CARGA DE IMÁGENES. Solo la primera diapositiva se precarga. Las demás
 * van dentro de contenedores con `hidden` —o sea `display: none`— y con carga
 * diferida, así que el navegador **no las pide hasta que se muestran**: el
 * carrusel no compite con el LCP de la primera.
 */

type Props = {
  slides: SlideHero[];
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

export function HeroPotencia({ slides, claseFuente = "" }: Props) {
  const [activo, setActivo] = useState(0);
  /*
   * El anuncio solo se escribe DESPUÉS de una acción del usuario. Si la región
   * viva tuviera texto desde el principio, el lector lo leería al cargar la
   * página, que es ruido: el título ya está en el encabezado.
   */
  const [anuncio, setAnuncio] = useState("");
  const raiz = useRef<HTMLElement>(null);
  const idTitulo = useId();
  const total = slides.length;
  const hayVarias = total > 1;
  const slide = slides[activo]!;

  const mover = useCallback(
    (paso: number) => {
      const siguiente = (activo + paso + total) % total;
      setActivo(siguiente);
      setAnuncio(`Diapositiva ${siguiente + 1} de ${total}: ${slides[siguiente]!.titulo}`);
    },
    [activo, slides, total],
  );

  /* Flechas del teclado con el foco en cualquier control del carrusel. */
  const alPulsar = (e: KeyboardEvent<HTMLElement>) => {
    if (!hayVarias) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      mover(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      mover(1);
    }
  };

  /*
   * REVELADO. El estado inicial oculto se pone AQUÍ y no en el CSS, para que sin
   * JavaScript el texto quede visible. Si el usuario pide menos movimiento, no
   * se prepara nada: se marca visible directamente.
   */
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
   * PARALLAX. Un listener pasivo con rAF que escribe el avance en una variable
   * CSS; la distancia de cada capa la decide el CSS.
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
      onKeyDown={alPulsar}
    >
      <div className={estilos.tarjeta}>
        {/* El marco recorta los fondos con el radio; el vidrio queda fuera. */}
        <div className={estilos.marco}>
          {slides.map((s, i) => (
            <div key={s.fondo.url} className={estilos.capaFondo} hidden={i !== activo}>
              <Image
                src={s.fondo.url}
                alt={s.fondo.alt}
                fill
                sizes="100vw"
                /*
                 * SOLO la primera: es el LCP. Las demás, diferidas. `preload` y
                 * no `priority`, que Next 16 marca obsoleto (get-img-props.d.ts
                 * de 16.3.5); `fetchPriority` además, para que el navegador la
                 * ponga por delante del resto aunque la precarga llegue tarde.
                 */
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : undefined}
                loading={i === 0 ? "eager" : "lazy"}
                className={estilos.fondo}
              />
            </div>
          ))}
        </div>

        {/*
         * TÍTULO COMO <h2>: el <h1> de la portada es el logo de la cabecera
         * (desviación D1, docs/diseno/decisiones-home-ux9.md). Se renderizan todos los títulos para que estén en el
         * HTML inicial; los inactivos van con `hidden`, así que no se pintan ni
         * se leen: nunca hay dos títulos visibles.
         */}
        <div className={`${estilos.filaTitulo} ${estilos.capaParallax}`}>
          <h2
            className={estilos.titulo}
            id={idTitulo}
            // Letras del título activo: el CSS encoge solo el que no cabe.
            style={{ ["--hero-titulo-letras" as string]: String(slide.titulo.length) }}
          >
            {slides.map((s, i) => (
              <span key={s.titulo} hidden={i !== activo}>
                <Palabras texto={s.titulo} />
              </span>
            ))}
          </h2>
        </div>

        {/*
         * HUECO DE LA MÁQUINA. Mide siempre lo mismo —ancho del diseño y la
         * proporción 1476×1057—, tenga o no la diapositiva una imagen recortada.
         * Así el título y las flechas no saltan al cambiar de diapositiva.
         */}
        <div className={estilos.hueco}>
          {slides.map((s, i) =>
            s.frontal ? (
              <div key={s.frontal.url} className={estilos.capaFrontal} hidden={i !== activo}>
                <Image
                  src={s.frontal.url}
                  alt={s.frontal.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 631px, 809px"
                  className={estilos.frontal}
                />
              </div>
            ) : null,
          )}
        </div>

        {/*
         * Con una sola diapositiva no hay flechas: un botón que no mueve nada es
         * un control inerte. La fila se queda, así la tarjeta no cambia de alto.
         */}
        <div className={estilos.fila}>
          {hayVarias ? (
            <div className={estilos.flechas}>
              <button
                type="button"
                className={estilos.flecha}
                onClick={() => mover(-1)}
                aria-label="Diapositiva anterior"
                aria-controls={idTitulo}
              >
                <IconoFlecha hacia="anterior" />
              </button>
              <button
                type="button"
                className={estilos.flecha}
                onClick={() => mover(1)}
                aria-label="Diapositiva siguiente"
                aria-controls={idTitulo}
              >
                <IconoFlecha hacia="siguiente" />
              </button>
            </div>
          ) : null}
        </div>

        {/*
         * VIDRIO, posicionado respecto a la TARJETA con los valores medidos en
         * su página al mismo ancho de ventana. Oculto en móvil por CSS.
         */}
        <aside className={`${estilos.vidrio} ${estilos.capaParallax}`}>
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

      {/*
       * ANUNCIO DISCRETO del cambio de diapositiva. Va FUERA del vidrio a
       * propósito: el vidrio está en `display: none` en móvil, y una región viva
       * oculta no anuncia nada. Visualmente oculta, pero legible.
       */}
      <p className={estilos.soloLector} aria-live="polite" aria-atomic="true">
        {anuncio}
      </p>
    </section>
  );
}
