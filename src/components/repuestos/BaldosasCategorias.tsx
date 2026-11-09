import Image from "next/image";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import type { TarjetaMarca } from "@/lib/repuestos/marca";

import estilos from "./marca.module.css";

/**
 * Las CATEGORÍAS TÉCNICAS del índice en BALDOSAS (dirección, 2026-10-22), las de «Mostrar
 * marcas» del índice de marcas (`BaldosasMarcas`: blancas, compactas, con borde gris): la foto
 * de la tarjeta de la categoría, centrada y entera en su marco, su nombre y «Ver productos →» (botón rojo de marca, el de los botones rojos del sitio).
 * Toda la baldosa es el enlace.
 *
 * Colocación (excepción a la regla de tarjetas, como las marcas): 5 por fila en escritorio
 * (2 filas para las 10), 3 en tablet y 2 en móvil, la última fila centrada (solo CSS).
 *
 * El título de la sección va al tamaño de los títulos de sección principales, con el revelado
 * por palabras. La lista lleva `data-entrada`: la entrada escalonada (C1) es de `ZonaAnimada`.
 */
export function BaldosasCategorias({
  id,
  titulo,
  categorias,
  compacta = false,
}: {
  id: string;
  titulo: string;
  categorias: TarjetaMarca[];
  /**
   * Dentro de la ficha de modelo (Juan Pablo, #433): sin el recuadro blanco ni el título grande,
   * 3 por fila (2 en móvil) y la baldosa más pequeña; el mismo estilo y las mismas animaciones.
   */
  compacta?: boolean;
}) {
  const conEnlace = categorias.filter((c) => c.href);
  if (conEnlace.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  if (compacta) {
    return (
      <section id={id} className={estilos.baldosasFichaSeccion} aria-labelledby={idTitulo}>
        <h2 id={idTitulo} className={estilos.baldosasFichaTitulo}>
          {titulo.split("\n").join(" ")}
        </h2>
        <ul className={estilos.baldosasFicha} data-entrada>
          {conEnlace.map((c) => (
            <li key={c.clave}>
              <Link
                href={c.href ?? "#"}
                className={`${estilos.baldosaCategoria} ${estilos.baldosaCompacta}`}
              >
                <span className={estilos.baldosaFoto}>
                  {c.imagen ? (
                    <Image
                      src={c.imagen.url}
                      alt=""
                      width={c.imagen.width}
                      height={c.imagen.height}
                      sizes="(max-width: 767px) 40vw, 200px"
                      className={estilos.baldosaFotoImg}
                    />
                  ) : null}
                </span>
                <span className={estilos.baldosaNombre}>{c.titulo}</span>
                <span className={estilos.baldosaVer} aria-hidden="true">
                  Ver productos <span className={estilos.baldosaFlecha}>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return (
    <section id={id} className={estilos.mostrarMarcas} aria-labelledby={idTitulo}>
      <div className={`${estilos.mostrarMarcasRecuadro} ${estilos.categoriasRecuadro}`}>
        <Revelado
          como="h2"
          id={idTitulo}
          ritmo="titulo"
          texto={titulo}
          className={estilos.categoriasTitulo}
        />
        <ul className={`${estilos.baldosas} ${estilos.baldosasCategorias}`} data-entrada>
          {conEnlace.map((c) => (
            <li key={c.clave} className={estilos.categoriaCaja}>
              <Link href={c.href ?? "#"} className={estilos.baldosaCategoria}>
                <span className={estilos.baldosaFoto}>
                  {c.imagen ? (
                    <Image
                      src={c.imagen.url}
                      alt=""
                      width={c.imagen.width}
                      height={c.imagen.height}
                      sizes="(max-width: 767px) 40vw, (max-width: 1024px) 28vw, 220px"
                      className={estilos.baldosaFotoImg}
                    />
                  ) : null}
                </span>
                <span className={estilos.baldosaNombre}>{c.titulo}</span>
                <span className={estilos.baldosaVer} aria-hidden="true">
                  Ver productos <span className={estilos.baldosaFlecha}>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
