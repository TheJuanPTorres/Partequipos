import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Pagina } from "@/payload-types";

/*
 * Las consultas de este módulo van envueltas en `cache()` de React.
 *
 * Sin ello cada página resolvía DOS VECES la misma cadena: una en
 * `generateMetadata` y otra en el componente, que no comparten resultado por
 * sí solos. `cache()` memoiza por petición y elimina esa duplicación. El coste
 * medido está en CLAUDE.md §10.10.
 *
 * Transparente para quien llama: las firmas no cambian. No memoiza cuando el
 * argumento es un array (identidad distinta en cada llamada); no empeora nada
 * respecto de antes, simplemente no ayuda ahí.
 */

/** Slug reservado para la portada: no cuelga de una ruta propia. */
export const SLUG_PORTADA = "inicio";

/**
 * Slug de la página de contacto. Se declara aquí porque la ruta comodín
 * `[...slug]` necesita reconocerla para insertar el formulario: es la única
 * página institucional con comportamiento propio.
 */
export const SLUG_CONTACTO = "contactanos";

/** Todas las páginas institucionales. Para generateStaticParams. */
export const getPaginas = cache(async (): Promise<Pagina[]> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "paginas",
    depth: 1,
    limit: 0,
    sort: "titulo",
  });

  return docs;
});

/** Una página por su slug (ruta completa, sin barras). */
export const getPaginaPorSlug = cache(async (slug: string): Promise<Pagina | null> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "paginas",
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });

  return docs[0] ?? null;
});
