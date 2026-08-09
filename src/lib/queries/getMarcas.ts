import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Marca } from "@/payload-types";

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

/**
 * Devuelve todas las marcas usando la API LOCAL de Payload (no HTTP).
 * Se ejecuta en el servidor (Server Components / build). `depth: 1` puebla
 * la relación `logo` con el documento de Media.
 */
export const getMarcas = cache(async (): Promise<Marca[]> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "marcas",
    depth: 1,
    limit: 0, // sin límite: el catálogo completo
    sort: "nombre",
  });

  return docs;
});

/** Una marca por su slug (único a nivel global). */
export const getMarcaPorSlug = cache(async (slug: string): Promise<Marca | null> => {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "marcas",
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });

  return docs[0] ?? null;
});
