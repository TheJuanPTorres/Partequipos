/**
 * Política de retención de respaldos (abuelo-padre-hijo).
 *
 * Lo que compromete el documento de Gestión de Incidencias entregado al cliente:
 *
 *   diarios   30 días
 *   semanales  3 meses
 *   mensuales 12 meses
 *
 * Función PURA a propósito: recibe la lista de fechas y devuelve qué se conserva
 * y qué se borra. Sin tocar disco ni red, se puede probar el caso que de verdad
 * importa —que no borre de más— sin generar cientos de ficheros.
 */

export type Politica = {
  /** Días hacia atrás en los que se conserva un respaldo por día. */
  diasDiarios: number;
  /** Días hacia atrás en los que se conserva uno por semana. */
  diasSemanales: number;
  /** Días hacia atrás en los que se conserva uno por mes. */
  diasMensuales: number;
};

/** La del SLA: 30 días, 3 meses, 12 meses. */
export const POLITICA_SLA: Politica = {
  diasDiarios: 30,
  diasSemanales: 90,
  diasMensuales: 365,
};

const DIA_MS = 24 * 60 * 60 * 1000;

/** Clave del día en UTC: `2026-08-13`. */
function claveDia(f: Date): string {
  return f.toISOString().slice(0, 10);
}

/** Clave de la semana ISO: `2026-W33`. Agrupa de lunes a domingo. */
function claveSemana(f: Date): string {
  const d = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate()));
  // Jueves de esa semana: define el año ISO al que pertenece.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d.getTime() - inicioAno.getTime()) / DIA_MS + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

/** Clave del mes: `2026-08`. */
function claveMes(f: Date): string {
  return f.toISOString().slice(0, 7);
}

export type Decision<T> = {
  conservar: T[];
  borrar: T[];
};

/**
 * Decide qué respaldos se conservan.
 *
 * Reglas, en este orden:
 *  1. Dentro de la ventana diaria: se conserva **el más reciente de cada día**.
 *  2. Dentro de la semanal: el más reciente de cada semana ISO.
 *  3. Dentro de la mensual: el más reciente de cada mes.
 *  4. Fuera de todo: se borra.
 *
 * Un mismo respaldo puede satisfacer varias reglas (el del lunes es a la vez el
 * diario, el semanal y quizá el mensual); se cuenta una sola vez.
 *
 * **El más reciente NUNCA se borra**, aunque la política diga lo contrario: es
 * la última línea de defensa y perderlo por un reloj mal puesto sería absurdo.
 */
export function decidirRetencion<T extends { fecha: Date }>(
  respaldos: T[],
  ahora: Date = new Date(),
  politica: Politica = POLITICA_SLA,
): Decision<T> {
  if (respaldos.length === 0) return { conservar: [], borrar: [] };

  // Del más reciente al más antiguo: el primero de cada grupo es su representante.
  const ordenados = [...respaldos].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  /** Días de antigüedad. Una fecha futura (reloj desajustado) cuenta como hoy. */
  const edadDias = (r: T) => Math.max(0, (ahora.getTime() - r.fecha.getTime()) / DIA_MS);

  /**
   * Representantes de un nivel: el más reciente de cada grupo, entre los que
   * caen dentro de su ventana.
   *
   * Cada nivel se calcula POR SEPARADO y luego se unen. Es la diferencia con el
   * primer intento, que iba en cascada y "promocionaba" a representante semanal
   * un respaldo que ya había perdido su hueco diario — conservando de más.
   */
  const representantes = (ventanaDias: number, clave: (f: Date) => string): Set<T> => {
    const vistos = new Set<string>();
    const elegidos = new Set<T>();
    for (const r of ordenados) {
      if (edadDias(r) > ventanaDias) continue;
      const k = clave(r.fecha);
      if (vistos.has(k)) continue;
      vistos.add(k);
      elegidos.add(r);
    }
    return elegidos;
  };

  const conservar = new Set<T>([
    ...representantes(politica.diasDiarios, claveDia),
    ...representantes(politica.diasSemanales, claveSemana),
    ...representantes(politica.diasMensuales, claveMes),
  ]);

  // El más reciente, pase lo que pase: es la última línea de defensa.
  const masReciente = ordenados[0];
  if (masReciente) conservar.add(masReciente);

  return {
    conservar: ordenados.filter((r) => conservar.has(r)),
    borrar: ordenados.filter((r) => !conservar.has(r)),
  };
}

/**
 * Nombre de fichero de un respaldo: `partequipos-<entorno>-<marca-temporal>.ndjson.gz`.
 *
 * La marca temporal va en UTC y con el formato `YYYYMMDD-HHMMSS`, que ordena
 * alfabéticamente igual que cronológicamente — así `ls` ya sale en orden.
 */
export function nombreRespaldo(entorno: string, fecha: Date = new Date()): string {
  const iso = fecha.toISOString();
  const marca = `${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 19).replace(/:/g, "")}`;
  const limpio = entorno.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "desconocido";
  return `partequipos-${limpio}-${marca}.ndjson.gz`;
}

/** Extrae la fecha de un nombre generado por `nombreRespaldo`. `null` si no encaja. */
export function fechaDeNombre(nombre: string): Date | null {
  const m = nombre.match(/-(\d{8})-(\d{6})\.ndjson\.gz$/);
  if (!m) return null;
  const [, d, h] = m;
  if (!d || !h) return null;
  const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${h.slice(0, 2)}:${h.slice(2, 4)}:${h.slice(4, 6)}.000Z`;
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
