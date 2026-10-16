/**
 * PREGUNTAS FRECUENTES Y TESTIMONIOS REALES de la home (2026-10-16, decisión de
 * dirección): vuelven las secciones 10 y 11, que no se pintaban sin contenido.
 *
 *   npm run preview:testimonios-faq:simular      # no escribe nada: dice qué crearía
 *   npm run preview:testimonios-faq:importar     # crea las preguntas, las miniaturas y los testimonios
 *   npm run preview:testimonios-faq:retirar      # deshace EXACTAMENTE lo del manifiesto
 *
 * Qué hace, y nada más:
 * - Preguntas frecuentes: crea las que no existen ya con el mismo texto. NUNCA
 *   pisa una pregunta editada en el panel.
 * - Testimonios: uno por cada vídeo del canal de YouTube del cliente que no esté
 *   ya en un testimonio. Van con la casilla «vídeo ya publicado por el cliente»
 *   (sin frase y sin autorización de uso), con el nombre de la empresa que sale
 *   en el vídeo y como miniatura la que ya usa la web original. NO se inventa
 *   ninguna frase; cuando el cliente la mande, se añade en el panel.
 * - Con `despublicar` (solo para el preview, donde hay preguntas de ejemplo de
 *   ux-9) pasa a no publicadas las que ya había; la retirada las devuelve.
 * El resto de la portada no se toca: los títulos de ambas secciones ya existen.
 *
 * Como los demás importadores: MANIFIESTO fuera del repositorio
 * (`manifiesto-testimonios-faq-<destino>.json`), RETIRADA EXACTA y, en la
 * simulación, doble cierre (sin token del Blob y con `create`/`update`/`delete`
 * que lanzan un error). FUENTE fuera del repositorio
 * (`Desktop/partequipos-cierre/testimonios-faq-fuente.json`, o `fuente=<ruta>`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import {
  PREFIJO_TESTIMONIO,
  ficheroTestimonio,
  preguntasPorCrear,
  problemasDeLaFuente,
  testimoniosPorCrear,
  type FuenteTestimoniosFaq,
  type ManifiestoTestimoniosFaq,
} from "../../src/lib/portada/testimoniosFaq";
import { validarRespuestaFaq } from "../../src/lib/portada/respuestaFaq";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const despublicar = args.includes("despublicar");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[testimonios-faq] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, importar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (despublicar && destino === "produccion")
  fallar("`despublicar` es solo para el preview: en el sitio publicado no se toca lo que ya hay");
if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[testimonios-faq]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "testimonios-faq-fuente.json");
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-testimonios-faq-${destino}.json`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
if (modo === "simular") {
  for (const op of ["create", "update", "delete", "updateGlobal"] as const) {
    (payload as unknown as Record<string, unknown>)[op] = () =>
      fallar(`simulación: «${op}» no está permitido`);
  }
}
const log = (m: string) => process.stdout.write(`[testimonios-faq] ${m}\n`);

// ---------- Manifiesto ----------

const manifiesto: ManifiestoTestimoniosFaq = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as ManifiestoTestimoniosFaq)
  : {
      destino: destino!,
      inicio: new Date().toISOString(),
      creado: { media: [], testimonios: [], preguntas: [] },
      despublicadas: [],
    };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
const guardar = () => {
  if (modo === "simular") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

// ================================================================== RETIRAR
if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  for (const id of manifiesto.despublicadas)
    await payload.update({
      collection: "preguntas-frecuentes",
      id,
      data: { publicada: true },
      overrideAccess: true,
    });
  log(`preguntas devueltas a publicadas: ${manifiesto.despublicadas.length}`);
  for (const id of manifiesto.testimoniosDespublicados ?? [])
    await payload.update({
      collection: "testimonios",
      id,
      data: { publicado: true },
      overrideAccess: true,
    });
  log(`testimonios devueltos a publicados: ${manifiesto.testimoniosDespublicados?.length ?? 0}`);
  for (const id of manifiesto.creado.testimonios)
    await payload.delete({ collection: "testimonios", id, overrideAccess: true }).catch(() => null);
  log(`testimonios borrados: ${manifiesto.creado.testimonios.length}`);
  for (const id of manifiesto.creado.preguntas)
    await payload
      .delete({ collection: "preguntas-frecuentes", id, overrideAccess: true })
      .catch(() => null);
  log(`preguntas borradas: ${manifiesto.creado.preguntas.length}`);
  const urls: string[] = [];
  for (const m of manifiesto.creado.media) {
    const r = await payload
      .delete({ collection: "media", id: m.id, overrideAccess: true })
      .catch(() => null);
    if (r && m.url) urls.push(m.url);
  }
  log(`miniaturas borradas: ${urls.length} de ${manifiesto.creado.media.length}`);
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  if (urls.length) {
    log("manifiesto retirado; espero 70 s (propagación del Blob)");
    await new Promise((r) => setTimeout(r, 70_000));
    let vivos = [...urls];
    for (let intento = 0; ; intento++) {
      const quedan: string[] = [];
      for (const u of vivos)
        if ((await fetch(u, { method: "HEAD" })).status !== 404) quedan.push(u);
      vivos = quedan;
      if (!vivos.length || intento === 3) break;
      log(`${vivos.length} ficheros aún responden; vuelvo a mirar en 30 s`);
      await new Promise((r) => setTimeout(r, 30_000));
    }
    if (vivos.length) fallar(`${vivos.length} ficheros siguen en el Blob: ${vivos.join(" ")}`);
    log(`✓ RETIRADA COMPLETA: los ${urls.length} ficheros dan 404`);
  } else {
    log("✓ RETIRADA COMPLETA");
  }
  process.exit(0);
}

// ================================================================== SIMULAR / IMPORTAR
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE}`);
const fuente = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as FuenteTestimoniosFaq;
const problemas = problemasDeLaFuente(fuente);
for (const q of fuente.preguntas) {
  const v = validarRespuestaFaq(q.respuesta);
  if (v !== true) problemas.push(`pregunta ${q.orden}: ${v}`);
}
if (problemas.length) fallar(`la fuente tiene problemas: ${problemas.join(" · ")}`);

const existentes = (
  await payload.find({
    collection: "preguntas-frecuentes",
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs;
const testimoniosExistentes = (
  await payload.find({
    collection: "testimonios",
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs;
log(
  `en el destino hay ${existentes.length} preguntas y ${testimoniosExistentes.length} testimonios`,
);

// --- Preguntas
const nuevasPreguntas = preguntasPorCrear(
  fuente.preguntas,
  existentes.map((e) => e.pregunta),
);
if (despublicar) {
  for (const e of existentes) {
    if (e.publicada !== true || manifiesto.despublicadas.includes(e.id)) continue;
    if (fuente.preguntas.some((q) => q.pregunta.trim() === e.pregunta.trim())) continue;
    if (modo === "importar") {
      await payload.update({
        collection: "preguntas-frecuentes",
        id: e.id,
        data: { publicada: false },
        overrideAccess: true,
      });
      manifiesto.despublicadas.push(e.id);
      guardar();
    }
    log(`${modo === "simular" ? "se despublicaría" : "despublicada"} la pregunta ${e.id}`);
  }
}
if (despublicar) {
  for (const e of testimoniosExistentes) {
    if (e.publicado !== true || manifiesto.testimoniosDespublicados?.includes(e.id)) continue;
    if (fuente.testimonios.some((t) => t.youtube === e.youtube)) continue;
    if (modo === "importar") {
      await payload.update({
        collection: "testimonios",
        id: e.id,
        data: { publicado: false },
        overrideAccess: true,
      });
      (manifiesto.testimoniosDespublicados ??= []).push(e.id);
      guardar();
    }
    log(`${modo === "simular" ? "se despublicaría" : "despublicado"} el testimonio ${e.id}`);
  }
}
for (const q of nuevasPreguntas) {
  if (modo === "importar") {
    const doc = await payload.create({
      collection: "preguntas-frecuentes",
      data: { pregunta: q.pregunta, respuesta: q.respuesta, orden: q.orden, publicada: true },
      overrideAccess: true,
    });
    manifiesto.creado.preguntas.push(doc.id);
    guardar();
  }
  log(`${modo === "simular" ? "se crearía" : "creada"} la pregunta ${q.orden}`);
}

// --- Testimonios
const nuevos = testimoniosPorCrear(
  fuente.testimonios,
  testimoniosExistentes.map((t) => t.youtube),
);
const AGENTE = "Partequipos-migracion/1.0 (importador de testimonios; solo lectura)";
const yaMedia = new Map(
  (
    await payload.find({
      collection: "media",
      where: { filename: { like: PREFIJO_TESTIMONIO } },
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
    })
  ).docs.map((d) => [d.filename ?? "", d.id]),
);
for (const t of nuevos) {
  const fichero = ficheroTestimonio(t.clave, t.imagen);
  const base = fichero.replace(/\.\w+$/, "");
  let mediaId = [...yaMedia.entries()].find(
    ([f]) => f === fichero || f.startsWith(`${base}-`),
  )?.[1];
  if (modo === "simular") {
    log(`se crearía el testimonio «${t.clave}»${mediaId ? "" : " (con 1 subida)"}`);
    continue;
  }
  if (mediaId === undefined) {
    const r = await fetch(t.imagen, { headers: { "User-Agent": AGENTE } });
    if (!r.ok) fallar(`HTTP ${r.status} al descargar la miniatura de «${t.clave}»`);
    const datos = Buffer.from(await r.arrayBuffer());
    const tipo = (r.headers.get("content-type") ?? "image/jpeg").split(";")[0]!;
    const doc = await payload.create({
      collection: "media",
      data: { alt: `Vídeo del testimonio de ${t.empresa}` },
      file: { data: datos, mimetype: tipo, name: fichero, size: datos.length },
      overrideAccess: true,
    });
    manifiesto.creado.media.push({ clave: t.clave, id: doc.id, url: doc.url ?? "" });
    guardar();
    mediaId = doc.id;
    log(`subida ${t.clave} → media ${doc.id}`);
  }
  const doc = await payload.create({
    collection: "testimonios",
    data: {
      nombre: t.empresa,
      empresa: t.empresa,
      ...(t.ciudad ? { ciudad: t.ciudad } : {}),
      youtube: t.youtube,
      videoDelCliente: true,
      foto: mediaId,
      publicado: true,
      orden: t.orden,
    },
    overrideAccess: true,
  });
  manifiesto.creado.testimonios.push(doc.id);
  guardar();
  log(`testimonio «${t.clave}» → ${doc.id}`);
}

log(
  `${modo === "simular" ? "SIMULACIÓN" : "HECHO"}: preguntas ${nuevasPreguntas.length} · testimonios ${nuevos.length}`,
);
