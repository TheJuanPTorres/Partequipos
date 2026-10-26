import Image from "next/image";
import Link from "next/link";

import type { ArticuloLista } from "@/lib/blog/indice";
import { rutas } from "@/lib/routes";

import estilos from "./articuloPropio.module.css";

/**
 * «Post recientes» de la columna derecha (como el artículo de WordPress, sin
 * «Suscribirme»): miniatura, título y un extracto corto. En móvil va debajo del
 * artículo. La miniatura es decorativa: el título ya es el enlace.
 */
export function PostRecientes({ articulos }: { articulos: ArticuloLista[] }) {
  if (!articulos.length) return null;
  return (
    <section className={estilos.recientes} aria-labelledby="blog-recientes">
      <h2 id="blog-recientes" className={estilos.tituloRecientes}>
        Post recientes
      </h2>
      <ul>
        {articulos.map((a) => {
          const href = `${rutas.articulo(a.slug)}/`;
          return (
            <li key={a.id} className={estilos.reciente}>
              {a.imagen ? (
                <Link href={href} tabIndex={-1} aria-hidden="true" className={estilos.miniatura}>
                  <Image
                    src={a.imagen.url}
                    alt=""
                    fill
                    sizes="(min-width: 1025px) 128px, 96px"
                    style={{ objectPosition: a.imagen.posicion }}
                  />
                </Link>
              ) : null}
              <div>
                <h3>
                  <Link href={href}>{a.titulo}</Link>
                </h3>
                <p>{extractoCorto(a.extracto)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Unos 70 caracteres, cortados en una palabra. */
function extractoCorto(texto: string): string {
  const limpio = texto.replace(/…$/, "").trim();
  if (limpio.length <= 70) return texto;
  const corte = limpio.slice(0, 70);
  return `${corte.slice(0, corte.lastIndexOf(" ")).replace(/[,.;:]$/, "")}…`;
}
