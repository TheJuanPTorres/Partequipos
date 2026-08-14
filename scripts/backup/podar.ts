/**
 * Aplica la política de retención a la carpeta de respaldos.
 *
 * Uso:  npm run backup:prune              (enseña qué borraría; NO borra)
 *       BACKUP_PODAR=true npm run backup:prune   (borra de verdad)
 *
 * BORRA EN SECO POR DEFECTO. Un script de limpieza que borra a la primera y sin
 * avisar es la forma más rápida de perder el respaldo que hacía falta. Hay que
 * pedir el borrado explícitamente.
 *
 * La decisión de qué se conserva vive en `src/lib/backup/retencion.ts`, que es
 * una función pura y está probada; aquí solo se lee el directorio y se borra.
 */
import fs from "node:fs";
import path from "node:path";

import { POLITICA_SLA, decidirRetencion, fechaDeNombre } from "../../src/lib/backup/retencion";

const DIRECTORIO = process.env.BACKUP_DIR || "respaldos";
const BORRAR = process.env.BACKUP_PODAR === "true";

if (!fs.existsSync(DIRECTORIO)) {
  console.error(`✗ No existe el directorio de respaldos: ${DIRECTORIO}`);
  process.exit(1);
}

const ficheros = fs
  .readdirSync(DIRECTORIO)
  .filter((n) => n.endsWith(".ndjson.gz"))
  .flatMap((nombre) => {
    const fecha = fechaDeNombre(nombre);
    // Un fichero con nombre ajeno NO se toca: puede ser de otra herramienta.
    return fecha ? [{ nombre, fecha, ruta: path.join(DIRECTORIO, nombre) }] : [];
  });

const { conservar, borrar } = decidirRetencion(ficheros, new Date(), POLITICA_SLA);

const tam = (r: string) => fs.statSync(r).size;
const mb = (b: number) => (b / 1024 / 1024).toFixed(2);

console.log("\n=========== RETENCIÓN ===========");
console.log(`Directorio : ${DIRECTORIO}`);
console.log(
  `Política   : ${POLITICA_SLA.diasDiarios} días · ${POLITICA_SLA.diasSemanales} días · ${POLITICA_SLA.diasMensuales} días`,
);
console.log(`Respaldos  : ${ficheros.length}`);
console.log(
  `  conservar: ${conservar.length}  (${mb(conservar.reduce((s, f) => s + tam(f.ruta), 0))} MB)`,
);
console.log(
  `  borrar   : ${borrar.length}  (${mb(borrar.reduce((s, f) => s + tam(f.ruta), 0))} MB)`,
);

if (borrar.length > 0) {
  console.log(`\n--- ${BORRAR ? "BORRANDO" : "SE BORRARÍAN (simulación)"} ---`);
  for (const f of borrar) {
    console.log(`  ${f.nombre}`);
    if (BORRAR) fs.rmSync(f.ruta);
  }
  if (!BORRAR) {
    console.log("\nNada se ha borrado. Repite con BACKUP_PODAR=true si estás de acuerdo.");
  }
}

console.log("=================================\n");
