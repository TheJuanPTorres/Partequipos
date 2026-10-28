import { cache } from "react";
import { unstable_cache } from "next/cache";
import config from "@payload-config";
import { getPayload } from "payload";

import { enlacesDeCabecera, type EnlaceCabecera } from "../cabecera/enlaces";
import { CLAVE_DESPLIEGUE, ETIQUETAS_DATOS } from "../cacheDatos";

export type { EnlaceCabecera };

type Cabecera = { enlaces: EnlaceCabecera[]; boton: EnlaceCabecera | null };

/**
 * El global `cabecera` (menú y botón), listo para pintar. Un enlace sin texto,
 * sin destino o con «Mostrar» desmarcado no sale (`enlacesDeCabecera`). En la caché de datos del MARCO (`datos:marco`,
 * `src/lib/cacheDatos.ts`): va en todas las páginas.
 */
const cabeceraEnCache = unstable_cache(
  async (): Promise<Cabecera> => {
    const payload = await getPayload({ config });
    const c = await payload.findGlobal({ slug: "cabecera", depth: 0 });
    const enlaces = enlacesDeCabecera(c.enlaces);
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
