/**
 * TIPO DE MÁQUINA CON MAYÚSCULA en el título de las páginas de modelo de repuestos
 * (petición del cliente, 2026-10-20): «LINK-BELT excavadora Link-Belt 210LX» →
 * «LINK-BELT Excavadora Link-Belt 210LX». La lógica, en
 * `src/lib/repuestos/tituloTipoMayuscula.ts` (con pruebas).
 *
 *   npx payload run scripts/repuestos/titulos-tipo-mayuscula.ts <modo> <destino>
 *
 *   modo:     simular  → no escribe nada; lista antes → después
 *             aplicar  → escribe; repetirlo no cambia nada
 *   destino:  preview | produccion (solo dirección, con runbook) | prueba
 *
 * Solo toca el campo «Título de la página» y solo la letra del tipo. Después hay que
 * vaciar la caché del sitio (`POST /api/revalidar/`, paso final del runbook).
 */
import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { mayusculaDelTipo } from "../../src/lib/repuestos/tituloTipoMayuscula";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const fallar = (m: string): never => {
  const e = new Error(`[titulos-tipo] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular o aplicar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[titulos-tipo]");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[titulos-tipo] ${m}\n`);

const { docs } = await payload.find({
  collection: "modelos-repuesto",
  depth: 0,
  limit: 0,
  pagination: false,
  overrideAccess: true,
});

let porCambiar = 0;
let sinNada = 0;
for (const m of docs) {
  const antes = m.tituloPagina?.trim();
  if (!antes) continue;
  const despues = mayusculaDelTipo(antes);
  if (despues === antes) {
    sinNada += 1;
    continue;
  }
  porCambiar += 1;
  log(`${modo === "simular" ? "cambiaría" : "cambia"}: «${antes}» → «${despues}»`);
  if (modo === "aplicar") {
    await payload.update({
      collection: "modelos-repuesto",
      id: m.id,
      data: { tituloPagina: despues },
      overrideAccess: true,
    });
  }
}
log(`${porCambiar} por cambiar · ${sinNada} sin nada que cambiar`);
process.exit(0);
