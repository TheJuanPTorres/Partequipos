/**
 * EL LOGO DE DYNAPAC con transparencia (2026-11-04, #420): el PNG del kit de su página de marca
 * (`kit-marca-dynapac/public/partequipos/marcas/dynapac/logo.png`, RGBA) sustituye al JPG con
 * fondo blanco que tenía la marca de maquinaria nueva, para que su baldosa del índice de marcas
 * pueda llevarlo en blanco sobre su color.
 *
 *   npm run preview:dynapac-logo -- ver
 *   npm run preview:dynapac-logo -- aplicar [revalidar=<origen del preview>]
 *   npm run preview:dynapac-logo -- retirar   # devuelve el logo de antes si sigue siendo el nuestro
 *
 * SOLO el preview (en producción, por el panel: runbook-dynapac-logo.md). Manifiesto fuera del
 * repositorio. No toca otro campo de la marca.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "ver" || a === "aplicar" || a === "retirar");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[dynapac-logo] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: ver, aplicar o retirar");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
if (modo === "ver") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[dynapac-logo]");

const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && !origenDePreview(REVALIDAR)) fallar("`revalidar=` solo con la URL de un preview");
const ESCRITORIO = path.join(os.homedir(), "Desktop");
const FICHERO = path.join(
  ESCRITORIO,
  "partequipos-diseno",
  "kit-marca-dynapac",
  "public",
  "partequipos",
  "marcas",
  "dynapac",
  "logo.png",
);
const MANIFIESTO = path.join(
  ESCRITORIO,
  "partequipos-cierre",
  "manifiesto-dynapac-logo-preview.json",
);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[dynapac-logo] ${m}\n`);
const idDe = (x: unknown): number | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

type Manifiesto = { marca: number; antes: number | null; media: number };
const guardado = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : null;

const marca = (
  await payload.find({
    collection: "marcas-maquinaria",
    where: { slug: { equals: "dynapac" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0];
if (!marca) fallar("no hay marca de maquinaria nueva «dynapac»");
const actual = idDe(marca!.logo);
log(
  `marca ${marca!.id}: logo actual = media ${actual}; color de marca = ${marca!.colorMarca ?? "—"}`,
);
log(`manifiesto: ${guardado ? JSON.stringify(guardado) : "ninguno"}`);

if (modo === "aplicar") {
  if (guardado && actual === guardado.media) {
    log("ya aplicado: nada que hacer");
  } else {
    if (!fs.existsSync(FICHERO)) fallar(`no existe ${FICHERO}`);
    const media = await payload.create({
      collection: "media",
      data: { alt: "Logo de Dynapac" },
      filePath: FICHERO,
      overrideAccess: true,
    });
    await payload.update({
      collection: "marcas-maquinaria",
      id: marca!.id,
      data: { logo: media.id },
      overrideAccess: true,
    });
    fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
    fs.writeFileSync(
      MANIFIESTO,
      JSON.stringify({ marca: marca!.id, antes: actual, media: media.id } satisfies Manifiesto),
    );
    log(`subido media ${media.id} y puesto como logo de Dynapac (antes: media ${actual})`);
  }
  if (REVALIDAR) {
    const token = process.env.REVALIDACION_TOKEN ?? "";
    if (!token) log("sin REVALIDACION_TOKEN: no se revalida (redesplegar el preview)");
    else {
      const r = await fetchAlPreview(
        `${REVALIDAR.replace(/\/$/, "")}/api/revalidar/`,
        REVALIDAR,
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
        { method: "POST", headers: { [CABECERA_REVALIDACION]: token } },
      );
      log(`POST /api/revalidar/: HTTP ${r.status}`);
      if (r.status !== 200) fallar("la revalidación no respondió 200");
    }
  }
}

if (modo === "retirar") {
  if (!guardado) fallar("no hay manifiesto: nada que retirar");
  if (actual === guardado!.media) {
    await payload.update({
      collection: "marcas-maquinaria",
      id: guardado!.marca,
      data: { logo: guardado!.antes },
      overrideAccess: true,
    });
    log(`logo devuelto a media ${guardado!.antes}`);
  } else log("el logo ya no es el nuestro (cambiado en el panel): no se toca");
  await payload.delete({ collection: "media", id: guardado!.media, overrideAccess: true });
  fs.rmSync(MANIFIESTO);
  log(`media ${guardado!.media} borrada`);
}
