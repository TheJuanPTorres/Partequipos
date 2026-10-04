import { APIError, type CollectionBeforeOperationHook } from "payload";

/**
 * Rechaza subidas a `animaciones` que no sean una animación Lottie que el
 * sitio pueda pintar, con mensajes en español. Mismo criterio que
 * `formatoDeVideoPermitido`: Payload solo mira `mimeTypes`, y un JSON no tiene
 * firma de contenido (lo reconoce por la extensión, `getFileTypeFallback`), así
 * que sin esto entraría cualquier JSON.
 *
 * Qué se exige, y por qué:
 *
 * - **JSON con forma de Lottie**: `w`, `h`, `fr`, `ip` < `op` y `layers`.
 * - **Sin expresiones.** El sitio carga la versión LIGERA de lottie-web
 *   (`lottie_light`), que no las ejecuta: una animación con expresiones se
 *   pintaría mal sin dar error. Además, ejecutarlas exige `eval`.
 * - **Sin recursos externos.** Una imagen enlazada por ruta (`assets[].p` sin
 *   `data:`) la pediría el navegador a otro sitio. Solo se admiten embebidas.
 * - **Tope de 4 MB**, por el mismo límite de las funciones de Vercel que los
 *   vídeos (4,5 MB de cuerpo).
 *
 * De paso deja en `data` el ancho y el alto de la animación: el componente los
 * usa para reservar la caja (sin CLS) cuando no hay imagen fija.
 */

export const TOPE_ANIMACION_BYTES = 4 * 1024 * 1024;

export type VeredictoLottie =
  | { valido: true; ancho: number; alto: number; duracionSeg: number }
  | { valido: false; motivo: string };

function esNumeroPositivo(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/** Una propiedad animada con expresión lleva `x` con el código como texto. */
function tieneExpresiones(nodo: unknown): boolean {
  if (Array.isArray(nodo)) return nodo.some(tieneExpresiones);
  if (!nodo || typeof nodo !== "object") return false;
  for (const [clave, valor] of Object.entries(nodo)) {
    if (clave === "x" && typeof valor === "string" && valor.trim() !== "") return true;
    if (typeof valor === "object" && tieneExpresiones(valor)) return true;
  }
  return false;
}

export function veredictoLottie(b: Buffer): VeredictoLottie {
  if (b.length > TOPE_ANIMACION_BYTES) {
    const mb = (b.length / (1024 * 1024)).toFixed(1).replace(".", ",");
    return { valido: false, motivo: `pesa ${mb} MB y el máximo es 4 MB` };
  }
  let j: unknown;
  try {
    j = JSON.parse(b.toString("utf8"));
  } catch {
    return { valido: false, motivo: "no es un JSON válido" };
  }
  if (!j || typeof j !== "object" || Array.isArray(j)) {
    return { valido: false, motivo: "no es una animación Lottie" };
  }
  const a = j as Record<string, unknown>;
  const ip = typeof a.ip === "number" ? a.ip : NaN;
  const op = typeof a.op === "number" ? a.op : NaN;
  if (
    !esNumeroPositivo(a.w) ||
    !esNumeroPositivo(a.h) ||
    !esNumeroPositivo(a.fr) ||
    !(op > ip) ||
    !Array.isArray(a.layers) ||
    a.layers.length === 0
  ) {
    return {
      valido: false,
      motivo: "no es una animación Lottie (faltan el tamaño, los fotogramas o las capas)",
    };
  }
  if (tieneExpresiones(a.layers) || tieneExpresiones(a.assets)) {
    return {
      valido: false,
      motivo:
        "usa expresiones, que el sitio no ejecuta. Hay que exportarla sin expresiones (en Bodymovin, convirtiéndolas en fotogramas clave)",
    };
  }
  const externos = (Array.isArray(a.assets) ? a.assets : []).filter(
    (r): r is { p: string } =>
      !!r &&
      typeof r === "object" &&
      typeof (r as { p?: unknown }).p === "string" &&
      !(r as { p: string }).p.startsWith("data:"),
  );
  if (externos.length > 0) {
    return {
      valido: false,
      motivo:
        "enlaza imágenes externas. Hay que exportarla con las imágenes incluidas en el propio fichero",
    };
  }
  return {
    valido: true,
    ancho: Math.round(a.w as number),
    alto: Math.round(a.h as number),
    duracionSeg: (op - ip) / (a.fr as number),
  };
}

export const formatoDeAnimacionPermitido: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (operation !== "create" && operation !== "update") return args;

  const file = req.file;
  if (!file?.data || !Buffer.isBuffer(file.data) || file.data.length === 0) return args;

  if (!file.name.toLowerCase().endsWith(".json")) {
    throw new APIError(`«${file.name}» no es un fichero .json de animación Lottie.`, 400);
  }
  const v = veredictoLottie(file.data);
  if (!v.valido) throw new APIError(`«${file.name}» ${v.motivo}.`, 400);

  const datos = args.data as Record<string, unknown> | undefined;
  if (datos) Object.assign(datos, { ancho: v.ancho, alto: v.alto });
  return args;
};
