"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./bienvenida.module.css";

/** Lo que tarda cada foto, como el carrusel de WordPress (`autoplay_speed: 5000`). */
const INTERVALO_MS = 5000;

/**
 * CARRUSEL DE FOTOS de la presentación de una página de marca (Filtros Donaldson, 2026-10-26):
 * una foto a la vista, ENTERA, con flechas y puntos. Pasa sola cada 5 s, como en WordPress, y
 * se para mientras el ratón o el foco están encima; el botón de pausa la para del todo (WCAG
 * 2.2.2). Con «reducir movimiento» empieza parada y el cambio es instantáneo (CSS).
 *
 * Por qué es de cliente: cambia de foto con un temporizador, las flechas y los puntos.
 */
export function CarruselFotos({ fotos, etiqueta }: { fotos: ImagenLista[]; etiqueta: string }) {
  const total = fotos.length;
  const [actual, setActual] = useState(0);
  const [encima, setEncima] = useState(false);
  const { pausado, alternar } = usePausa();
  const id = useId();
  const idPista = `${id}-pista`;

  const ir = (i: number) => setActual(((i % total) + total) % total);

  useEffect(() => {
    if (total < 2 || pausado || encima) return;
    const t = setTimeout(() => setActual((a) => (a + 1) % total), INTERVALO_MS);
    return () => clearTimeout(t);
  }, [actual, total, pausado, encima]);

  return (
    <div
      className={estilos.carrusel}
      role="group"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
      onPointerEnter={() => setEncima(true)}
      onPointerLeave={() => setEncima(false)}
      onFocus={() => setEncima(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEncima(false);
      }}
    >
      <div className={estilos.ventana}>
        <ul
          id={idPista}
          className={estilos.pista}
          style={{ transform: `translateX(-${actual * 100}%)` }}
          aria-live={pausado ? "polite" : "off"}
        >
          {fotos.map((f, i) => (
            <li
              key={`${i}-${f.url}`}
              className={estilos.diapositiva}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}`}
              inert={i !== actual}
            >
              <Image
                src={f.url}
                alt={f.alt}
                fill
                sizes="(max-width: 1024px) 90vw, 46vw"
                className={estilos.foto}
              />
            </li>
          ))}
        </ul>
        {total > 1 ? (
          <>
            <button
              type="button"
              className={`${estilos.flecha} ${estilos.flechaAnterior}`}
              onClick={() => ir(actual - 1)}
              aria-label="Foto anterior"
              aria-controls={idPista}
            >
              <IconChevronLeft aria-hidden="true" focusable="false" size={22} stroke={2} />
            </button>
            <button
              type="button"
              className={`${estilos.flecha} ${estilos.flechaSiguiente}`}
              onClick={() => ir(actual + 1)}
              aria-label="Foto siguiente"
              aria-controls={idPista}
            >
              <IconChevronRight aria-hidden="true" focusable="false" size={22} stroke={2} />
            </button>
          </>
        ) : null}
      </div>
      {total > 1 ? (
        <div className={estilos.controles}>
          <BotonPausa
            pausado={pausado}
            alPulsar={alternar}
            que="el carrusel de fotos"
            controla={idPista}
            className={estilos.pausa}
          />
          <ul className={estilos.puntos}>
            {fotos.map((f, i) => (
              <li key={`${i}-${f.url}`}>
                <button
                  type="button"
                  className={estilos.punto}
                  onClick={() => ir(i)}
                  aria-label={`Ver la foto ${i + 1} de ${total}`}
                  aria-current={i === actual ? "true" : undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
