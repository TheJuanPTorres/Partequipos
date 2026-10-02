/**
 * IDENTIFICADORES DE POSTGRES DE MÁS DE 63 BYTES (2026-10-02).
 *
 * Postgres recorta en silencio cualquier identificador a 63 bytes
 * (`NAMEDATALEN − 1`): una tabla, columna, índice, clave foránea o enum con un
 * nombre más largo se CREA con otro nombre, solo con un NOTICE. El snapshot de
 * la migración guarda el nombre largo, así que después la estructura deja de
 * coincidir y un `DROP`/`ALTER` por nombre falla. Payload genera los nombres
 * juntando colección, campo y sufijos (`_rels`, `_fk`, `_idx`…), así que un
 * campo anidado con nombre largo basta para pasarse.
 *
 * Se revisa el SNAPSHOT (`src/migrations/*.json`), que es lo que drizzle va a
 * crear, y no el SQL de la migración: ahí también hay textos entre comillas
 * que no son identificadores.
 */
export const MAX_IDENTIFICADOR = 63;

type Snapshot = {
  tables?: Record<string, { name?: string } & Record<string, unknown>>;
  enums?: Record<string, { name?: string }>;
};

const SECCIONES = [
  "columns",
  "indexes",
  "foreignKeys",
  "uniqueConstraints",
  "compositePrimaryKeys",
  "checkConstraints",
] as const;

/** Todos los identificadores que el snapshot va a crear. */
export function identificadoresDe(snapshot: Snapshot): string[] {
  const ids = new Set<string>();
  for (const [clave, tabla] of Object.entries(snapshot.tables ?? {})) {
    ids.add(tabla.name ?? clave.replace(/^public\./, ""));
    for (const seccion of SECCIONES) {
      const grupo = tabla[seccion];
      if (!grupo || typeof grupo !== "object") continue;
      for (const [k, v] of Object.entries(grupo as Record<string, { name?: string }>)) {
        ids.add(v?.name ?? k);
      }
    }
  }
  for (const [clave, e] of Object.entries(snapshot.enums ?? {})) {
    ids.add(e.name ?? clave.replace(/^public\./, ""));
  }
  return [...ids];
}

/** Los que Postgres recortaría (más de 63 bytes en UTF-8). */
export function identificadoresLargos(snapshot: Snapshot): string[] {
  return identificadoresDe(snapshot).filter(
    (id) => Buffer.byteLength(id, "utf8") > MAX_IDENTIFICADOR,
  );
}
