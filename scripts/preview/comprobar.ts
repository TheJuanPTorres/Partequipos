/**
 * `npm run preview:comprobar`: dice SOLO el host de la base, el almacén del
 * Blob y si hay secreto de bypass. Falla (código 1) si el fichero apunta a
 * producción o no es el preview. Nunca imprime un valor secreto.
 */
import fs from "node:fs";
import path from "node:path";

import {
  FICHERO_ENTORNO_PREVIEW,
  leerFicheroEntorno,
  veredictoEntornoPreview,
} from "../../src/lib/preview/entornoPreview";

const fichero = path.resolve(FICHERO_ENTORNO_PREVIEW);
if (!fs.existsSync(fichero)) {
  console.error(`✗ Falta ${FICHERO_ENTORNO_PREVIEW} en la raíz del repo.`);
  process.exit(1);
}
const v = veredictoEntornoPreview(leerFicheroEntorno(fs.readFileSync(fichero, "utf8")));
console.log(`base   : ${v.host ?? "(vacía)"}`);
console.log(`almacén: ${v.almacen ?? "(vacío)"}`);
if (!v.valido) {
  console.error(`✗ NO válido: ${v.motivo}`);
  process.exit(1);
}
console.log(`bypass : ${v.bypass}`);
console.log("✓ Entorno del preview");
