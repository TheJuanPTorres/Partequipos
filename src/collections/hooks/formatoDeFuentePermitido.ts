import { APIError, type CollectionBeforeOperationHook } from "payload";

/**
 * Rechaza subidas a `fuentes` que no sean una fuente web que el sitio sepa
 * servir, con mensajes en español. Mismo criterio que
 * `formatoDeAnimacionPermitido`: se mira el CONTENIDO (la firma de los
 * primeros bytes), no solo la extensión.
 *
 * - **WOFF2** (`wOF2`), la recomendada: la más ligera.
 * - **WOFF** (`wOFF`) y **TTF** (`00 01 00 00` o `true`): pesan más, pero se
 *   aceptan porque es lo que suelen entregar.
 * - **Tope de 4 MB**, por el límite de las funciones de Vercel (4,5 MB de
 *   cuerpo, CLAUDE.md §10.39). Una fuente web pesa decenas de kB.
 */

export const TOPE_FUENTE_BYTES = 4 * 1024 * 1024;

export type FormatoFuente = "woff2" | "woff" | "truetype";

/** Formato de `@font-face` por la firma del fichero, o `null` si no es una fuente admitida. */
export function formatoDeFuente(b: Buffer): FormatoFuente | null {
  if (b.length < 12) return null;
  const firma = b.subarray(0, 4).toString("latin1");
  if (firma === "wOF2") return "woff2";
  if (firma === "wOFF") return "woff";
  if (firma === "true" || b.readUInt32BE(0) === 0x00010000) return "truetype";
  return null;
}

const EXTENSIONES: Record<FormatoFuente, string> = {
  woff2: ".woff2",
  woff: ".woff",
  truetype: ".ttf",
};

export type VeredictoFuente =
  { valido: true; formato: FormatoFuente } | { valido: false; motivo: string };

export function veredictoFuente(nombre: string, b: Buffer): VeredictoFuente {
  if (b.length > TOPE_FUENTE_BYTES) {
    const mb = (b.length / (1024 * 1024)).toFixed(1).replace(".", ",");
    return { valido: false, motivo: `pesa ${mb} MB y el máximo es 4 MB` };
  }
  const formato = formatoDeFuente(b);
  if (!formato) {
    return {
      valido: false,
      motivo: "no es una fuente WOFF2, WOFF ni TTF (otros formatos, como OTF, no se admiten)",
    };
  }
  if (!nombre.toLowerCase().endsWith(EXTENSIONES[formato])) {
    return {
      valido: false,
      motivo: `es una fuente ${formato === "truetype" ? "TTF" : formato.toUpperCase()}, pero el nombre no acaba en ${EXTENSIONES[formato]}`,
    };
  }
  return { valido: true, formato };
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

  const datos = args.data as Record<string, unknown> | undefined;
  if (datos) Object.assign(datos, { formato: v.formato });
  return args;
};
