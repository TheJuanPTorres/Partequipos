import Link from "next/link";

import type { ModeloEnlace } from "@/lib/repuestos/tipo";

import estilos from "./marca.module.css";

/**
 * «MODELOS DE <TIPO> <MARCA>» de la página de tipo (PROVISIONAL hasta el
 * diseño de Andrés): la franja amarilla que sigue al encabezado, con un enlace
 * en píldora por modelo, a su ficha de repuestos. Mismo lenguaje que las
 * categorías de la página de marca.
 *
 * Sin modelos publicados, un aviso en vez de una franja vacía.
 */
export function ModelosTipo({
  id,
  titulo,
  modelos,
  vacio,
}: {
  id: string;
  titulo: string;
  modelos: ModeloEnlace[];
  vacio: string;
}) {
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.modelos} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      {modelos.length === 0 ? (
        <p className={estilos.modelosVacio}>{vacio}</p>
      ) : (
        <ul className={estilos.modelosLista}>
          {modelos.map((m) => (
            <li key={m.id}>
              <Link href={m.href} className={estilos.modelo}>
                <span>{m.nombre}</span>
                {m.codigo ? <span className={estilos.modeloCodigo}>{m.codigo}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
