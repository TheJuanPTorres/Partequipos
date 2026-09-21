/**
 * La DECISIÓN del guardián de migraciones (`npm run db:check`), separada de su
 * acceso a la base.
 *
 * POR QUÉ ESTÁ AQUÍ Y NO DENTRO DEL SCRIPT. El guardián corta el build si
 * encuentra el marcador `dev` (batch −1) en `payload_migrations`, que es lo que
 * deja un push de esquema de desarrollo (CLAUDE.md §10.9). Para comprobar que
 * **de verdad corta** habría que plantar ese marcador en una base real: un
 * efecto secundario sobre `production`, `preview` o `development`, justo lo que
 * el guardián existe para evitar.
 *
 * Con la decisión en una función pura se prueba con filas inventadas y sin
 * tocar ninguna base. Lo que queda sin cubrir por pruebas es la consulta SQL y
 * el `to_regclass`, que es acceso a datos, no criterio.
 */

/** Batch que `pushDevSchema` inserta al hacer push de esquema. */
export const MARCADOR_DEV = -1;

export type FilaMigracion = { batch: number | string; name: string };

export type VeredictoMigraciones = {
  /** Migraciones realmente aplicadas, en orden. */
  aplicadas: FilaMigracion[];
  /** Código de salida del script: 0 sigue, 1 aborta el build. */
  codigo: 0 | 1;
  /** Marcadores `dev` encontrados. Si hay alguno, se aborta. */
  marcadores: FilaMigracion[];
  motivo:
    | "base-nueva-sin-tabla"
    | "hay-marcador-dev"
    | "sin-marcador-dev";
};

/**
 * `filas` es el contenido de `payload_migrations`, o `null` si la tabla no
 * existe —una base recién creada, que sí se puede migrar—.
 *
 * `batch` llega como número o como cadena según el driver, así que se normaliza
 * con `Number` antes de comparar: `"-1" === -1` es `false`, y ese descuido
 * dejaría pasar el marcador sin avisar.
 */
export function veredictoMigraciones(filas: FilaMigracion[] | null): VeredictoMigraciones {
  if (filas === null) {
    return {
      aplicadas: [],
      codigo: 0,
      marcadores: [],
      motivo: "base-nueva-sin-tabla",
    };
  }

  const marcadores = filas.filter((f) => Number(f.batch) === MARCADOR_DEV);
  const aplicadas = filas.filter((f) => Number(f.batch) > 0);

  return {
    aplicadas,
    codigo: marcadores.length > 0 ? 1 : 0,
    marcadores,
    motivo: marcadores.length > 0 ? "hay-marcador-dev" : "sin-marcador-dev",
  };
}
