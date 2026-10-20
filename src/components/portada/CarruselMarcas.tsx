"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import {
  INTERVALO_MS,
  TRANSICION_MS,
  alFrente,
  avanzaSolo,
  hayQueVolver,
  siguiente,
} from "@/lib/portada/carruselMarcas";
import type { TarjetaMarca } from "@/lib/portada/secciones";

import estilos from "./maquinariaNueva.module.css";

/**
 * CARRUSEL DE MARCAS — sección «Maquinaria pesada nueva» de la Home V2 de
 * Andrés (2026-10-15): 4 tarjetas a la vista en escritorio, 2 en tablet y 1 en
 * móvil, que avanzan solas cada 5 s en bucle, sin flechas.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el avance automático, los
 * puntos y la pausa. Las tarjetas están enteras en el HTML prerenderizado, con
 * sus enlaces; la posición la pone el CSS (`--indice`), así que no hay salto al
 * hidratar.
 *
 * El bucle (como Swiper): detrás de las tarjetas va una copia, inerte y oculta
 * a los lectores de pantalla; la pista avanza hasta la copia de la primera y
 * vuelve sin animar a la original (`src/lib/portada/carruselMarcas.ts`).
 *
 * Accesibilidad del avance automático (WCAG 2.2.2): se para con el puntero
 * encima, con el foco dentro, fuera de la vista y con «reducir movimiento»; y
 * lleva botón de pausa junto a los puntos, como el hero. Los puntos son
 * botones de 24 px («Ir a <marca>», `aria-current`), no los 6 px del diseño
 * (WCAG 2.5.8); se ven igual. Cada tarjeta ENLAZA a su marca (D9).
 */

type Props = { tarjetas: TarjetaMarca[]; etiqueta: string };

/** `sizes` de la foto de fondo: el ancho de una tarjeta en cada corte (4 · 2 · 1). */
const SIZES_FONDO = "(max-width: 767px) 94vw, (max-width: 1024px) 47vw, 24vw";

export function CarruselMarcas({ tarjetas, etiqueta }: Props) {
  const total = tarjetas.length;
  const region = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  const [animar, setAnimar] = useState(true);
  const [dentro, setDentro] = useState(false);
  const [visible, setVisible] = useState(false);
  const { pausado, alternar } = usePausa();
  const inicioGesto = useRef<number | null>(null);

  // Fuera de la vista no avanza: nadie lo ve y gasta batería.
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const observador = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const avanza = avanzaSolo({ total, pausado, dentro, visible });
  useEffect(() => {
    if (!avanza) return;
    const reloj = setInterval(() => {
      setAnimar(true);
      setIndice((i) => siguiente(i, total));
    }, INTERVALO_MS);
    return () => clearInterval(reloj);
  }, [avanza, total]);

  // En la copia de la primera: tras la transición, a la original sin animar.
  useEffect(() => {
    if (!hayQueVolver(indice, total)) return;
    const t = setTimeout(() => {
      setAnimar(false);
      setIndice(0);
    }, TRANSICION_MS);
    return () => clearTimeout(t);
  }, [indice, total]);

  const ir = (i: number) => {
    setAnimar(true);
    setIndice(i);
  };

  // Gesto en móvil: deslizar a un lado u otro mueve una tarjeta.
  const alSoltar = (x: number) => {
    const desde = inicioGesto.current;
    inicioGesto.current = null;
    if (desde === null || Math.abs(x - desde) < 40) return;
    const frente = alFrente(indice, total);
    ir(x < desde ? siguiente(frente, total) : (frente - 1 + total) % total);
  };

  const frente = alFrente(indice, total);
  const estiloPista = { "--indice": indice } as CSSProperties;

  // Diapositiva en `div` con `role="group"` (patrón de carrusel de WAI-ARIA): un `<li>` con
  // `role="group"` deja una lista con hijos no válidos (Lighthouse, 2026-10-19).
  const tarjeta = (t: TarjetaMarca, i: number, copia: boolean) => (
    <div
      key={`${copia ? "copia" : "t"}-${t.id}`}
      className={estilos.diapositiva}
      aria-hidden={copia || undefined}
      inert={copia || undefined}
      role={copia ? undefined : "group"}
      aria-roledescription={copia ? undefined : "tarjeta"}
      aria-label={copia ? undefined : `${i + 1} de ${total}: ${t.nombre}`}
      // Al tabular hasta una tarjeta que no se ve, se trae al frente.
      onFocus={copia ? undefined : () => i !== frente && ir(i)}
    >
      <Link href={t.href} className={estilos.tarjeta} tabIndex={copia ? -1 : undefined}>
        <Image
          src={t.fondo.url}
          alt=""
          fill
          sizes={SIZES_FONDO}
          className={estilos.fondo}
          style={{ objectPosition: t.fondo.posicion }}
          loading="lazy"
        />
        {t.logo ? (
          <span className={estilos.logoCol}>
            <LogoMarca
              logo={t.logo}
              alt={copia ? "" : t.logo.alt}
              sizes="120px"
              className={estilos.logo}
            />
          </span>
        ) : (
          // Sin logo, el nombre: la tarjeta no puede quedar sin nombre accesible.
          <span className="sr-only">{t.nombre}</span>
        )}
        {t.texto ? (
          <span lang="es" className={`${estilos.texto} block`}>
            {t.texto}
          </span>
        ) : null}
      </Link>
    </div>
  );

  return (
    <div
      ref={region}
      className={estilos.carrusel}
      role="region"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
      onMouseEnter={() => setDentro(true)}
      onMouseLeave={() => setDentro(false)}
      onFocus={() => setDentro(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDentro(false);
      }}
    >
      <div
        className={estilos.marco}
        onPointerDown={(e) => (inicioGesto.current = e.clientX)}
        onPointerUp={(e) => alSoltar(e.clientX)}
        onPointerCancel={() => (inicioGesto.current = null)}
      >
        <div
          id="portada-marcas-pista"
          className={`${estilos.pista} ${animar ? "" : estilos.sinTransicion}`}
          style={estiloPista}
        >
          {tarjetas.map((t, i) => tarjeta(t, i, false))}
          {total > 1 ? tarjetas.map((t, i) => tarjeta(t, i, true)) : null}
        </div>
      </div>
      {/* Siempre en el marcado: reserva el alto de los controles y no hay salto al hidratar. */}
      <div className={estilos.controles}>
        {total > 1 ? (
          <>
            <ul className={estilos.puntos}>
              {tarjetas.map((t, i) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={estilos.punto}
                    onClick={() => ir(i)}
                    aria-label={`Ir a ${t.nombre}`}
                    aria-current={i === frente ? "true" : undefined}
                    aria-controls="portada-marcas-pista"
                  />
                </li>
              ))}
            </ul>
            <BotonPausa
              pausado={pausado}
              alPulsar={alternar}
              que="el carrusel de marcas"
              controla="portada-marcas-pista"
              className={estilos.pausa}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
