/**
 * Una selección de PRUEBA en «Marcas de la banda» (portada → «Marcas de repuestos») en el PREVIEW,
 * para ver la banda con las marcas elegidas y en su orden, y su retirada exacta.
 *
 *   npm run preview:marcas-banda:ver
 *   npm run preview:marcas-banda:aplicar -- revalidar=<URL del preview>
 *   npm run preview:marcas-banda:retirar -- revalidar=<URL del preview>
 *
 * - `ver`: lo que hay en el campo y las marcas de repuestos con logo, por orden alfabético.
 * - `aplicar`: elige 5 marcas con logo (o las de `cuantas=<n>`) en orden alfabético INVERSO (así se
 *   ve que manda el orden del panel y no el alfabético) y guarda en el manifiesto lo que había antes.
 * - `retirar`: devuelve el valor de antes, solo si el campo sigue con la selección de prueba (lo
 *   cambiado después a mano se respeta y se avisa).
 * - `comprobar-repetida`: intenta guardar la primera marca dos veces y exige que el servidor lo
 *   RECHACE y que el campo siga como estaba (por efecto, CLAUDE.md §10.15).
 *
 * SOLO preview: el mismo guardián que el hero de prueba, antes de conectar. No sube ni borra
 * ficheros ni toca el esquema. `revalidar=` (con `REVALIDACION_TOKEN` del preview en el entorno)
 * revalida el preview al terminar; sin él, redesplegar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { idsElegidos } from "../../src/lib/portada/marcasBanda";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const args = process.argv.slice(2);
const modo = args.find((a) => ["ver", "aplicar", "retirar", "comprobar-repetida"].includes(a));
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
// Para fallar se LANZA: `payload run` sale con 0 tras el import y pisaría un `exitCode` (§10.25).
const fallar = (m: string): never => {
  const e = new Error(`[marcas-banda] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: ver, aplicar, retirar o comprobar-repetida");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);

const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && !origenDePreview(REVALIDAR)) fallar("`revalidar=` solo con la URL de un preview");
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-marcas-banda-preview.json",
);
const CUANTAS = Number(valorDe("cuantas") ?? 5);
if (!Number.isInteger(CUANTAS) || CUANTAS < 1) fallar("`cuantas=` tiene que ser un entero ≥ 1");

// Un script de datos no toca el esquema ni deja el hijo de tipos (CLAUDE.md §10.9, §10.34, §10.25).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[marcas-banda] ${m}\n`);

type Manifiesto = { inicio: string; pagina: number; antes: number[]; ahora: number[] };
const iguales = (a: number[], b: number[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

const pagina = (
  await payload.find({
    collection: "paginas",
    where: { slug: { equals: "inicio" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0];
if (!pagina) fallar("no hay página «inicio»");
const grupo = pagina!.seccionMarcasRepuestos ?? {};
const actual = idsElegidos(grupo.marcasBanda);

async function revalidar() {
  if (!REVALIDAR) return;
  const token = process.env.REVALIDACION_TOKEN ?? "";
  if (!token) {
    log("sin REVALIDACION_TOKEN del preview: no se revalida (redesplegar el preview)");
    return;
  }
  const r = await fetchAlPreview(
    `${REVALIDAR.replace(/\/$/, "")}/api/revalidar/`,
    REVALIDAR,
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    { method: "POST", headers: { [CABECERA_REVALIDACION]: token } },
  );
  log(`POST /api/revalidar/: HTTP ${r.status}`);
  if (r.status !== 200) fallar("la revalidación del preview no respondió 200");
}

const guardarCampo = (ids: number[]) =>
  payload.update({
    collection: "paginas",
    id: pagina!.id,
    data: { seccionMarcasRepuestos: { ...grupo, marcasBanda: ids } },
    overrideAccess: true,
  });

if (modo === "comprobar-repetida") {
  const { docs } = await payload.find({
    collection: "marcas",
    depth: 0,
    limit: 1,
    sort: "nombre",
    overrideAccess: true,
  });
  const id = docs[0]?.id;
  if (!id) fallar("no hay marcas");
  let rechazo = "";
  try {
    await guardarCampo([id!, id!]);
  } catch (e) {
    rechazo = e instanceof Error ? e.message : String(e);
  }
  const leido = idsElegidos(
    (await payload.findByID({ collection: "paginas", id: pagina!.id, depth: 0 }))
      .seccionMarcasRepuestos?.marcasBanda,
  );
  log(`rechazo: ${rechazo || "NINGUNO"}`);
  log(`campo después: ${JSON.stringify(leido)} (antes ${JSON.stringify(actual)})`);
  if (!rechazo) fallar("el servidor aceptó una marca repetida");
  if (!iguales(leido, actual)) fallar("el campo cambió");
  log("✓ REPETIDA RECHAZADA y el campo sin cambios");
} else if (modo === "ver") {
  const { docs } = await payload.find({
    collection: "marcas",
    depth: 0,
    limit: 0,
    pagination: false,
    sort: "nombre",
    select: { nombre: true, slug: true, logo: true },
    overrideAccess: true,
  });
  log(`«Marcas de la banda» ahora: ${JSON.stringify(actual)}`);
  log(
    `marcas con logo: ${docs
      .filter((m) => m.logo && m.slug)
      .map((m) => `${m.id}:${m.nombre}`)
      .join(", ")}`,
  );
  log(`manifiesto: ${fs.existsSync(MANIFIESTO) ? MANIFIESTO : "no hay"}`);
} else if (modo === "aplicar") {
  if (fs.existsSync(MANIFIESTO)) {
    const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
    if (iguales(actual, m.ahora)) {
      log(`ya aplicada: ${JSON.stringify(m.ahora)}; nada que hacer`);
      await revalidar();
    } else {
      fallar(`hay un manifiesto y el campo no coincide con él: retira primero (${MANIFIESTO})`);
    }
  } else {
    const { docs } = await payload.find({
      collection: "marcas",
      depth: 0,
      limit: 0,
      pagination: false,
      sort: "-nombre",
      select: { nombre: true, slug: true, logo: true },
      overrideAccess: true,
    });
    const elegidas = docs.filter((m) => m.logo && m.slug).slice(0, CUANTAS);
    if (elegidas.length < CUANTAS) fallar(`no hay ${CUANTAS} marcas con logo`);
    const ahora = elegidas.map((m) => m.id);
    const manifiesto: Manifiesto = {
      inicio: new Date().toISOString(),
      pagina: pagina!.id,
      antes: actual,
      ahora,
    };
    fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
    fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
    await guardarCampo(ahora);
    const leido = idsElegidos(
      (await payload.findByID({ collection: "paginas", id: pagina!.id, depth: 0 }))
        .seccionMarcasRepuestos?.marcasBanda,
    );
    if (!iguales(leido, ahora)) fallar(`la base dice ${JSON.stringify(leido)}, no lo aplicado`);
    log(`antes: ${JSON.stringify(actual)}`);
    log(`ahora: ${elegidas.map((m) => `${m.id}:${m.nombre}`).join(" → ")}`);
    await revalidar();
    log("✓ SELECCIÓN DE PRUEBA APLICADA");
  }
} else {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  if (!iguales(actual, m.ahora)) {
    fallar(
      `el campo cambió desde la prueba (${JSON.stringify(actual)}): no se toca; revísalo a mano`,
    );
  }
  await guardarCampo(m.antes);
  const leido = idsElegidos(
    (await payload.findByID({ collection: "paginas", id: pagina!.id, depth: 0 }))
      .seccionMarcasRepuestos?.marcasBanda,
  );
  if (!iguales(leido, m.antes)) fallar(`la base dice ${JSON.stringify(leido)}, no lo de antes`);
  fs.renameSync(
    MANIFIESTO,
    MANIFIESTO.replace(
      /\.json$/,
      `.retirado-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    ),
  );
  log(`devuelto a ${JSON.stringify(m.antes)}`);
  await revalidar();
  log("✓ RETIRADA COMPLETA");
}
