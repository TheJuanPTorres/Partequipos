import type { LivePreviewConfig } from "payload";

/**
 * Dónde vive la vista previa en vivo de las fichas de producto. Es la única carpeta que puede
 * cargar `@payloadcms/live-preview-react`: lo vigila `livePreviewSoloEnRuta.test.ts`.
 */
export const CARPETA_VISTA_PREVIA = "src/app/(site)/vista-previa";

/** Las colecciones con vista previa en vivo: cada una tiene su ruta `/vista-previa/<coleccion>/<id>/`. */
export const COLECCIONES_VISTA_PREVIA = [
  "equipos-usados",
  "equipos-nuevos",
  "modelos-repuesto",
] as const;
export type ColeccionVistaPrevia = (typeof COLECCIONES_VISTA_PREVIA)[number];

export function esColeccionVistaPrevia(v: unknown): v is ColeccionVistaPrevia {
  return typeof v === "string" && (COLECCIONES_VISTA_PREVIA as readonly string[]).includes(v);
}

/** El id de un documento, solo si es un entero positivo (si no, `null`). */
export function idVistaPrevia(id: unknown): number | null {
  const n = typeof id === "number" ? id : Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** La dirección de la vista previa (relativa: el panel la completa con su origen). */
export function rutaVistaPrevia(coleccion: ColeccionVistaPrevia, id: unknown): string | null {
  const n = idVistaPrevia(id);
  return n ? `/vista-previa/${coleccion}/${n}/` : null;
}

/** La de una unidad usada (la primera que tuvo vista previa, #579). */
export function rutaVistaPreviaUsada(id: unknown): string | null {
  return rutaVistaPrevia("equipos-usados", id);
}

/**
 * `admin.livePreview` de una colección. Un documento sin guardar no tiene id, y entonces no hay
 * vista previa (el botón no sale). Medidas: las dos con las que se revisa todo el sitio.
 */
export function configVistaPrevia(coleccion: ColeccionVistaPrevia): LivePreviewConfig {
  return {
    url: ({ data }) => rutaVistaPrevia(coleccion, data?.id),
    breakpoints: [
      { label: "Móvil", name: "movil", width: 390, height: 844 },
      { label: "Escritorio", name: "escritorio", width: 1440, height: 900 },
    ],
  };
}

export const VISTA_PREVIA_USADA = configVistaPrevia("equipos-usados");
export const VISTA_PREVIA_NUEVA = configVistaPrevia("equipos-nuevos");
export const VISTA_PREVIA_MODELO = configVistaPrevia("modelos-repuesto");
