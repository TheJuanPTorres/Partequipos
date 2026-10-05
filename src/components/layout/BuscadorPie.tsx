"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import estilos from "./pie.module.css";

/** Lo que se anuncia al «buscar» mientras el buscador no exista. */
export const AVISO_BUSCADOR = "Buscador disponible pronto";

/**
 * BUSCADOR DEL PIE — PROVISIONAL (decisión de dirección, 2026-10-05).
 *
 * El campo y el botón de ux-9 (export 2178 del 2026-10-05, medidos en ux-9
 * publicado), pero el buscador NO está aprobado (alcance adicional, CLAUDE.md
 * §10.33 p.9). Al pulsar «Buscar» o Enter, solo anuncia «Buscador disponible
 * pronto» junto al campo, en una región `role="status"`, y no navega.
 *
 * Sin `<form>` a propósito: un formulario enviaría la página —con `?q=`— si se
 * pulsa Enter antes de hidratar. Así, sin JavaScript, simplemente no pasa nada.
 *
 * Es componente de cliente por el estado del aviso (CLAUDE.md §3.1). Cuando se
 * apruebe el buscador, se sustituye entero (formulario GET, `noindex`, fuera
 * del sitemap: el diseño técnico está en §10.33 p.9).
 */
export function BuscadorPie() {
  const [aviso, setAviso] = useState("");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  // Se vacía y se vuelve a escribir para que el lector de pantalla lo anuncie
  // también la segunda vez.
  const avisar = () => {
    setAviso("");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(AVISO_BUSCADOR), 50);
  };

  const alPulsarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      avisar();
    }
  };

  return (
    <div role="search" aria-label="Buscar en el sitio" className={estilos.buscador}>
      <div className={estilos.buscadorFila}>
        <label htmlFor="pie-buscar" className="sr-only">
          Buscar en el sitio
        </label>
        <input
          id="pie-buscar"
          type="search"
          className={estilos.buscadorCampo}
          placeholder="Escribe para comenzar a buscar..."
          autoComplete="off"
          aria-describedby="pie-buscar-aviso"
          onKeyDown={alPulsarTecla}
        />
        <button type="button" className={estilos.buscadorBoton} onClick={avisar}>
          Buscar
        </button>
      </div>
      <p id="pie-buscar-aviso" role="status" className={estilos.buscadorAviso}>
        {aviso}
      </p>
    </div>
  );
}
