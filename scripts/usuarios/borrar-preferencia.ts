/**
 * Borra UNA fila de `payload-preferences` por su id, y enseña lo que borró.
 *
 * Uso:  PREF_ID=12 npm run prefs:borrar
 *
 * POR QUÉ POR ID Y NO POR CLAVE. El borrado que trae Payload
 * (`DELETE /api/payload-preferences/:key`) usa `deleteOne` con un `where` de
 * clave y usuario, **sin orden garantizado**: con filas duplicadas no se sabe
 * cuál cae. Este script exige el id exacto que imprime `npm run prefs:menu`.
 *
 * Es una ESCRITURA. Se ejecuta contra la base que indique `DATABASE_URI`;
 * comprueba el host que imprime antes de confiar en lo que hizo.
 */
process.env.PAYLOAD_DISABLE_PUSH = "true";

const { default: config } = await import("../../src/payload.config");

import { getPayload } from "payload";

const ID = process.env.PREF_ID?.trim();

if (!ID) {
  console.error("✗ Falta PREF_ID. Saca el id con `npm run prefs:menu`.");
  process.exit(1);
}

const payload = await getPayload({ config });

const host = (() => {
  try {
    return new URL(process.env.DATABASE_URI ?? "").hostname || "(sin DATABASE_URI)";
  } catch {
    return "(DATABASE_URI no parseable)";
  }
})();
console.log(`Base: ${host}\n`);

const fila = await payload
  .findByID({
    collection: "payload-preferences",
    id: ID,
    depth: 0,
    overrideAccess: true,
  })
  .catch(() => null);

if (!fila) {
  console.error(`✗ No existe la fila ${ID} en payload-preferences. No se borró nada.`);
  process.exit(1);
}

console.log(`Va a borrar la fila ${ID}:`);
console.log(`  clave  : ${(fila as { key?: string }).key}`);
console.log(`  usuario: ${JSON.stringify((fila as { user?: unknown }).user)}`);
console.log(`  valor  : ${JSON.stringify((fila as { value?: unknown }).value)}\n`);

await payload.delete({
  collection: "payload-preferences",
  id: ID,
  overrideAccess: true,
});

const restantes = await payload.find({
  collection: "payload-preferences",
  depth: 0,
  limit: 0,
  overrideAccess: true,
  where: { key: { equals: (fila as { key?: string }).key } },
});

console.log(
  `✓ Borrada. Filas restantes con la clave «${(fila as { key?: string }).key}»: ${restantes.totalDocs}`,
);
for (const r of restantes.docs) {
  console.log(`  fila ${r.id}: ${JSON.stringify((r as { value?: unknown }).value)}`);
}

process.exit(0);
