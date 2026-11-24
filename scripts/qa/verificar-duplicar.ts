/**
 * Verificación POR EFECTO de «Duplicar» (tanda 21, tarea 3, fase 2, punto 10; `src/lib/fields/duplicar.ts`),
 * contra `development` o el preview (CLAUDE.md §10.15: se hace la operación y se lee la base).
 *
 *   npm run preview:ejecutar -- npx payload run scripts/qa/verificar-duplicar.ts
 *
 * Duplica la primera ficha de cada colección con la API local (la misma operación del botón del
 * panel), comprueba que la copia lleva «(copia)», una dirección libre y nace oculta (o en borrador)
 * y que el original no cambia, y BORRA la copia al terminar.
 */
import { getPayload, type CollectionSlug, type Payload } from "payload";

import { exigirBaseDePrueba } from "../../src/lib/db/basePrueba";

// Solo contra una base de prueba (development, el preview o local): se niega antes de conectar.
exigirBaseDePrueba("duplicar");
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

let fallos = 0;
const comprobar = (nombre: string, ok: boolean, detalle = "") => {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
};

type Doc = Record<string, unknown> & { id: number };
const CASOS: { coleccion: CollectionSlug; nombre: "nombre" | "titulo"; oculta: boolean }[] = [
  { coleccion: "equipos-nuevos", nombre: "nombre", oculta: true },
  { coleccion: "modelos-repuesto", nombre: "nombre", oculta: true },
  // Sin «Mostrar en la web»: nace en borrador.
  { coleccion: "articulos", nombre: "titulo", oculta: false },
  // Usadas: dirección y «Mostrar en la web» (comunes); el «(copia)» del nombre, tras el #533.
  { coleccion: "equipos-usados", nombre: "nombre", oculta: true },
];

for (const { coleccion, nombre, oculta } of CASOS) {
  const { docs } = await payload.find({ collection: coleccion, limit: 1, depth: 0, sort: "id" });
  const original = docs[0] as unknown as Doc | undefined;
  if (!original) {
    comprobar(`${coleccion}: hay una ficha que duplicar`, false);
    continue;
  }
  let copia: Doc | null = null;
  try {
    copia = (await payload.duplicate({
      collection: coleccion,
      id: original.id,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Doc;
    const conCopia = coleccion !== "equipos-usados";
    if (conCopia)
      comprobar(
        `${coleccion}: el nombre lleva «(copia)»`,
        copia[nombre] === `${String(original[nombre])} (copia)`,
        String(copia[nombre]),
      );
    comprobar(
      `${coleccion}: dirección libre y distinta`,
      typeof copia.slug === "string" && copia.slug.startsWith(`${String(original.slug)}-copia`),
      String(copia.slug),
    );
    if (oculta) comprobar(`${coleccion}: la copia nace oculta`, copia.mostrarEnWeb === false);
    else
      comprobar(
        `${coleccion}: la copia nace en borrador`,
        copia._status === "draft",
        String(copia._status),
      );
    const despues = (await payload.findByID({
      collection: coleccion,
      id: original.id,
      depth: 0,
    })) as unknown as Doc;
    comprobar(
      `${coleccion}: el original no cambia`,
      despues[nombre] === original[nombre] &&
        despues.slug === original.slug &&
        despues.mostrarEnWeb === original.mostrarEnWeb &&
        despues._status === original._status,
    );
  } catch (e) {
    comprobar(`${coleccion}: duplicar`, false, e instanceof Error ? e.message : String(e));
  } finally {
    if (copia) await payload.delete({ collection: coleccion, id: copia.id, overrideAccess: true });
  }
}
process.stdout.write(`${fallos} fallos\n`);
if (fallos) throw new Error(`[duplicar] ${fallos} fallos`);
