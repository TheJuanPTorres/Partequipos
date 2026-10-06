/**
 * FICHEROS DEL ALMACÉN DE BLOB SIN NINGÚN REGISTRO QUE LOS USE — SOLO LECTURA.
 *
 *   npm run blob:huerfanos                                   (development)
 *   npm run preview:ejecutar -- npm run blob:huerfanos       (preview)
 *
 * Producción la ejecuta dirección con su runbook, declarando el almacén
 * (`ALMACEN_BLOB_ESPERADO`, CLAUDE.md §10.37).
 *
 * POR QUÉ (CLAUDE.md §10.39): con la SUBIDA DIRECTA el navegador sube al Blob
 * ANTES de que el servidor guarde el registro. Si después el guardado falla por
 * otro motivo (falta un campo), el fichero se queda en el almacén sin registro.
 *
 * Qué hace: lista el almacén (`list` del Blob) y los ficheros que usan los
 * registros de TODAS las colecciones con subida, y escribe los que sobran. No
 * borra nada: el borrado es de dirección, por runbook.
 *
 * OJO al leer el resultado del almacén del PREVIEW: también lo usa la base de
 * `development` (§10.4). Un fichero sin registro en una base puede ser de la
 * otra: hay que ejecutarlo contra las dos y quedarse con lo que salga en ambas.
 */
import { list } from "@vercel/blob";

import { ALMACEN_PREVIEW, almacenDeToken } from "../../src/lib/blob/almacen";
import {
  huerfanos,
  nombreDeUrl,
  nombresDeRegistro,
  type FicheroBlob,
} from "../../src/lib/blob/huerfanos";
import { exigirAlmacen } from "./exigirAlmacen";

// Un script de datos nunca toca el esquema, ni genera tipos (§10.9, §10.25).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

exigirAlmacen("[huérfanos]");
const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
const almacen = almacenDeToken(token);
const base = new URL(process.env.DATABASE_URI ?? "postgres://x/").hostname;
process.stdout.write(`[huérfanos] base: ${base}\n`);

// 1. El almacén entero (solo nombres, tamaños y fechas).
const ficheros: FicheroBlob[] = [];
let cursor: string | undefined;
do {
  const pagina = await list({ token, cursor, limit: 1000 });
  for (const b of pagina.blobs) {
    ficheros.push({ pathname: b.pathname, size: b.size, uploadedAt: new Date(b.uploadedAt) });
  }
  cursor = pagina.hasMore ? pagina.cursor : undefined;
} while (cursor);

// 2. Lo que usan los registros de todas las colecciones con subida.
const { getPayload } = await import("payload");
const config = (await import("../../src/payload.config")).default;
const { seoConfig } = await import("../../src/lib/seo/config");
const payload = await getPayload({ config });
const usados: string[] = [];
const conSubida = payload.config.collections.filter((c) => Boolean(c.upload));
for (const c of conSubida) {
  // Si una colección no se puede leer (base sin migrar), se para: seguir
  // daría por huérfanos los ficheros de esa colección.
  const { docs } = await payload
    .find({ collection: c.slug, depth: 0, pagination: false, overrideAccess: true })
    .catch(() => {
      throw new Error(
        `[huérfanos] no se puede leer «${c.slug}»: ¿la base está al día? (npm run db:check). ` +
          `No se lista nada para no dar huérfanos falsos.`,
      );
    });
  for (const d of docs) usados.push(...nombresDeRegistro(d as unknown as Record<string, unknown>));
}
// Ficheros que el código enlaza a mano (el logo de §10.8).
for (const url of [seoConfig.logoPath, seoConfig.defaultOgImagePath]) {
  const n = typeof url === "string" ? nombreDeUrl(url) : null;
  if (n) usados.push(n);
}

// 3. El resultado.
const sobran = huerfanos(ficheros, usados);
const mb = (b: number) => (b / (1024 * 1024)).toFixed(2).replace(".", ",");
process.stdout.write(
  `[huérfanos] almacén ${almacen}: ${ficheros.length} ficheros; colecciones con subida: ` +
    `${conSubida.map((c) => c.slug).join(", ")}\n`,
);
if (sobran.length === 0) {
  process.stdout.write("[huérfanos] ninguno: todos los ficheros los usa algún registro.\n");
} else {
  const total = sobran.reduce((a, f) => a + f.size, 0);
  process.stdout.write(`[huérfanos] ${sobran.length} sin registro (${mb(total)} MB):\n`);
  for (const f of sobran) {
    process.stdout.write(
      `  ${f.uploadedAt.toISOString().slice(0, 16)}  ${mb(f.size).padStart(8)} MB  ${f.pathname}\n`,
    );
  }
}
if (almacen === ALMACEN_PREVIEW) {
  process.stdout.write(
    "[huérfanos] OJO: este almacén también lo usa la otra base (preview y development comparten el " +
      "del preview, §10.4). Ejecútalo contra las dos y borra solo lo que salga en ambas.\n",
  );
}
process.stdout.write("[huérfanos] No se ha borrado nada.\n");
