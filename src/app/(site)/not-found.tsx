import { IconArrowRight, IconHome } from "@tabler/icons-react";
import Link from "next/link";

import { getCabecera } from "@/lib/queries/getCabecera";
import { METADATA_404 } from "@/lib/seo/noEncontrada";

import estilos from "./noEncontrada.module.css";

export const metadata = METADATA_404;

/**
 * PÁGINA 404 PROPIA (auditoría de C, I3, 2026-10-06). Sustituye a la de Next,
 * en inglés y sin `<main>`. Va dentro de la cabecera y el pie del sitio.
 *
 * El día del cambio de dominio habrá URL viejas que acaben aquí (las de
 * categoría técnica y otras sin decidir, §10.3 p.8): por eso ofrece salidas a
 * las secciones principales. Esas secciones son las del menú de la cabecera
 * (global `cabecera` del panel), así que no hay enlaces escritos en el código.
 */
export default async function NoEncontrada() {
  const { enlaces, boton } = await getCabecera();
  const secciones = boton ? [...enlaces, boton] : enlaces;

  return (
    <main className={estilos.seccion}>
      <p className={`${estilos.antetitulo} texto-etiqueta`}>Error 404</p>
      <h1 className={`${estilos.titulo} texto-titulo-seccion`}>Página no encontrada</h1>
      <p className={estilos.texto}>
        La página que buscas no existe o cambió de dirección. Puedes volver al inicio o ir a una de
        nuestras secciones.
      </p>
      <Link href="/" className={`${estilos.inicio} texto-etiqueta`}>
        <IconHome aria-hidden="true" focusable="false" stroke={1.75} />
        Volver al inicio
      </Link>
      {secciones.length > 0 ? (
        <nav aria-label="Secciones principales" className={estilos.secciones}>
          <ul className={estilos.lista}>
            {secciones.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className={estilos.enlace}>
                  {s.etiqueta}
                  <IconArrowRight aria-hidden="true" focusable="false" stroke={1.75} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}
