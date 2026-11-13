import Image from "next/image";
import Link from "next/link";

import type { TarjetaMarca } from "@/lib/repuestos/marca";

import estilos from "./categoriasFicha.module.css";

/**
 * LAS CATEGORÍAS DE REPUESTOS de la ficha de un modelo, diseño v2 del cliente (2026-11-13): una
 * tarjeta por categoría con un panel del tono de la marca (degradado claro y franja de luz en
 * diagonal) con la foto del repuesto, el nombre y «Ver productos». 5 por fila (4 si hay 4 o
 * menos), 3 en tablet y 2 en móvil. Las fotos y los enlaces son los del panel. La lista lleva
 * `data-entrada` (la entrada escalonada C1 es de `ZonaAnimada`). El color es `--marca-amarillo`
 * de la página de marca.
 */
export function CategoriasFicha({
  id,
  titulo,
  categorias,
}: {
  id: string;
  titulo: string;
  categorias: TarjetaMarca[];
}) {
  const conEnlace = categorias.filter((c) => c.href);
  if (conEnlace.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.seccion} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={estilos.titulo}>
        {titulo.split("\n").join(" ")}
      </h2>
      <ul
        className={`${estilos.rejilla} ${conEnlace.length <= 4 ? estilos.cuatro : ""}`}
        data-entrada
      >
        {conEnlace.map((c) => (
          <li key={c.clave} className={estilos.caja}>
            <Link href={c.href ?? "#"} className={estilos.tarjeta}>
              <span className={estilos.panel}>
                <span aria-hidden="true" className={estilos.luz} />
                {c.imagen ? (
                  <span className={estilos.foto}>
                    <Image
                      src={c.imagen.url}
                      alt=""
                      fill
                      sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 18vw"
                      className={estilos.fotoImg}
                    />
                  </span>
                ) : null}
              </span>
              <span className={estilos.pie}>
                <span className={estilos.nombre}>{c.titulo}</span>
                <span aria-hidden="true" className={estilos.ver}>
                  Ver productos
                  <svg
                    viewBox="0 0 16 16"
                    className={estilos.flecha}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
                  </svg>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
