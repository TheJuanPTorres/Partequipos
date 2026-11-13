/**
 * Cambia el «Diseño de la página» de UNA marca de maquinaria nueva en el PREVIEW para ver la
 * «Plantilla 1» pintada, y la devuelve como estaba.
 *
 *   npm run preview:diseno-marca:ver
 *   npm run preview:diseno-marca:aplicar -- marca=<slug> revalidar=<URL del preview>
 *   npm run preview:diseno-marca:retirar -- revalidar=<URL del preview>
 *
 * - `ver`: el diseño de cada marca.
 * - `aplicar`: pone `plantilla1` en la marca y guarda en el manifiesto el valor de antes.
 * - `retirar`: devuelve el valor de antes, solo si el campo sigue con el de la prueba (lo cambiado
 *   después a mano se respeta y se avisa), y borra el manifiesto.
 *
 * SOLO preview: el mismo guardián que el hero de prueba, antes de conectar. No toca el esquema ni
 * el Blob. La base del preview la comparten todos los previews: mientras esté aplicado, el cambio
 * se ve en cualquiera. `revalidar=` (con `REVALIDACION_TOKEN` del preview) revalida al terminar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import type { MarcasMaquinaria } from "../../src/payload-types";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const args = process.argv.slice(2);
const modo = args.find((a) => ["ver", "aplicar", "retirar"].includes(a));
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
// Para fallar se LANZA: `payload run` sale con 0 tras el import y pisaría un `exitCode` (§10.25).
const fallar: (m: string) => never = (m) => {
  const e = new Error(`[diseno-marca] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: ver, aplicar o retirar");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);

const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && !origenDePreview(REVALIDAR)) fallar("`revalidar=` solo con la URL de un preview");
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-diseno-marca-preview.json",
);
const PRUEBA = "plantilla1";

// Un script de datos no toca el esquema ni deja el hijo de tipos (CLAUDE.md §10.9, §10.34, §10.25).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[diseno-marca] ${m}\n`);

type Diseno = NonNullable<MarcasMaquinaria["disenoPagina"]>;
type Manifiesto = { inicio: string; id: number; slug: string; antes: Diseno | null };

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

const marcas = (
  await payload.find({
    collection: "marcas-maquinaria",
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })
).docs;

if (modo === "ver") {
  for (const m of marcas) log(`${m.slug}: ${m.disenoPagina ?? "(vacío)"}`);
} else if (modo === "aplicar") {
  const slug = valorDe("marca");
  if (!slug) fallar("indica `marca=<slug>`");
  if (fs.existsSync(MANIFIESTO)) fallar("ya hay un manifiesto: retira antes lo aplicado");
  const m = marcas.find((x) => x.slug === slug);
  if (!m) fallar(`no hay una marca con el slug «${slug}»`);
  const manifiesto: Manifiesto = {
    inicio: new Date().toISOString(),
    id: m.id,
    slug: m.slug,
    antes: m.disenoPagina ?? null,
  };
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
  await payload.update({
    collection: "marcas-maquinaria",
    id: m.id,
    data: { disenoPagina: PRUEBA },
    overrideAccess: true,
  });
  const despues = await payload.findByID({
    collection: "marcas-maquinaria",
    id: m.id,
    depth: 0,
    overrideAccess: true,
  });
  if (despues.disenoPagina !== PRUEBA) fallar("el diseño no quedó en la Plantilla 1");
  log(`«${m.slug}»: ${manifiesto.antes ?? "(vacío)"} → ${PRUEBA}`);
  await revalidar();
} else {
  if (!fs.existsSync(MANIFIESTO)) fallar("no hay manifiesto: nada que retirar");
  const man = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  const m = marcas.find((x) => x.id === man.id);
  if (!m) fallar(`la marca ${man.slug} ya no existe`);
  if (m!.disenoPagina !== PRUEBA) {
    log(`«${man.slug}» ya no está en ${PRUEBA} (${m!.disenoPagina ?? "(vacío)"}): se respeta`);
  } else {
    await payload.update({
      collection: "marcas-maquinaria",
      id: man.id,
      data: { disenoPagina: man.antes },
      overrideAccess: true,
    });
    const despues = await payload.findByID({
      collection: "marcas-maquinaria",
      id: man.id,
      depth: 0,
      overrideAccess: true,
    });
    if ((despues.disenoPagina ?? null) !== man.antes) fallar("el diseño no volvió a como estaba");
    log(`«${man.slug}»: devuelto a ${man.antes ?? "(vacío)"}`);
  }
  fs.rmSync(MANIFIESTO);
  await revalidar();
}
