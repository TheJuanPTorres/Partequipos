import Link from "next/link";

import { ICONOS_CATEGORIA } from "@/components/portada/iconosCategoria";
import type { CategoriaMarca } from "@/lib/repuestos/marca";

import estilos from "./marca.module.css";

/**
 * «NUESTRAS CATEGORÍAS DE REPUESTOS» (ux-9): una franja de color con una
 * píldora por categoría técnica, con su icono. Las categorías son comunes a
 * todas las marcas.
 *
 * SIN ENLACE mientras la categoría no tenga página (hoy ninguna: sus URL están
 * sin decidir, CLAUDE.md §10.3). En cuanto se rellene su «Enlace», la píldora
 * se convierte en enlace sola; nunca hay un enlace roto.
 *
 * Lo que se aparta de ux-9:
 * - Lista de verdad (`<ul>`); en ux-9, siete listas de un elemento.
 * - Iconos de Tabler (en ux-9, SVG del kit de Flaticon, L2).
 * - En móvil ux-9 deja ver solo la 2.ª y la 3.ª (las demás se ocultan por
 *   posición, `hide_mobile`): se replica y se anota en el documento.
 */
export function CategoriasMarca({
  id,
  titulo,
  categorias,
}: {
  id: string;
  titulo: string;
  categorias: CategoriaMarca[];
}) {
  if (!titulo || categorias.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.categorias} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      <ul className={estilos.pildoras}>
        {categorias.map((c) => {
          const Icono = c.icono ? ICONOS_CATEGORIA[c.icono] : null;
          const contenido = (
            <>
              {Icono ? (
                <span className={estilos.pildoraIcono} aria-hidden="true">
                  <Icono focusable="false" stroke={1.5} />
                </span>
              ) : null}
              <span>{c.nombre}</span>
            </>
          );
          return (
            <li key={c.id} className={estilos.pildoraCaja}>
              {c.href ? (
                <Link href={c.href} className={estilos.pildora}>
                  {contenido}
                </Link>
              ) : (
                <span className={estilos.pildora}>{contenido}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
