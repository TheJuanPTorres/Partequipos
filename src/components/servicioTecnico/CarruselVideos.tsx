"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

import estilos from "./servicio.module.css";

/**
 * CARRUSEL DE LOS VÍDEOS DEL ALISTAMIENTO (plantilla de Andrés, `nested-carousel`
 * con una diapositiva a la vista).
 *
 * Por qué es de cliente: cambia de diapositiva con las flechas y los puntos, y
 * pausa el vídeo de la que se oculta. Las diapositivas llegan ya pintadas del
 * servidor (`children`); las que no se ven, `inert`.
 *
 * Se aparta del widget: NO pasa solo (son vídeos: moverse a mitad de uno lo
 * cortaría), así que no necesita botón de pausa. Con movimiento reducido, el
 * cambio es instantáneo (CSS).
 */
export function CarruselVideos({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  const diapositivas = Children.toArray(children);
  const total = diapositivas.length;
  const [actual, setActual] = useState(0);
  const pista = useRef<HTMLUListElement>(null);

  // El vídeo de una diapositiva que se oculta no sigue sonando detrás.
  useEffect(() => {
    pista.current?.querySelectorAll<HTMLLIElement>(":scope > li").forEach((li, i) => {
      if (i !== actual) li.querySelectorAll("video").forEach((v) => v.pause());
    });
  }, [actual]);

  const ir = (i: number) => setActual(((i % total) + total) % total);

  return (
    <div
      className={estilos.carrusel}
      role="group"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
    >
      <div className={estilos.carruselVentana}>
        <ul
          ref={pista}
          className={estilos.carruselPista}
          style={{ transform: `translateX(-${actual * 100}%)` }}
        >
          {diapositivas.map((d, i) => (
            <li
              key={i}
              className={estilos.carruselDiapositiva}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}`}
              inert={i !== actual}
            >
              {d}
            </li>
          ))}
        </ul>
      </div>
      {total > 1 ? (
        <div className={estilos.carruselControles}>
          <button
            type="button"
            className={estilos.carruselFlecha}
            onClick={() => ir(actual - 1)}
            aria-label="Vídeo anterior"
          >
            <IconChevronLeft aria-hidden="true" />
          </button>
          <div className={estilos.carruselPuntos}>
            {diapositivas.map((_, i) => (
              <button
                key={i}
                type="button"
                className={estilos.carruselPunto}
                aria-label={`Ver el vídeo ${i + 1} de ${total}`}
                aria-current={i === actual ? "true" : undefined}
                onClick={() => ir(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className={estilos.carruselFlecha}
            onClick={() => ir(actual + 1)}
            aria-label="Vídeo siguiente"
          >
            <IconChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
