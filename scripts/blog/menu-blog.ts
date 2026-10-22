/**
 * «BLOG» EN LA CABECERA DEL PREVIEW (2026-10-21, dirección): añade al final de
 * «Enlaces del menú» del global `cabecera` el enlace «Blog» → `/noticias/`
 * (como en la web antigua). El menú de escritorio y el móvil leen la misma lista.
 *
 *   npm run preview:blog:menu -- agregar
 *   npm run preview:blog:menu -- quitar     # lo quita, solo ese enlace
 *
 * Idempotente: si ya hay un enlace a `/noticias/`, no hace nada. Solo el preview
 * (base y Blob del preview); el sitio publicado se cambia desde el panel con
 * `runbook-blog-menu.md`.
 */
import { getPayload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => a === "agregar" || a === "quitar");
const fallar = (m: string): never => {
  const e = new Error(`[blog-menu] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: agregar o quitar");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const ENLACE = "/noticias/";
const cabecera = await payload.findGlobal({ slug: "cabecera", depth: 0 });
const actuales = cabecera.enlaces ?? [];
const es = (e: { enlace?: string | null }) => (e.enlace ?? "").replace(/\/?$/, "/") === ENLACE;
const hay = actuales.some(es);
const log = (m: string) => process.stdout.write(`[blog-menu] ${m}\n`);

if (modo === "agregar") {
  if (hay) log("ya hay un enlace a /noticias/: nada que hacer");
  else {
    await payload.updateGlobal({
      slug: "cabecera",
      data: {
        enlaces: [
          ...actuales.map(({ etiqueta, enlace }) => ({ etiqueta, enlace })),
          { etiqueta: "Blog", enlace: ENLACE },
        ],
      },
      overrideAccess: true,
    });
    log(`añadido «Blog» en la posición ${actuales.length + 1}`);
  }
} else if (!hay) log("no hay enlace a /noticias/: nada que quitar");
else {
  await payload.updateGlobal({
    slug: "cabecera",
    data: {
      enlaces: actuales.filter((e) => !es(e)).map(({ etiqueta, enlace }) => ({ etiqueta, enlace })),
    },
    overrideAccess: true,
  });
  log("quitado el enlace a /noticias/");
}
const despues = await payload.findGlobal({ slug: "cabecera", depth: 0 });
log(
  `enlaces ahora: ${(despues.enlaces ?? []).map((e) => `${e.etiqueta} → ${e.enlace}`).join(" | ")}`,
);
process.exit(0);
