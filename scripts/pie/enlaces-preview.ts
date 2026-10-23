/**
 * ENLACES DEL PIE EN EL PREVIEW (2026-10-22): lo mismo que hará dirección desde
 * el panel del sitio publicado (`runbook-pie-enlaces.md`), para probarlo antes:
 *
 * - sube «LINEA-ETICA.pdf» de la web antigua a «Documentos» («Línea Ética»);
 * - en el global «Pie de página»: «Zona de clientes» al portal SAP, fuera
 *   «Call center» y «Financiación», y en «Contacto» la PQRSF y la «Línea Ética»
 *   (tipo «Documento en el visor»);
 * - en «SEO y datos de la empresa», la dirección de LinkedIn real en lugar de
 *   la de ejemplo (o añadida, si no hay ninguna).
 *
 * Las páginas del PDF para el visor, después, con `scripts/documentos/visor.ts
 * paginas preview documento=<id> carpeta=… manifiesto=…` (su propio manifiesto).
 *
 *   npm run preview:ejecutar -- payload run scripts/pie/enlaces-preview.ts aplicar
 *   npm run preview:ejecutar -- payload run scripts/pie/enlaces-preview.ts retirar
 *
 * `retirar` devuelve el pie y las redes a como estaban (manifiesto) y borra el
 * documento. Solo el preview (guarda del hero de prueba).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const fallar = (m: string): never => {
  const e = new Error(`[pie] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const modo = process.argv.slice(2).find((a) => a === "aplicar" || a === "retirar");
if (!modo) fallar("indica el modo: aplicar o retirar");
const guarda = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!guarda.permitido) fallar(`NO se hace nada: ${guarda.motivo}`);
exigirAlmacen("[pie]");

const PDF_LINEA_ETICA = "https://partequipos.com/wp-content/uploads/2025/07/LINEA-ETICA.pdf";
const ZONA_CLIENTES = "https://miportalsap.z13.web.core.windows.net/#/sap/partequipossas";
const PQRSF =
  "https://forms.cloud.microsoft/pages/responsepage.aspx?id=BSzLJoLIJkmJHSf6ewS1FmXxmfyaSulPud-wSUH131JURDJKMkg2V0oyWlRBWkdOVFpWTk9EWVBJOC4u&route=shorturl";
const LINKEDIN = "https://www.linkedin.com/company/partequipos-s-a/home/";

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-pie-enlaces-preview.json",
);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[pie] ${m}\n`);

type Manifiesto = { columnas: unknown; redes: unknown; documento: number | null };

/** Quita los `id` de las filas: al restaurar, Payload crea unas nuevas. */
const sinIds = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sinIds)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([k]) => k !== "id")
            .map(([k, x]) => [k, sinIds(x)]),
        )
      : v;

if (modo === "aplicar") {
  if (fs.existsSync(MANIFIESTO))
    fallar(`ya existe ${MANIFIESTO}: retira antes de volver a aplicar`);
  const pie = await payload.findGlobal({ slug: "pie", depth: 0 });
  const seo = await payload.findGlobal({ slug: "seo", depth: 0 });
  const manifiesto: Manifiesto = {
    columnas: sinIds(pie.columnas),
    redes: sinIds(seo.empresa?.redes),
    documento: null,
  };
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));

  const respuesta = await fetch(PDF_LINEA_ETICA);
  if (!respuesta.ok) fallar(`no se pudo descargar el PDF: HTTP ${respuesta.status}`);
  const datos = Buffer.from(await respuesta.arrayBuffer());
  const documento = await payload.create({
    collection: "documentos",
    data: { titulo: "Línea Ética" },
    file: { data: datos, mimetype: "application/pdf", name: "linea-etica.pdf", size: datos.length },
  });
  manifiesto.documento = documento.id;
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
  log(`documento ${documento.id}: ${documento.url}`);

  const columnas = (pie.columnas ?? []).map((c) => {
    const enlaces = (c.enlaces ?? [])
      .filter((e) => !/^(call center|financiaci[oó]n)$/i.test(e.etiqueta.trim()))
      .map((e) =>
        /^zona de clientes$/i.test(e.etiqueta.trim()) ? { ...e, destino: ZONA_CLIENTES } : e,
      );
    if (/^contacto$/i.test(c.titulo.trim())) {
      enlaces.push(
        {
          etiqueta: "¿Tienes una PQRSF? Ingresa aquí",
          tipo: "pagina",
          destino: PQRSF,
        } as (typeof enlaces)[number],
        {
          etiqueta: "Línea Ética",
          tipo: "documento",
          documento: documento.id,
        } as (typeof enlaces)[number],
      );
    }
    return { ...c, enlaces };
  });
  await payload.updateGlobal({ slug: "pie", data: { columnas } });

  const redes = (seo.empresa?.redes ?? []).filter((r) => !/linkedin\.com\//i.test(r.url));
  redes.unshift({ url: LINKEDIN } as (typeof redes)[number]);
  await payload.updateGlobal({ slug: "seo", data: { empresa: { ...seo.empresa, redes } } });
  log("pie y redes actualizados");
} else {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto en ${MANIFIESTO}`);
  const m = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  const seo = await payload.findGlobal({ slug: "seo", depth: 0 });
  await payload.updateGlobal({ slug: "pie", data: { columnas: m.columnas as never } });
  await payload.updateGlobal({
    slug: "seo",
    data: { empresa: { ...seo.empresa, redes: m.redes as never } },
  });
  if (m.documento) {
    const doc = await payload.findByID({ collection: "documentos", id: m.documento, depth: 0 });
    await payload.delete({ collection: "documentos", id: m.documento });
    const r = await fetch(doc.url ?? "", { method: "HEAD", cache: "no-store" });
    log(`documento ${m.documento} borrado (fichero: HTTP ${r.status})`);
  }
  fs.renameSync(MANIFIESTO, `${MANIFIESTO}.retirado-${Date.now()}`);
  log("pie y redes devueltos a como estaban");
}
