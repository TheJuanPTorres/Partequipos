import { APIError, type CollectionBeforeOperationHook } from "payload";

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
 * - **Tope de 4 MB**: la subida del panel pasa por una función de Vercel, que
 *   corta el cuerpo en 4,5 MB (el mismo límite que los vídeos). Una ficha
 *   técnica de fabricante cabe de sobra; si no, hay que comprimirla.
 */

export const TOPE_PDF_BYTES = 4 * 1024 * 1024;

export type VeredictoPdf = "pdf" | "no-pdf" | "incompleto";

export function veredictoPdf(b: Buffer): VeredictoPdf {
  if (b.subarray(0, 5).toString("latin1") !== "%PDF-") return "no-pdf";
  const final = b.subarray(Math.max(0, b.length - 1024)).toString("latin1");
  return final.includes("%%EOF") && final.includes("xref") ? "pdf" : "incompleto";
}

export const formatoDePdfPermitido: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== "create" && operation !== "update") return args;

  const file = req.file;
  if (!file?.data || !Buffer.isBuffer(file.data) || file.data.length === 0) return args;

  const v = veredictoPdf(file.data);
  if (v === "no-pdf") {
    throw new APIError(
      `«${file.name}» no es un PDF. Si el nombre acaba en .pdf pero el contenido es de otro ` +
        `formato, también se rechaza.`,
      400,
    );
  }
  if (v === "incompleto") {
    throw new APIError(
      `«${file.name}» parece un PDF dañado o incompleto. Hay que volver a exportarlo o descargarlo.`,
      400,
    );
  }

  if (file.data.length > TOPE_PDF_BYTES) {
    const mb = (file.data.length / (1024 * 1024)).toFixed(1).replace(".", ",");
    throw new APIError(
      `«${file.name}» pesa ${mb} MB y el máximo es 4 MB. Hay que comprimirlo (por ejemplo, ` +
        `«Reducir tamaño» al exportar) y volver a subirlo.`,
      400,
    );
  }

  return args;
};
