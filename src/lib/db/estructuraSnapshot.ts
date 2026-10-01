/**
 * CONSULTA DE ESTRUCTURA desde un snapshot de drizzle-kit (CLAUDE.md §10.34).
 *
 * Genera una consulta de SOLO LECTURA que compara la base con el snapshot de la
 * última migración. **Cero filas = estructura idéntica.** Cubre columnas
 * (nombre, tipo, NOT NULL), índices (nombre, único), claves foráneas (nombre) y
 * enums (valores en orden). **No cubre** los valores por defecto.
 *
 * Es la misma consulta que se escribió a mano en el incidente de §10.34 y que
 * se validó en las dos direcciones; aquí la genera el código para que CI la
 * use en «migrar desde cero» (§10.33 p.5).
 */

type Columna = { name: string; type: string; notNull?: boolean; primaryKey?: boolean };
type Tabla = {
  name: string;
  columns: Record<string, Columna>;
  indexes?: Record<string, { name: string; isUnique?: boolean }>;
  foreignKeys?: Record<string, { name: string }>;
};
export type Snapshot = {
  tables: Record<string, Tabla>;
  enums?: Record<string, { name: string; values: string[] }>;
};

/** Tipo del snapshot → lo que devuelve `format_type` en Postgres. */
export function tipoPostgres(tipo: string): string {
  const t = tipo.trim();
  if (t === "serial") return "integer";
  if (t === "bigserial") return "bigint";
  if (t === "varchar") return "character varying";
  const varcharN = /^varchar\((\d+)\)$/.exec(t);
  if (varcharN) return `character varying(${varcharN[1]})`;
  return t;
}

const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
const valores = (filas: string[], vacia: string) =>
  filas.length ? `VALUES\n${filas.join(",\n")}` : vacia;

export function consultaEstructura(snapshot: Snapshot): string {
  const tablas = Object.values(snapshot.tables);
  const col = tablas.flatMap((t) =>
    Object.values(t.columns).map(
      (c) =>
        `(${lit(t.name)},${lit(c.name)},${lit(tipoPostgres(c.type))},${Boolean(c.notNull || c.primaryKey)})`,
    ),
  );
  const idx = tablas.flatMap((t) =>
    Object.values(t.indexes ?? {}).map(
      (i) => `(${lit(t.name)},${lit(i.name)},${Boolean(i.isUnique)})`,
    ),
  );
  const fk = tablas.flatMap((t) =>
    Object.values(t.foreignKeys ?? {}).map((f) => `(${lit(t.name)},${lit(f.name)})`),
  );
  const en = Object.values(snapshot.enums ?? {}).map(
    (e) => `(${lit(e.name)},${lit(e.values.join(","))})`,
  );
  return `WITH
esp_col(tabla, columna, tipo, no_nulo) AS (${valores(col, "SELECT NULL::text, NULL::text, NULL::text, NULL::boolean WHERE false")}),
real_col AS (
  SELECT c.relname AS tabla, a.attname AS columna,
         format_type(a.atttypid, a.atttypmod) AS tipo, a.attnotnull AS no_nulo
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped),
esp_idx(tabla, indice, unico) AS (${valores(idx, "SELECT NULL::text, NULL::text, NULL::boolean WHERE false")}),
real_idx AS (
  SELECT t.relname AS tabla, i.relname AS indice, x.indisunique AS unico
  FROM pg_index x
  JOIN pg_class i ON i.oid = x.indexrelid
  JOIN pg_class t ON t.oid = x.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public' AND NOT x.indisprimary),
esp_fk(tabla, nombre) AS (${valores(fk, "SELECT NULL::text, NULL::text WHERE false")}),
real_fk AS (
  SELECT t.relname AS tabla, k.conname AS nombre
  FROM pg_constraint k
  JOIN pg_class t ON t.oid = k.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public' AND k.contype = 'f'),
esp_enum(nombre, valores) AS (${valores(en, "SELECT NULL::text, NULL::text WHERE false")}),
real_enum AS (
  SELECT t.typname AS nombre, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS valores
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  GROUP BY t.typname)
SELECT 'columna' AS que, coalesce(e.tabla, r.tabla) || '.' || coalesce(e.columna, r.columna) AS donde,
       CASE WHEN r.columna IS NULL THEN 'FALTA en la base'
            WHEN e.columna IS NULL THEN 'SOBRA en la base'
            ELSE 'esperado ' || e.tipo || ' no_nulo=' || e.no_nulo || ' / base ' || r.tipo || ' no_nulo=' || r.no_nulo END AS detalle
FROM esp_col e FULL JOIN real_col r ON r.tabla = e.tabla AND r.columna = e.columna
WHERE r.columna IS NULL OR e.columna IS NULL OR r.tipo <> e.tipo OR r.no_nulo <> e.no_nulo
UNION ALL
SELECT 'indice', coalesce(e.tabla, r.tabla) || '.' || coalesce(e.indice, r.indice),
       CASE WHEN r.indice IS NULL THEN 'FALTA en la base' WHEN e.indice IS NULL THEN 'SOBRA en la base'
            ELSE 'unico esperado ' || e.unico || ' / base ' || r.unico END
FROM esp_idx e FULL JOIN real_idx r ON r.tabla = e.tabla AND r.indice = e.indice
WHERE r.indice IS NULL OR e.indice IS NULL OR r.unico <> e.unico
UNION ALL
SELECT 'clave foranea', coalesce(e.tabla, r.tabla) || '.' || coalesce(e.nombre, r.nombre),
       CASE WHEN r.nombre IS NULL THEN 'FALTA en la base' ELSE 'SOBRA en la base' END
FROM esp_fk e FULL JOIN real_fk r ON r.tabla = e.tabla AND r.nombre = e.nombre
WHERE r.nombre IS NULL OR e.nombre IS NULL
UNION ALL
SELECT 'enum', coalesce(e.nombre, r.nombre),
       CASE WHEN r.nombre IS NULL THEN 'FALTA en la base' WHEN e.nombre IS NULL THEN 'SOBRA en la base'
            ELSE 'esperado [' || e.valores || '] / base [' || r.valores || ']' END
FROM esp_enum e FULL JOIN real_enum r ON r.nombre = e.nombre
WHERE r.nombre IS NULL OR e.nombre IS NULL OR r.valores <> e.valores
ORDER BY 1, 2`;
}
