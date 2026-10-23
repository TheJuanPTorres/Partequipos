"use client";

import { IconListDetails } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

import type { TituloArticulo } from "@/lib/blog/titulos";

import estilos from "./articuloPropio.module.css";

/**
 * «En este artículo»: el índice de los h2 y h3. Todos son enlaces normales a
 * sus anclas (funciona sin JavaScript); con JavaScript, el del título que se
 * está leyendo se marca (`aria-current="location"`). Dos variantes, cada una
 * en su sitio de la página: `escritorio` (desde 1025 px) fijo al lado del
 * texto, y `movil` (por debajo) un desplegable discreto justo bajo la
 * cabecera (`<details>`, cerrado), que se cierra al elegir una sección.
 */
export function IndiceArticulo({
  titulos,
  variante,
}: {
  titulos: TituloArticulo[];
  variante: "movil" | "escritorio";
}) {
  const [activo, setActivo] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const desplegable = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const elementos = titulos
      .map((t) => document.getElementById(t.id))
      .filter((e): e is HTMLElement => e !== null);
    if (!elementos.length) return;
    // La sección actual es la última cuyo título ya pasó la línea de lectura
    // (35 % de la ventana). Se recalcula al hacer scroll, al cambiar el ancla
    // y al cambiar el tamaño: no depende de que un título cruce una banda.
    let pendiente = 0;
    const calcular = () => {
      pendiente = 0;
      const linea = window.innerHeight * 0.35;
      let actual: string | null = null;
      for (const e of elementos) {
        if (e.getBoundingClientRect().top <= linea) actual = e.id;
        else break;
      }
      setActivo(actual);
    };
    const programar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", programar, { passive: true });
    window.addEventListener("resize", programar);
    window.addEventListener("hashchange", programar);
    return () => {
      cancelAnimationFrame(pendiente);
      window.removeEventListener("scroll", programar);
      window.removeEventListener("resize", programar);
      window.removeEventListener("hashchange", programar);
    };
  }, [titulos]);

  if (titulos.length < 2) return null;

  const lista = (
    <ol className={estilos.listaIndice}>
      {titulos.map((t) => (
        <li key={t.id} data-nivel={t.nivel}>
          <a
            href={`#${t.id}`}
            aria-current={activo === t.id ? "location" : undefined}
            onClick={() => setActivo(t.id)}
          >
            {t.texto}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variante === "escritorio") {
    return (
      <nav className={estilos.indiceEscritorio} aria-label="En este artículo">
        <p className={estilos.tituloIndice}>En este artículo</p>
        {lista}
      </nav>
    );
  }

  return (
    <nav className={estilos.indiceCabecera} aria-label="En este artículo">
      <details
        ref={desplegable}
        className={estilos.indiceMovil}
        onToggle={(e) => setAbierto(e.currentTarget.open)}
        onClick={(e) => {
          // Al elegir una sección el desplegable se cierra; el ancla sigue su curso.
          if ((e.target as HTMLElement).closest("a") && desplegable.current) {
            desplegable.current.open = false;
          }
        }}
      >
        <summary aria-expanded={abierto}>
          <IconListDetails aria-hidden="true" size={20} stroke={1.8} />
          En este artículo
        </summary>
        {lista}
      </details>
    </nav>
  );
}
