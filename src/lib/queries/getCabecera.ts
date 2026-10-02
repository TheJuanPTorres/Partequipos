import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

export type EnlaceCabecera = { etiqueta: string; href: string };

/**
 * El global `cabecera` (menú y botón), listo para pintar. Memoizado por
 * petición. Un enlace sin texto o sin destino no sale.
 */
export const getCabecera = cache(
  async (): Promise<{ enlaces: EnlaceCabecera[]; boton: EnlaceCabecera | null }> => {
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
);
