"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { Revelado } from "@/components/movimiento/Revelado";
import { useMovimientoReducido } from "@/components/movimiento/useMovimiento";
import { sizesFondoHero, type DiapositivaHero } from "@/lib/portada/hero";

import estilos from "./hero.module.css";

/**
 * HERO DE LA PORTADA — sección 1 de la home de ux-9 (ADR 0009).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): las flechas son botones con
 * estado y el parallax escucha el scroll. El marcado se prerenderiza igual: el
 * título y el párrafo de la primera diapositiva están en el HTML inicial.
 *
 * NO HAY VALORES DE DISEÑO EN ESTE FICHERO: viven en `hero.module.css`.
 *
 * Lo que se aparta de ux-9, todo documentado en docs/diseno/decisiones-home-ux9.md:
 * - D1: el título va en `<h2>`; el `<h1>` de la portada es el logo.
 * - D3: el vidrio no sale de la tarjeta por debajo de 1024 px.
 * - D4: las flechas son botones que funcionan; con una diapositiva no se pintan.
 *
 * REVELADO SIN PARPADEO: título y párrafo usan `Revelado` con `alCargar`, que
 * anima por CSS desde el primer pintado. Con el observador, lo visible al cargar
 * se pintaba, se ocultaba al hidratar y volvía a aparecer.
 *
 * CARGA DE IMÁGENES: solo el fondo de la primera diapositiva se precarga (es el
 * LCP). Las demás van en capas con `hidden` y carga diferida: el navegador no
 * las pide hasta que se muestran.
 */

type Props = { diapositivas: DiapositivaHero[] };

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

export function HeroPortada({ diapositivas }: Props) {
  const [activo, setActivo] = useState(0);
  /*
   * El anuncio solo se escribe DESPUÉS de una acción del usuario: con texto
   * desde el principio, el lector lo leería al cargar, y el título ya está.
   */
  const [anuncio, setAnuncio] = useState("");
  const raiz = useRef<HTMLElement>(null);
  const idTitulo = useId();
  const reducido = useMovimientoReducido();
  const total = diapositivas.length;
  const hayVarias = total > 1;
  const d = diapositivas[activo];

  const mover = useCallback(
    (paso: number) => {
      const siguiente = (activo + paso + total) % total;
      setActivo(siguiente);
      setAnuncio(`Diapositiva ${siguiente + 1} de ${total}: ${diapositivas[siguiente]!.titulo}`);
    },
    [activo, diapositivas, total],
  );

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
   * PARALLAX. Un listener pasivo con rAF que escribe el avance en una variable
   * CSS; la distancia de cada capa la decide el CSS. Nada con movimiento reducido.
   */
  useEffect(() => {
    const el = raiz.current;
    if (!el || reducido) return;

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
    return () => {
      removeEventListener("scroll", alDesplazar);
      el.style.removeProperty("--hero-parallax-base");
    };
  }, [reducido]);

  if (!d) return null;

  return (
    <section
      ref={raiz}
      className={estilos.hero}
      aria-roledescription={hayVarias ? "carrusel" : undefined}
      aria-labelledby={idTitulo}
      onKeyDown={alPulsar}
    >
      <div className={estilos.tarjeta}>
        {/* El marco recorta los fondos con el radio; el vidrio queda fuera. */}
        <div className={estilos.marco}>
          {diapositivas.map((s, i) => (
            <div key={`${s.fondo.url}-${i}`} className={estilos.capaFondo} hidden={i !== activo}>
              <Image
                src={s.fondo.url}
                alt=""
                fill
                // Por la proporción de la foto: en vertical manda el alto (ver la función).
                sizes={sizesFondoHero(s.fondo.width, s.fondo.height)}
                /*
                 * SOLO la primera: es el LCP. `preload` y no `priority` (obsoleto
                 * en Next 16.3.5); `fetchPriority` para que vaya por delante.
                 */
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : undefined}
                loading={i === 0 ? "eager" : "lazy"}
                className={estilos.fondo}
                // Punto focal del panel: qué parte de la foto se ve en móvil.
                style={{ objectPosition: s.fondo.posicion }}
              />
            </div>
          ))}
        </div>

        {/*
         * TÍTULO EN <h2> (D1). Solo el de la diapositiva activa: al cambiar, el
         * `key` monta uno nuevo y la animación vuelve a correr.
         */}
        <div
          className={`${estilos.filaTitulo} ${estilos.capaParallax}`}
          // Letras del título activo: el CSS encoge solo el que no cabe.
          style={{ ["--hero-titulo-letras" as string]: String(d.titulo.length) }}
        >
          <Revelado
            key={`titulo-${activo}`}
            id={idTitulo}
            como="h2"
            ritmo="portada"
            alCargar
            texto={d.titulo}
            className={estilos.titulo}
          />
        </div>

        {/*
         * HUECO DE LA MÁQUINA. Mide siempre lo mismo, tenga o no la diapositiva
         * una imagen recortada: el título y las flechas no saltan al cambiar.
         */}
        <div className={estilos.hueco}>
          {diapositivas.map((s, i) =>
            s.frontal ? (
              <div
                key={`${s.frontal.url}-${i}`}
                className={estilos.capaFrontal}
                hidden={i !== activo}
              >
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

        {/* Con una diapositiva no hay flechas; la fila conserva su alto. */}
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

        {/* VIDRIO: oculto en móvil por CSS, como en el diseño. */}
        {d.parrafo || d.enlace ? (
          <aside className={`${estilos.vidrio} ${estilos.capaParallax}`}>
            {d.parrafo ? (
              <Revelado
                key={`parrafo-${activo}`}
                como="p"
                ritmo="titulo"
                alCargar
                texto={d.parrafo}
                className={estilos.parrafo}
              />
            ) : null}
            {d.enlace ? (
              <Link href={d.enlace.href} className={estilos.mas} aria-label={d.enlace.nombre}>
                <IconoMas />
              </Link>
            ) : null}
          </aside>
        ) : null}
      </div>

      {hayVarias ? (
        <p className={estilos.soloLector} aria-live="polite" aria-atomic="true">
          {anuncio}
        </p>
      ) : null}
    </section>
  );
}
