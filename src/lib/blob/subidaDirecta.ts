/**
 * SUBIDA DIRECTA AL BLOB DESDE EL NAVEGADOR — PROTOTIPO (estudio del
 * 2026-10-05, propuesta en `partequipos-cierre\propuestas\2026-10-05-subida-directa.md`).
 *
 * POR QUÉ: una subida normal del panel pasa por una función de Vercel, que corta
 * el cuerpo de la petición en 4,5 MB (CLAUDE.md §10.39). Con `clientUploads`
 * del adaptador, el navegador sube el fichero DIRECTAMENTE al Blob con un
 * permiso de un solo uso, y la función solo recibe el nombre.
 *
 * Lo que el adaptador 3.89.0 NO protege, y se cierra aquí (lógica pura):
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
  /** Tope en bytes (lo comprueba Vercel al subir y nuestro gancho después). */
  maximo: number;
  /** Extensión que tiene que llevar el nombre. */
  extension: RegExp;
};

const MB = 1024 * 1024;

/**
 * COLECCIONES CON SUBIDA DIRECTA. Solo documentos en el prototipo; vídeos e
 * imágenes son la propuesta, no están activados.
 */
export const REGLAS_SUBIDA_DIRECTA: Readonly<Record<string, ReglaDeSubida>> = {
  documentos: { tipos: ["application/pdf"], maximo: 25 * MB, extension: /\.pdf$/i },
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
