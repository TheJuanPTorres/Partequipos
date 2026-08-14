/**
 * Orden topológico de tablas según sus claves foráneas.
 *
 * POR QUÉ. Al restaurar hay que insertar los padres antes que los hijos: las
 * claves foráneas de Payload no son diferibles y no se pueden desactivar los
 * disparadores sin ser superusuario (en Neon no lo somos). Insertar en orden
 * alfabético falla en cuanto una tabla referencia a otra posterior.
 *
 * Función pura, para poder probar el caso feo —un ciclo— sin base de datos.
 */

export type Arista = { hija: string; padre: string };

/**
 * Devuelve las tablas ordenadas: primero las que no dependen de nadie.
 *
 * TOLERANTE A CICLOS a propósito. Una autorreferencia (`padre_id` apuntando a la
 * misma tabla) es legítima y forma un ciclo trivial; y un ciclo real entre dos
 * tablas no debe dejar sin restaurar el resto. En ambos casos se coloca lo que
 * quede al final, en orden estable, en vez de lanzar un error: una restauración
 * a medias es peor que una con un orden imperfecto, que como mucho falla ruidosa
 * en el `INSERT`.
 */
export function ordenTopologico(tablas: string[], aristas: Arista[]): string[] {
  const conjunto = new Set(tablas);

  // Dependencias: hija -> padres, ignorando autorreferencias y tablas ajenas.
  const padres = new Map<string, Set<string>>();
  for (const t of tablas) padres.set(t, new Set());

  for (const { hija, padre } of aristas) {
    if (!conjunto.has(hija) || !conjunto.has(padre)) continue;
    if (hija === padre) continue; // autorreferencia: no condiciona el orden
    padres.get(hija)?.add(padre);
  }

  const resuelto: string[] = [];
  const hecho = new Set<string>();

  /*
   * Se recorre en pasadas: en cada una entran las tablas cuyos padres ya están.
   * Es O(n²) en el peor caso, pero hablamos de decenas de tablas; la claridad
   * vale más aquí que el algoritmo óptimo.
   */
  let progreso = true;
  while (progreso && hecho.size < tablas.length) {
    progreso = false;
    for (const t of tablas) {
      if (hecho.has(t)) continue;
      const pendientes = [...(padres.get(t) ?? [])].filter((p) => !hecho.has(p));
      if (pendientes.length === 0) {
        resuelto.push(t);
        hecho.add(t);
        progreso = true;
      }
    }
  }

  // Lo que quede está en un ciclo: se añade al final, en orden estable.
  for (const t of tablas) if (!hecho.has(t)) resuelto.push(t);

  return resuelto;
}
