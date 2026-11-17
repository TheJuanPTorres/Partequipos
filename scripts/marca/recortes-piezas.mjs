/**
 * RECORTES DE LAS FOTOS DE PIEZA (categorías técnicas, 2026-11-17): la parte visible de cada foto, sin
 * su margen blanco, en fracciones. Se guarda en `src/lib/marca/recortesPiezas.json` porque medirla
 * durante el build falla (el almacén responde 403 a las descargas del build). Se lee de las copias del
 * PREVIEW (/_next/image), nunca del almacén.
 *
 *   npm run preview:ejecutar -- node scripts/marca/recortes-piezas.mjs <preview> <ruta de una página de tipo>
 */
import fs from "node:fs";
import sharp from "sharp";
import { fetchAlPreview } from "../../src/lib/preview/derivacion.mjs";

const [origen, ruta] = process.argv.slice(2);
const secreto = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "";
const html = await (await fetchAlPreview(origen + ruta, origen, secreto)).text();
const urls = [
  ...new Set(
    [...html.matchAll(/_next\/image\/\?url=([^&"]*wp-real-cat-[^&"]*)/g)].map((m) =>
      decodeURIComponent(m[1]),
    ),
  ),
];
const destino = new URL("../../src/lib/marca/recortesPiezas.json", import.meta.url);
const actual = fs.existsSync(destino) ? JSON.parse(fs.readFileSync(destino, "utf8")) : {};
for (const u of urls) {
  const clave = new URL(u).pathname.replace(/-[A-Za-z0-9]{20,}(?=\.\w+$)/, "");
  const r = await fetchAlPreview(
    `${origen}/_next/image/?url=${encodeURIComponent(u)}&w=1080&q=75`,
    origen,
    secreto,
  );
  const b = Buffer.from(await r.arrayBuffer());
  const m = await sharp(b).metadata();
  const { info } = await sharp(b).trim({ threshold: 30 }).toBuffer({ resolveWithObject: true });
  const f = (n) => Math.round(n * 10000) / 10000;
  actual[clave] = {
    x: f(-(info.trimOffsetLeft ?? 0) / m.width),
    y: f(-(info.trimOffsetTop ?? 0) / m.height),
    w: f(info.width / m.width),
    h: f(info.height / m.height),
  };
}
fs.writeFileSync(destino, JSON.stringify(actual, null, 2) + "\n");
process.stdout.write(`recortes ${Object.keys(actual).length}
`);
