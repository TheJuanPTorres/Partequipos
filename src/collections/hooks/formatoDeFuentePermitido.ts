import { APIError, type CollectionBeforeOperationHook } from "payload";

/**
 * Rechaza subidas a `fuentes` que no sean una fuente web que el sitio sepa
 * servir, con mensajes en español. Mismo criterio que
 * `formatoDeAnimacionPermitido`: se mira el CONTENIDO (la firma de los
 * primeros bytes), no solo la extensión.
 *
 * - **WOFF2** (`wOF2`), la recomendada: la más ligera.
 * - **WOFF** (`wOFF`) y **TTF** (`00 01 00 00` o `true`): pesan más, pero se
 *   aceptan porque es lo que suelen entregar. **OTF** (`OTTO`, OpenType con
 *   contornos CFF) entra como TTF: para `@font-face`, `truetype` y `opentype`
 *   son el mismo formato (CSS Fonts 4), y el navegador lee el contenido.
 *
 * **EL TIPO MIME SE DECIDE AQUÍ, NO EN EL NAVEGADOR (2026-10-19).** Payload
 * 3.89 guarda en `mimeType` el tipo que manda el navegador
 * (`generateFileData`, para lo que no es imagen) y lo valida contra
 * `upload.mimeTypes`. Chrome en Windows lo saca del registro del sistema, y
 * para `.woff2` y `.ttf` manda vacío o `application/octet-stream`: el panel
 * rechazaba la Anton en WOFF2 con «Tipo de archivo inválido» (campo «MIME
 * Type»). Este gancho corre antes que `generateFileData` y sustituye
 * `req.file.mimetype` por el de la firma.
 * - **Tope de 4 MB**, por el límite de las funciones de Vercel (4,5 MB de
 *   cuerpo, CLAUDE.md §10.39). Una fuente web pesa decenas de kB.
 */

export const TOPE_FUENTE_BYTES = 4 * 1024 * 1024;

export type FormatoFuente = "woff2" | "woff" | "truetype";

type Firma = { formato: FormatoFuente; mime: string; extensiones: string[]; nombre: string };

/** Formato, tipo MIME y extensiones admitidas por la firma del fichero, o `null`. */
export function firmaDeFuente(b: Buffer): Firma | null {
  if (b.length < 12) return null;
  const firma = b.subarray(0, 4).toString("latin1");
  if (firma === "wOF2")
    return { formato: "woff2", mime: "font/woff2", extensiones: [".woff2"], nombre: "WOFF2" };
  if (firma === "wOFF")
    return { formato: "woff", mime: "font/woff", extensiones: [".woff"], nombre: "WOFF" };
  if (firma === "true" || b.readUInt32BE(0) === 0x00010000)
    return { formato: "truetype", mime: "font/ttf", extensiones: [".ttf"], nombre: "TTF" };
  if (firma === "OTTO")
    return { formato: "truetype", mime: "font/otf", extensiones: [".otf", ".ttf"], nombre: "OTF" };
  return null;
}

/** Formato de `@font-face` por la firma del fichero, o `null` si no es una fuente admitida. */
export function formatoDeFuente(b: Buffer): FormatoFuente | null {
  return firmaDeFuente(b)?.formato ?? null;
}

export type VeredictoFuente =
  { valido: true; formato: FormatoFuente; mime: string } | { valido: false; motivo: string };

export function veredictoFuente(nombre: string, b: Buffer): VeredictoFuente {
  if (b.length > TOPE_FUENTE_BYTES) {
    const mb = (b.length / (1024 * 1024)).toFixed(1).replace(".", ",");
    return { valido: false, motivo: `pesa ${mb} MB y el máximo es 4 MB` };
  }
  const f = firmaDeFuente(b);
  if (!f) {
    return { valido: false, motivo: "no es una fuente WOFF2, WOFF, TTF ni OTF" };
  }
  const n = nombre.toLowerCase();
  if (!f.extensiones.some((e) => n.endsWith(e))) {
    return {
      valido: false,
      motivo: `es una fuente ${f.nombre}, pero el nombre no acaba en ${f.extensiones.join(" ni ")}`,
    };
  }
  return { valido: true, formato: f.formato, mime: f.mime };
}

export const formatoDeFuentePermitido: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (operation !== "create" && operation !== "update") return args;

  const file = req.file;
  if (!file?.data || !Buffer.isBuffer(file.data) || file.data.length === 0) return args;

  const v = veredictoFuente(file.name, file.data);
  if (!v.valido) throw new APIError(`«${file.name}» ${v.motivo}.`, 400);

  // El tipo correcto, no el del navegador: es el que Payload guarda y valida.
  file.mimetype = v.mime;

  const datos = args.data as Record<string, unknown> | undefined;
  if (datos) Object.assign(datos, { formato: v.formato });
  return args;
};
