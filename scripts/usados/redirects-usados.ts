/**
 * Crea los 301 de las URL antiguas de WordPress de la maquinaria USADA hacia la
 * página nueva de cada unidad (2026-10-16, decisión de dirección):
 *
 *   /maquinaria-pesada-usada/<slug-antiguo>/
 *     → /maquinaria-pesada/maquinaria-pesada-usada/<categoria>/<slug>/
 *
 * El slug antiguo de 86 de las 128 unidades llevaba el número de serie; el
 * nuevo sale del nombre y no lo lleva. El destino se lee de la BASE (el `slug`
 * que tiene cada unidad), no se vuelve a calcular: así el 301 apunta a lo que
 * de verdad se sirve aunque alguien lo haya editado.
 *
 *   npm run preview:usados:redirects-simular
 *   npm run preview:usados:redirects         # idempotente: no duplica ni pisa lo que ya hay
 *   npm run preview:usados:redirects-retirar # borra exactamente los que creó este script
 *
 * Imprime ids de WordPress, nunca el serial ni las rutas antiguas (que lo
 * llevan). Mismo destino y mismas guardas que `importar-usados.ts`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { rutaAntiguaDeUnidad } from "../../src/lib/usados/urls";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "crear" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[redirects-usados] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, crear o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
}

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "usados-wordpress.json");
const MANIFIESTO_USADOS =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-usados-${destino}.json`);
const MANIFIESTO = path.join(CIERRE, `manifiesto-redirects-usados-${destino}.json`);
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE}`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[redirects-usados] ${m}\n`);

type Manifiesto = { destino: string; creados: { idWp: number; id: number }[] };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, creados: [] };
if (manifiesto.destino !== destino) fallar(`el manifiesto es de «${manifiesto.destino}»`);
const guardar = () => {
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

if (modo === "retirar") {
  for (const c of manifiesto.creados) {
    await payload
      .delete({ collection: "redirects", id: c.id, overrideAccess: true })
      .catch(() => {});
  }
  log(`retirados ${manifiesto.creados.length}`);
  manifiesto.creados = [];
  guardar();
  process.exit(0);
}

if (!fs.existsSync(MANIFIESTO_USADOS))
  fallar(`no está el manifiesto de usados ${MANIFIESTO_USADOS}`);
const idPorWp = new Map(
  (
    JSON.parse(fs.readFileSync(MANIFIESTO_USADOS, "utf8")) as {
      creado: { usados: { idWp: number; id: number }[] };
    }
  ).creado.usados.map((u) => [u.idWp, u.id]),
);
type Crudo = { idWp: number; enlace: string };
const { unidades } = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as { unidades: Crudo[] };

let nuevos = 0;
let ya = 0;
let sinUnidad = 0;
const problemas: string[] = [];
for (const u of unidades) {
  const id = idPorWp.get(u.idWp);
  if (id === undefined) {
    sinUnidad++;
    continue;
  }
  const desde = rutaAntiguaDeUnidad(u.enlace);
  if (!desde) {
    problemas.push(`${u.idWp}: el enlace de WordPress no es de /maquinaria-pesada-usada/`);
    continue;
  }
  const unidad = await payload.findByID({
    collection: "equipos-usados",
    id,
    depth: 1,
    overrideAccess: true,
  });
  const categoria = typeof unidad.categoria === "object" ? unidad.categoria.slug : null;
  if (!unidad.slug || !categoria) {
    problemas.push(`${u.idWp}: la unidad ${id} aún no tiene dirección web o categoría`);
    continue;
  }
  const hacia = `/maquinaria-pesada/maquinaria-pesada-usada/${categoria}/${unidad.slug}`;
  const existente = await payload.find({
    collection: "redirects",
    where: { desde: { equals: desde } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existente.docs[0]) {
    ya++;
    continue;
  }
  if (modo === "simular") {
    nuevos++;
    continue;
  }
  const doc = await payload.create({
    collection: "redirects",
    data: {
      desde,
      hacia,
      tipo: "301",
      origen: "migracion",
      notas: `Maquinaria usada de WordPress (id ${u.idWp}): la dirección antigua llevaba el número de serie.`,
    },
    overrideAccess: true,
  });
  manifiesto.creados.push({ idWp: u.idWp, id: doc.id });
  guardar();
  nuevos++;
}
log(
  `${modo === "simular" ? "se crearían" : "creados"} ${nuevos} · ya existían ${ya} · sin unidad importada ${sinUnidad} · problemas ${problemas.length}`,
);
for (const p of problemas) log(`  ${p}`);
if (problemas.length > 0) fallar("hay unidades sin dirección: corrige y vuelve a ejecutar");
