/**
 * NOSOTROS CON LA PLANTILLA 4089 DE ANDRÉS (2026-10-26, decisiones de Juan Pablo): el contenido
 * REAL de WordPress se queda (textos y cifras) y solo se AÑADE lo que falta de la plantilla:
 *
 * - en «Cifras», «100 %» «Cobertura nacional» (sin asterisco: no hay nota) y «10.000+» «Repuestos disponibles», detrás de
 *   las que ya haya (la de «+26 Años de experiencia»);
 * - en «Presentación con imagen», la animación del mapa de sedes (colección «Animaciones»), que
 *   se pinta en lugar de la foto (la foto queda de respaldo con «reducir movimiento»);
 * - en «Tarjetas expandibles», el botón «Ver todo» → /maquinaria-pesada/ si no tiene botón;
 * - el botón de la presentación lleva a /contactanos/;
 * - MAYÚSCULAS (Juan Pablo, 2026-10-26): los textos que WordPress guardaba en mayúsculas pasan a
 *   frase o a mayúscula inicial en cada palabra (`CAMBIOS_DE_TEXTO`); solo si están tal cual.
 *
 *   npm run preview:ejecutar -- payload run scripts/contenido-real/nosotros-4089.ts listar
 *   npm run preview:ejecutar -- payload run scripts/contenido-real/nosotros-4089.ts aplicar
 *   npm run preview:ejecutar -- payload run scripts/contenido-real/nosotros-4089.ts retirar
 *   npm run preview:ejecutar -- payload run scripts/contenido-real/nosotros-4089.ts fotos
 *
 * `fotos` (después de `aplicar` y con la migración del pase): pone en «Más fotos de fondo» de la
 * franja las de CASE y Yanmar de WordPress (`FOTOS_PASE`), detrás de la «Imagen de fondo». No
 * lleva manifiesto propio: `retirar` devuelve los bloques de antes de `aplicar`, sin ellas.
 *
 * `listar` solo lee (bloques de Nosotros, animaciones y fotos `wp-real-`). `aplicar` guarda en
 * un manifiesto los bloques tal como estaban; `retirar` los devuelve. Solo el preview. En el
 * sitio publicado lo hace Juan Pablo desde el panel (`runbook-nosotros-4089.md`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const fallar = (m: string): never => {
  const e = new Error(`[nosotros-4089] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
const modo = process.argv
  .slice(2)
  .find((a) => a === "listar" || a === "aplicar" || a === "retirar" || a === "fotos");
if (!modo) fallar("indica el modo: listar, aplicar, retirar o fotos");
const guarda = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!guarda.permitido) fallar(`NO se hace nada: ${guarda.motivo}`);

const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-nosotros-4089-preview.json",
);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[nosotros-4089] ${m}\n`);

/** Texto guardado (exacto) → texto nuevo. Uno que ya no coincide, no se toca. */
const CAMBIOS_DE_TEXTO: Record<string, string> = {
  "OFRECEMOS SOLUCIONES PARA TUS PROYECTOS": "Ofrecemos soluciones para tus proyectos",
  CONTÁCTANOS: "Contáctanos",
  "MARCAS ALIADAS": "Marcas Aliadas",
  "MAQUINARIA PESADA NUEVA": "Maquinaria Pesada Nueva",
  "MAQUINARIA PESADA USADA": "Maquinaria Pesada Usada",
  "REPUESTOS PARA MAQUINARIA PESADA": "Repuestos para Maquinaria Pesada",
};
/** Fotos de WordPress (ya en «Imágenes») que siguen a la «Imagen de fondo» en el pase. */
const FOTOS_PASE = ["wp-real-marca-case", "wp-real-marca-yanmar"];

const nuevoTexto = (v: unknown): unknown =>
  typeof v === "string" && CAMBIOS_DE_TEXTO[v.trim()] ? CAMBIOS_DE_TEXTO[v.trim()] : v;

const { docs } = await payload.find({
  collection: "paginas",
  where: { slug: { equals: "nosotros" } },
  depth: 0,
  limit: 1,
});
const pagina = docs[0] ?? fallar("no hay página «nosotros»");
type Bloque = Record<string, unknown> & { blockType: string };
const bloques = (pagina.bloques ?? []) as unknown as Bloque[];

