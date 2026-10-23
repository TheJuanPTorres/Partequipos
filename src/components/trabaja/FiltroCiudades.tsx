"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

import { CURVA_FRENADA, DURACION_DESLIZAR_MS } from "@/lib/listado/animaciones";
import type { OpcionCiudad } from "@/lib/vacantes/vista";

import estilos from "./trabaja.module.css";

/**
 * El filtro por ciudad de «Trabaja con nosotros» (enlaces `?ciudad=…`, que funcionan sin
 * JavaScript). Con T3 encendida (`data-anim` de la zona), el resaltado de la ciudad elegida VIAJA
 * desde la píldora anterior, como el de la barra de series (`BarraSeries`): el fondo es el
 * `::before` de la píldora actual y se anima con `transform` desde donde estaba. El componente
 * sigue montado al cambiar de ciudad (solo se actualizan las tarjetas), así que recuerda dónde
 * estaba el resaltado. Con «reducir movimiento», salta directo.
 */
export function FiltroCiudades({
  ciudades,
  ciudadActual,
  ruta,
}: {
  ciudades: OpcionCiudad[];
  ciudadActual: string | null;
  ruta: string;
}) {
  const lista = useRef<HTMLUListElement>(null);
  const anterior = useRef<{ izquierda: number; ancho: number; arriba: number } | null>(null);

  useLayoutEffect(() => {
    const ul = lista.current;
    const actual = ul?.querySelector<HTMLElement>('a[aria-current="page"]');
    const antes = anterior.current;
    if (actual) {
      anterior.current = {
        izquierda: actual.offsetLeft,
        ancho: actual.offsetWidth,
        arriba: actual.offsetTop,
      };
    }
    if (
      !actual ||
      !antes ||
      !actual.offsetWidth ||
      !ul?.closest('[data-anim~="T3"]') ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const dx = antes.izquierda - actual.offsetLeft;
    const dy = antes.arriba - actual.offsetTop;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    actual.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scaleX(${antes.ancho / actual.offsetWidth})` },
        { transform: "none" },
      ],
      { duration: DURACION_DESLIZAR_MS, easing: CURVA_FRENADA, pseudoElement: "::before" },
    );
  }, [ciudadActual]);

  return (
    <ul ref={lista} className={estilos.filtroLista}>
      <li>
        <Link
          href={ruta}
          className={estilos.filtroOpcion}
          aria-current={ciudadActual === null ? "page" : undefined}
          prefetch={false}
        >
          <span className={`${estilos.reserva} ${estilos.reservaLinea}`} data-reserva="Todas">
            <span>Todas</span>
          </span>
        </Link>
      </li>
      {ciudades.map((c) => (
        <li key={c.slug}>
          <Link
            href={`${ruta}?ciudad=${c.slug}`}
            className={estilos.filtroOpcion}
            aria-current={ciudadActual === c.slug ? "page" : undefined}
            prefetch={false}
          >
            <span
              className={`${estilos.reserva} ${estilos.reservaLinea}`}
              data-reserva={`${c.nombre} (${c.cuantas})`}
            >
              <span>
                {c.nombre} <span className={estilos.filtroCuantas}>({c.cuantas})</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
