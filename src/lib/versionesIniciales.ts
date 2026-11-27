import { COLECCIONES_CON_BORRADORES } from "./borradores";

/**
 * LA VERSIÓN INICIAL QUE FALTA (2026-11-26, Juan Pablo; urgente). Con borradores, la lista del
 * panel de Payload 3.89 pide `find` pidiendo borradores (`draft` a verdadero), que lee la tabla de versiones (`_<col>_v`)
 * con `latest = true`: un documento SIN ninguna versión no sale en la lista. Las migraciones que
 * activaron los borradores (artículos, #521; páginas, #528) no crearon versiones, así que lo
 * importado antes solo aparece después de que alguien lo guarde en el panel.
 *
 * `scripts/paginas/versiones-iniciales.ts` crea, para cada documento que no tenga NINGUNA versión,
 * una copia de sí mismo como versión (la que haría Payload al guardarlo). Aquí, lo que decide qué
 * se crea y qué se puede borrar al revertir, sin base ni Payload (con pruebas).
 */
export type ColeccionConBorradores = (typeof COLECCIONES_CON_BORRADORES)[number];

export type Id = number | string;

/** Los documentos sin ninguna versión, en el orden en que llegan. */
export function sinVersion(docs: readonly Id[], padresConVersion: Iterable<Id>): Id[] {
  const con = new Set([...padresConVersion].map(String));
  return docs.filter((id) => !con.has(String(id)));
}

/** Lo que crea una pasada: por colección, el documento y la versión creada. */
export type Manifiesto = {
  creado: string;
  versiones: { coleccion: ColeccionConBorradores; documento: Id; version: Id }[];
};

/** Valida un manifiesto leído de un fichero: solo colecciones con borradores e ids presentes. */
export function leerManifiesto(datos: unknown): Manifiesto {
  if (!datos || typeof datos !== "object") throw new Error("Manifiesto vacío o no es un objeto.");
  const { creado, versiones } = datos as Partial<Manifiesto>;
  if (typeof creado !== "string") throw new Error("Manifiesto sin «creado».");
  if (!Array.isArray(versiones)) throw new Error("Manifiesto sin «versiones».");
  for (const v of versiones) {
    if (!COLECCIONES_CON_BORRADORES.includes(v?.coleccion as ColeccionConBorradores)) {
      throw new Error(`Colección no admitida en el manifiesto: ${String(v?.coleccion)}`);
    }
    for (const campo of ["documento", "version"] as const) {
      const valor = v[campo];
      if (!(typeof valor === "number" || (typeof valor === "string" && valor !== ""))) {
        throw new Error(`Entrada del manifiesto sin «${campo}».`);
      }
    }
  }
  return { creado, versiones };
}

/**
 * Las versiones del manifiesto que se pueden borrar al revertir: solo las que siguen existiendo Y
 * pertenecen al mismo documento que dice el manifiesto (si no, alguien tocó la base: no se borra).
 */
export function borrables(
  manifiesto: Manifiesto,
  coleccion: ColeccionConBorradores,
  existentes: readonly { id: Id; parent: Id }[],
): Id[] {
  const padreDe = new Map(existentes.map((v) => [String(v.id), String(v.parent)]));
  return manifiesto.versiones
    .filter(
      (v) => v.coleccion === coleccion && padreDe.get(String(v.version)) === String(v.documento),
    )
    .map((v) => v.version);
}
