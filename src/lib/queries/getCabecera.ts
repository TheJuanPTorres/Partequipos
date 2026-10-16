import { cache } from "react";
import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload } from "payload";

import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "../cacheDatos";

export type EnlaceCabecera = { etiqueta: string; href: string };

type Cabecera = { enlaces: EnlaceCabecera[]; boton: EnlaceCabecera | null };

/**
 * El global `cabecera` (menú y botón), listo para pintar. Un enlace sin texto
 * o sin destino no sale. En la caché de datos del MARCO (`datos:marco`,
 * `src/lib/cacheDatos.ts`): va en todas las páginas.
 */
const cabeceraEnCache = unstable_cache(
  async (): Promise<Cabecera> => {
    const payload = await getPayload({ config });
    const c = await payload.findGlobal({ slug: "cabecera", depth: 0 });
    const enlaces = (c.enlaces ?? []).flatMap((e) =>
      e.etiqueta?.trim() && e.enlace?.trim()
        ? [{ etiqueta: e.etiqueta.trim(), href: e.enlace.trim() }]
        : [],
    );
    const boton =
      c.botonTexto?.trim() && c.botonEnlace?.trim()
        ? { etiqueta: c.botonTexto.trim(), href: c.botonEnlace.trim() }
        : null;
    return { enlaces, boton };
  },
  ["cabecera", CLAVE_DESPLIEGUE],
  { tags: [ETIQUETAS_DATOS.marco] },
);

export const getCabecera = cache(() => cabeceraEnCache());
