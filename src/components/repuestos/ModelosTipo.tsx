import Link from "next/link";

import reserva from "@/components/blog/cabeceraArticulo.module.css";
import type { ModeloEnlace } from "@/lib/repuestos/tipo";

import estilos from "./marca.module.css";

/**
 * «MODELOS DE <TIPO> <MARCA>» de la página de tipo (PROVISIONAL hasta el
 * diseño de Andrés): la franja amarilla que sigue al encabezado, con un enlace
 * en píldora por modelo, a su ficha de repuestos. Mismo lenguaje que las
 * categorías de la página de marca.
 *
 * Sin desplazamiento al llegar Inter (CLS 0,073 a 1440 en la medición de C): cada
 * texto de la píldora reserva su ancho con una copia invisible en la fuente de
 * respaldo (la técnica de la cabecera del artículo), así las filas de la lista
 * no se reparten distinto con una fuente y con otra.
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
                <span
                  className={`${reserva.reserva} ${estilos.modeloTexto}`}
                  data-reserva={m.nombre}
                >
                  <span>{m.nombre}</span>
                </span>
                {m.codigo ? (
                  <span
                    className={`${reserva.reserva} ${estilos.modeloTexto} ${estilos.modeloCodigo}`}
                    data-reserva={m.codigo}
                  >
                    <span>{m.codigo}</span>
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
