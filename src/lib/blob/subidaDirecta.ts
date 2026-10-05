/**
 * SUBIDA DIRECTA AL BLOB DESDE EL NAVEGADOR (CLAUDE.md §10.39; propuesta del
 * 2026-10-05 aprobada por dirección). Lógica PURA, sin Node: la usan el
 * servidor (permiso de subida) y el navegador (aviso antes de subir).
 *
 * POR QUÉ: una subida normal del panel pasa por una función de Vercel, que corta
 * el cuerpo de la petición en 4,5 MB. Con `clientUploads` del adaptador, el
 * navegador sube el fichero DIRECTAMENTE al Blob con un permiso de un solo
 * uso, y la función solo recibe el nombre.
 *
 * Lo que el adaptador 3.89.0 NO protege, y se cierra aquí y en
 * `rutaSubidaDirecta.ts`:
 * - El permiso que firma no limita ni el TIPO ni el TAMAÑO, y permite
 *   SOBRESCRIBIR cualquier blob del almacén con el nombre que elija el
 *   navegador. Aquí: tipo y tope por colección, sin sobrescribir, sufijo
 *   aleatorio y un nombre de fichero simple.
 * - Su control de acceso por defecto es «tiene sesión». Aquí, además, tiene
 *   que poder CREAR en esa colección (lo comprueba el endpoint).
 */

export type ReglaDeSubida = {
  /** Tipos que el permiso de Vercel deja subir (lo comprueba Vercel). */
  tipos: string[];
  /** Tope en bytes (lo comprueba el navegador antes, Vercel al subir y el gancho después). */
  maximo: number;
  /** Extensión que tiene que llevar el nombre. */
  extension: RegExp;
  /** Cómo se llama el tipo en los mensajes. */
  nombreTipo: string;
};

const MB = 1024 * 1024;

/**
 * COLECCIONES CON SUBIDA DIRECTA (decisión de dirección del 2026-10-05).
 * `videos` se queda fuera: 4 MB por la vía de siempre.
 */
export const REGLAS_SUBIDA_DIRECTA: Readonly<Record<string, ReglaDeSubida>> = {
  documentos: {
    tipos: ["application/pdf"],
    maximo: 25 * MB,
    extension: /\.pdf$/i,
    nombreTipo: "un PDF",
  },
  media: {
    tipos: ["image/jpeg", "image/png", "image/webp"],
    maximo: 15 * MB,
    extension: /\.(jpe?g|png|webp)$/i,
    nombreTipo: "una imagen JPEG, PNG o WebP",
  },
};

/** Nombre aceptable: un solo segmento, sin rutas ni caracteres raros. */
const NOMBRE_SIMPLE = /^[\w.\- ()áéíóúñüÁÉÍÓÚÑÜ]{1,180}$/;

export type Permiso =
  | {
      ok: true;
      allowedContentTypes: string[];
      maximumSizeInBytes: number;
      addRandomSuffix: true;
      allowOverwrite: false;
    }
  | { ok: false; motivo: string };

/** Qué permiso de subida firmar para esa colección y ese nombre. */
export function permisoDeSubida(coleccion: string | null, nombre: string): Permiso {
  const regla = coleccion ? REGLAS_SUBIDA_DIRECTA[coleccion] : undefined;
  if (!regla)
    return { ok: false, motivo: `la colección «${coleccion ?? ""}» no admite subida directa` };
  if (!NOMBRE_SIMPLE.test(nombre) || nombre.startsWith(".")) {
    return { ok: false, motivo: "nombre de fichero no válido (sin carpetas ni caracteres raros)" };
  }
  if (!regla.extension.test(nombre)) return { ok: false, motivo: "extensión no permitida" };
  return {
    ok: true,
    allowedContentTypes: regla.tipos,
    maximumSizeInBytes: regla.maximo,
    addRandomSuffix: true,
    allowOverwrite: false,
  };
}

const enMb = (bytes: number) => (bytes / MB).toFixed(1).replace(".", ",").replace(/,0$/, "");

/**
 * EL AVISO DEL NAVEGADOR, ANTES DE PEDIR EL PERMISO (decisión de dirección):
 * tipo y tamaño, con nuestro texto. `null` si se puede subir. El tope de
 * Vercel queda como red de seguridad, y el gancho del servidor mira el
 * contenido después.
 */
export function avisoAntesDeSubir(
  coleccion: string,
  fichero: { name: string; type: string; size: number },
): string | null {
  const regla = REGLAS_SUBIDA_DIRECTA[coleccion];
  if (!regla) return null;
  if (!regla.tipos.includes(fichero.type) || !regla.extension.test(fichero.name)) {
    return `«${fichero.name}» no es ${regla.nombreTipo}. Elige un fichero de ese tipo.`;
  }
  if (fichero.size > regla.maximo) {
    return (
      `«${fichero.name}» pesa ${enMb(fichero.size)} MB y el máximo es ${enMb(regla.maximo)} MB. ` +
      `Redúcelo (por ejemplo, al exportarlo) y vuelve a intentarlo. No se ha subido nada.`
    );
  }
  if (!NOMBRE_SIMPLE.test(fichero.name) || fichero.name.startsWith(".")) {
    return `El nombre «${fichero.name}» tiene caracteres que no se admiten. Cámbialo y vuelve a intentarlo.`;
  }
  return null;
}
