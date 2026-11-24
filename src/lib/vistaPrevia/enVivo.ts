import type { LivePreviewConfig } from "payload";

/**
 * Dónde vive la vista previa en vivo de una unidad usada. Es la única ruta que puede cargar
 * `@payloadcms/live-preview-react`: lo vigila `livePreviewSoloEnRuta.test.ts`.
 */
export const CARPETA_VISTA_PREVIA = "src/app/(site)/vista-previa";

/** La dirección de la vista previa de una unidad usada (relativa: el panel la completa con su origen). */
export function rutaVistaPreviaUsada(id: unknown): string | null {
  const n = typeof id === "number" ? id : Number(id);
  return Number.isInteger(n) && n > 0 ? `/vista-previa/equipos-usados/${n}/` : null;
}

/**
 * `admin.livePreview` de «Equipos usados». Una unidad sin guardar no tiene id, y entonces no hay
 * vista previa (la pestaña no sale). Medidas: las dos con las que se revisa todo el sitio.
 */
export const VISTA_PREVIA_USADA: LivePreviewConfig = {
  url: ({ data }) => rutaVistaPreviaUsada(data?.id),
  breakpoints: [
    { label: "Móvil", name: "movil", width: 390, height: 844 },
    { label: "Escritorio", name: "escritorio", width: 1440, height: 900 },
  ],
};
