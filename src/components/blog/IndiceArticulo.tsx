"use client";

import { IconListDetails } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import type { TituloArticulo } from "@/lib/blog/titulos";

import estilos from "./articuloPropio.module.css";

/**
 * «En este artículo»: el índice de los h2 y h3. Todos son enlaces normales a
 * sus anclas (funciona sin JavaScript); con JavaScript, el del título que se
 * está leyendo se marca (`aria-current="location"`). Desde 1025 px queda fijo
 * al lado del texto; en pantallas más estrechas es un desplegable sobre el
 * texto (`<details>`, cerrado).
 */
export function IndiceArticulo({ titulos }: { titulos: TituloArticulo[] }) {
  const [activo, setActivo] = useState<string | null>(null);

  useEffect(() => {
    const elementos = titulos
      .map((t) => document.getElementById(t.id))
      .filter((e): e is HTMLElement => e !== null);
    if (!elementos.length) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        const visibles = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles[0]) setActivo(visibles[0].target.id);
      },
      // La banda de lectura: del 10 % al 35 % de la altura de la ventana.
      { rootMargin: "-10% 0px -65% 0px" },
    );
    elementos.forEach((e) => observador.observe(e));
    return () => observador.disconnect();
  }, [titulos]);

  if (titulos.length < 2) return null;

  const lista = (
    <ol className={estilos.listaIndice}>
      {titulos.map((t) => (
        <li key={t.id} data-nivel={t.nivel}>
          <a href={`#${t.id}`} aria-current={activo === t.id ? "location" : undefined}>
            {t.texto}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav className={estilos.indice} aria-label="En este artículo">
      <details className={estilos.indiceMovil}>
        <summary>
          <IconListDetails aria-hidden="true" size={20} stroke={1.8} />
          En este artículo
        </summary>
        {lista}
      </details>
      <div className={estilos.indiceEscritorio}>
        <p className={estilos.tituloIndice}>En este artículo</p>
        {lista}
      </div>
    </nav>
  );
}
