/**
 * AVISOS DE PAYLOAD ESCRITOS EN INGLÉS EN SU CÓDIGO (organización del panel, PR 10, 2026-11-19;
 * plan §7.3). Payload 3.89 lanza estos avisos emergentes con el texto fijo, sin pasar por su
 * traducción, así que `i18n.translations` no los alcanza. `TraducirAvisos` los cambia por estos al
 * mostrarse; cualquier otro aviso pasa igual.
 *
 * `avisosEnIngles.test.ts` falla si una actualización de Payload cambia o quita uno de estos textos
 * (entonces la traducción dejaría de aplicarse sin ningún error).
 */
export const AVISOS_EN_INGLES: Record<string, string> = {
  // `OrderableTable`: al arrastrar una fila con la lista ordenada por otra columna (el orden por arrastre de B).
  'To reorder the rows you must first sort them by the "Order" column':
    // Tanda 23 (dirección): las ordenables se abren ya por su arrastre; esto sale si se reordenó por otra columna.
    "La lista está ordenada por otra columna. Pulsa el icono ⇅ de la izquierda para volver al orden personalizado.",
  // Subidas y peticiones del panel.
  "Error making request": "No se pudo completar la petición. Inténtalo de nuevo.",
  "Error parsing response": "La respuesta del servidor no se pudo leer. Inténtalo de nuevo.",
  "Failed to fetch the file.": "No se pudo descargar el archivo.",
  "The provided URL is not allowed.": "Esa dirección no está permitida.",
};

/** El texto en español si es uno de los avisos fijos en inglés; si no, el mismo valor. */
export function traducirAviso<T>(mensaje: T): T | string {
  return typeof mensaje === "string" ? (AVISOS_EN_INGLES[mensaje] ?? mensaje) : mensaje;
}
