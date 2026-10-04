/**
 * TEXTO ALTERNATIVO FLOJO (mejora 2 de la auditoría del panel, accesibilidad
 * §7.6 de CLAUDE.md). Un `alt` como «foto1», «imagen» o el nombre del fichero
 * no le dice nada a quien usa un lector de pantalla ni a los buscadores.
 *
 * UNA sola regla para tres sitios: la validación del campo en `Media`, el aviso
 * de la lista de «Imágenes» y el recuento `npm run media:alt-flojos`.
 *
 * Función pura, sin dependencias: la importa también la config de Payload.
 */

/** Mínimo de letras para que un texto alternativo diga algo. */
export const MIN_LETRAS = 5;

/** Palabras que solas no describen nada. */
const GENERICAS = new Set([
  "imagen",
  "imagenes",
  "foto",
  "fotos",
  "fotografia",
  "image",
  "img",
  "photo",
  "picture",
  "pic",
  "logo",
  "banner",
  "captura",
  "screenshot",
  "dsc",
  "dscn",
  "pxl",
  "whatsapp",
]);

/** Minúsculas, sin tildes, separadores como espacios y sin espacios de más. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\s_\-.]+/g, " ")
    .trim();
}

/**
 * El nombre del fichero sin la extensión, con y sin el sufijo «-1» que añade
 * Payload cuando el nombre ya existe («mesa-de-trabajo-1» puede ser cualquiera).
 */
function nombresDelFichero(fichero: string): string[] {
  const sinExtension = fichero.replace(/\.[a-z0-9]{2,5}$/i, "");
  return [sinExtension, sinExtension.replace(/-\d+$/, "")].map(normalizar);
}

/**
 * Por qué un texto alternativo es flojo, en español y para el editor; `null` si
 * está bien.
 */
export function motivoAltFlojo(
  alt: string | null | undefined,
  fichero?: string | null,
): string | null {
  const texto = (alt ?? "").trim();
  if (!texto) return "Está vacío.";

  const letras = texto.match(/\p{L}/gu)?.length ?? 0;
  if (letras < MIN_LETRAS) {
    return `Es demasiado corto (${letras} ${letras === 1 ? "letra" : "letras"}).`;
  }

  const n = normalizar(texto);
  if (fichero && nombresDelFichero(fichero).includes(n)) {
    return "Es el nombre del fichero.";
  }

  // «foto», «IMG_1234», «DSC 0001», «imagen 3»…: palabras genéricas y números.
  const palabras = n.split(" ").filter((p) => !/^\d+$/.test(p));
  const sinNumeros = palabras.map((p) => p.replace(/\d+$/, ""));
  if (sinNumeros.length > 0 && sinNumeros.every((p) => GENERICAS.has(p))) {
    return "Es una palabra genérica: no dice qué se ve.";
  }
  return null;
}

/**
 * Validación del campo «Texto alternativo» de `Media` (Payload). El mensaje
 * dice el motivo y cómo arreglarlo.
 */
export function validarAlt(
  valor: unknown,
  { siblingData }: { siblingData?: { filename?: string | null } },
): true | string {
  const motivo = motivoAltFlojo(typeof valor === "string" ? valor : "", siblingData?.filename);
  if (!motivo) return true;
  return `${motivo} Describe lo que se ve, como se lo contarías a alguien por teléfono: p. ej. «Excavadora Hitachi ZX200 trabajando en una obra».`;
}
