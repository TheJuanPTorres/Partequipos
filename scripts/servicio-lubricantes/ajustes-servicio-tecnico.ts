/**
 * AJUSTES DE DIRECCIÓN A LOS DATOS DE /servicio-tecnico/ (2026-10-20): títulos y
 * pasos de siniestros en tipo frase, la frase del taller en negrita y la
 * descripción del vídeo de YouTube del alistamiento. La lista de cambios y la
 * lógica, en `src/lib/servicioTecnico/ajustesDireccion.ts` (con pruebas).
 *
 *   npx payload run scripts/servicio-lubricantes/ajustes-servicio-tecnico.ts <modo> <destino>
 *
 *   modo:     simular  → no escribe nada; dice qué cambiaría y qué no
 *             aplicar  → escribe los cambios; repetirlo no cambia nada
 *             retirar  → devuelve cada valor al de antes, si sigue con el nuestro
 *   destino:  preview | produccion (solo dirección, con runbook) | prueba
 *
 * No pisa nada editado en el panel: un valor que no es el esperado se salta y se
 * avisa. No sube ficheros. El destino se valida ANTES de cargar Payload, como
 * los demás scripts de servicio técnico.
 */
import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { ajustar, CAMBIOS, type Bloque } from "../../src/lib/servicioTecnico/ajustesDireccion";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const fallar = (m: string): never => {
  const e = new Error(`[ajustes-servicio-tecnico] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[ajustes-servicio-tecnico]");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[ajustes-servicio-tecnico] ${m}\n`);

const { docs } = await payload.find({
  collection: "paginas",
  where: { slug: { equals: "servicio-tecnico" } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
});
const pagina = docs[0] ?? fallar("no existe la página «servicio-tecnico»");
const bloques = (pagina.bloques ?? []) as unknown as Bloque[];

const r = ajustar(bloques, CAMBIOS, modo === "retirar" ? "retirar" : "aplicar");
const nombre = (c: (typeof CAMBIOS)[number]) =>
  `${c.ancla} · ${c.campo.tipo === "campo" ? c.campo.nombre : c.campo.tipo === "paso" ? `paso ${c.campo.indice + 1}` : "frase en negrita"}`;
for (const c of r.aplicados) log(`${modo === "simular" ? "cambiaría" : "cambia"}: ${nombre(c)}`);
for (const c of r.yaEstaban) log(`ya estaba: ${nombre(c)}`);
for (const s of r.saltados)
  log(
    `AVISO, no se toca (valor distinto del esperado): ${nombre(s.cambio)} = ${JSON.stringify(s.actual)}`,
  );
log(
  `${r.aplicados.length} por cambiar · ${r.yaEstaban.length} ya estaban · ${r.saltados.length} saltados`,
);

if (modo !== "simular" && r.aplicados.length > 0) {
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { bloques: r.bloques as never },
    overrideAccess: true,
  });
  log(`✓ página ${pagina.id} guardada`);
}
process.exit(0);
