import { APIError, type CollectionBeforeOperationHook } from "payload";

import { borrarHuerfanoRechazado, llegoPorSubidaDirecta } from "../../lib/blob/huerfanoRechazado";
import { muestraDelFichero } from "../../lib/blob/muestraDelFichero";
import { REGLAS_SUBIDA_DIRECTA } from "../../lib/blob/subidaDirecta";

/**
 * Rechaza subidas a `documentos` que no sean un PDF POR CONTENIDO, o que pasen
 * del tope de tamaño, con mensajes en español. Mismo criterio que
 * `formatoDeVideoPermitido`: Payload solo valida `mimeTypes`, detrás y en
 * inglés.
 *
 * Qué se exige, y por qué:
 *
 * - **Un PDF completo**, con el mismo criterio que la validación de Payload 3.89
 *   (`validatePDF`, que va después y da el error en inglés): firma `%PDF-` en
 *   el byte 0 y, en el último KB, `%%EOF` y la tabla `xref`. Un fichero
 *   renombrado a `.pdf` no pasa; uno cortado a medias, tampoco.
 * - **Tope de 25 MB** con la SUBIDA DIRECTA al Blob (§10.39): el fichero ya no
 *   pasa por una función de Vercel. Una subida por la API sigue cortada en
 *   4,5 MB por Vercel antes de llegar aquí.
 *
 * SUBIDA DIRECTA: `req.file.data` llega vacío y el fichero está en un temporal
 * (`muestraDelFichero` lo lee). Si se rechaza, el fichero YA está en el Blob:
 * se borra, para no dejar huérfanos.
 */

export const TOPE_PDF_BYTES = REGLAS_SUBIDA_DIRECTA.documentos?.maximo ?? 25 * 1024 * 1024;

export type VeredictoPdf = "pdf" | "no-pdf" | "incompleto";

export function veredictoPdf(inicio: Buffer, final: Buffer = inicio): VeredictoPdf {
  if (inicio.subarray(0, 5).toString("latin1") !== "%PDF-") return "no-pdf";
  const cola = final.subarray(Math.max(0, final.length - 1024)).toString("latin1");
  return cola.includes("%%EOF") && cola.includes("xref") ? "pdf" : "incompleto";
}

export const formatoDePdfPermitido: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== "create" && operation !== "update") return args;

  const file = req.file;
  const muestra = muestraDelFichero(file, 1024);
  if (!file || !muestra) return args;
  const directa = llegoPorSubidaDirecta(file);

  const rechazar = async (mensaje: string): Promise<never> => {
    if (directa) await borrarHuerfanoRechazado(file.name);
    throw new APIError(mensaje, 400);
  };

  const v = veredictoPdf(muestra.inicio, muestra.final);
  if (v === "no-pdf") {
    await rechazar(
      `«${file.name}» no es un PDF. Si el nombre acaba en .pdf pero el contenido es de otro ` +
        `formato, también se rechaza.`,
    );
  }
  if (v === "incompleto") {
    await rechazar(
      `«${file.name}» parece un PDF dañado o incompleto. Hay que volver a exportarlo o descargarlo.`,
    );
  }

  if (muestra.tamano > TOPE_PDF_BYTES) {
    const mb = (muestra.tamano / (1024 * 1024)).toFixed(1).replace(".", ",");
    const tope = Math.round(TOPE_PDF_BYTES / (1024 * 1024));
    await rechazar(
      `«${file.name}» pesa ${mb} MB y el máximo es ${tope} MB. Hay que comprimirlo (por ejemplo, ` +
        `«Reducir tamaño» al exportar) y volver a subirlo.`,
    );
  }

  // El tamaño que se guarda es el REAL, no el que dijo el navegador.
  file.size = muestra.tamano;
  return args;
};