if (modo === "listar") {
  for (const b of bloques) {
    const { blockType, id, ...resto } = b;
    log(`bloque ${blockType} (${String(id)}): ${JSON.stringify(resto).slice(0, 500)}`);
  }
  const anim = await payload.find({ collection: "animaciones", limit: 50, depth: 0 });
  for (const a of anim.docs) log(`animación ${a.id}: ${a.filename} (${a.ancho}×${a.alto})`);
  const fotos = await payload.find({
    collection: "media",
    where: { filename: { like: "wp-real" } },
    limit: 100,
    depth: 0,
  });
  for (const f of fotos.docs)
    if (f.filename?.startsWith("wp-real"))
      log(`foto ${f.id}: ${f.filename} ${f.width}×${f.height} «${f.alt}»`);
} else if (modo === "fotos") {
  if (!fs.existsSync(MANIFIESTO)) fallar("primero `aplicar`: `retirar` devuelve las fotos con él");
  const ids: number[] = [];
  for (const prefijo of FOTOS_PASE) {
    const { docs: encontradas } = await payload.find({
      collection: "media",
      where: { filename: { like: prefijo } },
      limit: 10,
      depth: 0,
    });
    const foto =
      encontradas.find((f) => f.filename?.startsWith(prefijo)) ?? fallar(`no hay foto ${prefijo}…`);
    ids.push(foto.id);
    log(`foto del pase: ${foto.id} ${foto.filename}`);
  }
  const nuevos = bloques.map((b) =>
    b.blockType === "franjaMarquee" ? { ...b, fondosExtra: ids } : b,
  );
  if (!nuevos.some((b) => b.blockType === "franjaMarquee")) fallar("Nosotros no tiene franja");
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { bloques: nuevos } as never,
  });
  log(`✓ pase con la imagen de fondo y ${ids.length} fotos más`);
} else if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no existe ${MANIFIESTO}: nada que retirar`);
  const antes = JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as { bloques: Bloque[] };
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { bloques: antes.bloques } as never,
  });
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("✓ bloques devueltos a como estaban");
} else {
  if (fs.existsSync(MANIFIESTO))
    fallar(`ya existe ${MANIFIESTO}: retira antes de volver a aplicar`);
  const anim = await payload.find({
    collection: "animaciones",
    where: { filename: { like: "mapa" } },
    limit: 5,
    depth: 0,
  });
  const mapa = anim.docs.find((a) => a.filename?.includes("mapa")) ?? null;
  if (!mapa) log("⚠ no hay animación del mapa en «Animaciones»: la presentación sigue con su foto");

  const nuevos = bloques.map((b): Bloque => {
    if (b.blockType === "cifras") {
      const cifras = (b.cifras ?? []) as { etiqueta?: string }[];
      const tiene = (t: string) => cifras.some((c) => c.etiqueta?.toLowerCase().includes(t));
      const extra = [
        ...(tiene("cobertura")
          ? []
          : [{ prefijo: "", numero: 100, sufijo: "%", etiqueta: "Cobertura nacional" }]),
        ...(tiene("repuestos")
          ? []
          : [{ prefijo: "", numero: 10000, sufijo: "+", etiqueta: "Repuestos disponibles" }]),
      ];
      return { ...b, cifras: [...cifras, ...extra] };
    }
    if (b.blockType === "presentacionImagen") {
      return {
        ...b,
        ...(mapa ? { lottie: mapa.id } : {}),
        titulo: nuevoTexto(b.titulo),
        botonTexto: nuevoTexto(b.botonTexto),
        botonEnlace: "/contactanos/",
      };
    }
    if (b.blockType === "franjaMarquee") return { ...b, texto: nuevoTexto(b.texto) };
    if (b.blockType === "tarjetasExpandibles") {
      const tarjetas = ((b.tarjetas ?? []) as Record<string, unknown>[]).map((t) => ({
        ...t,
        titulo: nuevoTexto(t.titulo),
      }));
      const sinBoton = !(b.botonTexto as string | undefined)?.trim();
      return {
        ...b,
        tarjetas,
        ...(sinBoton ? { botonTexto: "Ver todo", botonEnlace: "/maquinaria-pesada/" } : {}),
      };
    }
    return b;
  });
  fs.writeFileSync(MANIFIESTO, JSON.stringify({ paginaId: pagina.id, bloques }, null, 2));
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { bloques: nuevos } as never,
  });
  log(`✓ aplicado (manifiesto: ${MANIFIESTO})`);
}
