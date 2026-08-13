/**
 * Importador CSV -> Payload (API local).
 *
 * Uso:   npm run import
 *        (equivale a `payload run scripts/import/import.ts`)
 *
 * Características:
 * - Se ejecuta LOCALMENTE, no como función serverless: las operaciones masivas
 *   exceden los timeouts de Vercel y presionan el pool de conexiones.
 * - IDEMPOTENTE: busca por slug (dentro de su contexto) y actualiza si existe,
 *   crea si no. Correrlo dos veces no duplica nada.
 * - Respeta el orden de dependencias: Marcas -> Tipos -> Modelos (+ Categorías),
 *   y después la sección de maquinaria, que tiene su propia jerarquía paralela
 *   (ADR 0007). Las relaciones se resuelven por SLUG, no por id.
 * - Valida antes de escribir: si un tipo/modelo referencia algo inexistente,
 *   lo reporta como error y NO escribe ese registro.
 * - Reporte final con creados/actualizados/omitidos/errores y sale con código
 *   distinto de 0 si hubo errores (falla ruidosa, nunca en silencio).
 *
 * El slug viene EXPLÍCITO en el CSV (los slugs reales de Partequipos son
 * descriptivos y no derivan del nombre). El hook de slug normaliza un slug ya
 * válido a sí mismo, así que se respeta tal cual.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";

import { normalizarRuta } from "../../src/lib/redirects/normalizar";
import type { CollectionSlug, Where } from "payload";

/*
 * SEGURIDAD DE ESQUEMA: este script mueve DATOS, nunca estructura.
 *
 * Se marca antes de cargar la config para que el adaptador arranque con el push
 * desactivado. Sin esto, lanzarlo desde una máquina de desarrollo contra la base
 * de producción activa el push (porque `payload run` no fija `NODE_ENV`), altera
 * el esquema y deja el marcador `dev` que cuelga el build. Ver CLAUDE.md §10.9.
 *
 * El import de la config es DINÁMICO a propósito: los `import` estáticos se
 * evalúan antes que cualquier sentencia del módulo, así que la variable llegaría
 * tarde.
 */
process.env.PAYLOAD_DISABLE_PUSH = "true";

// Import RELATIVO del config (evita depender de la resolución del alias
// @payload-config fuera del runtime de Next).
const { default: config } = await import("../../src/payload.config");

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(dirname, "data");

// ---------------------------------------------------------------------------
// Parser CSV (RFC-4180: campos entre comillas, comas y saltos internos, "" escapado)
// ---------------------------------------------------------------------------
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      record.push(field);
      field = "";
    } else if (ch === "\n") {
      record.push(field);
      rows.push(record);
      record = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    rows.push(record);
  }

  const header = rows.shift();
  if (!header) return [];
  const keys = header.map((h) => h.trim());

  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      keys.forEach((key, idx) => {
        obj[key] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

function readCSV(name: string): Record<string, string>[] {
  const file = path.join(dataDir, name);
  if (!fs.existsSync(file)) {
    throw new Error(`No se encontró el CSV requerido: ${file}`);
  }
  return parseCSV(fs.readFileSync(file, "utf8"));
}

/** Devuelve el valor si no está vacío; si está vacío devuelve undefined. */
function opt(value: string | undefined): string | undefined {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : undefined;
}

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------
type Report = {
  creados: string[];
  actualizados: string[];
  omitidos: string[];
  errores: string[];
};

async function main(): Promise<number> {
  const payload = await getPayload({ config });
  const report: Report = { creados: [], actualizados: [], omitidos: [], errores: [] };

  // Caches slug -> id para resolver relaciones sin repetir consultas.
  const marcaIdBySlug = new Map<string, number>();
  const tipoIdByKey = new Map<string, number>(); // key = `${marcaId}::${tipoSlug}`

  async function findOne(collection: CollectionSlug, where: Where) {
    const res = await payload.find({ collection, where, limit: 1, depth: 0, pagination: false });
    return res.docs[0] ?? null;
  }

  // --- MARCAS ---------------------------------------------------------------
  for (const row of readCSV("marcas.csv")) {
    const label = `Marca "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      if (!nombre || !slug) {
        report.omitidos.push(`${label}: falta nombre o slug`);
        continue;
      }
      // OJO: no tocamos `logo` en el update -> se conservan los logos ya subidos.
      const data = { nombre, slug, descripcion: opt(row.descripcion) };
      const existing = await findOne("marcas", { slug: { equals: slug } });
      if (existing) {
        const doc = await payload.update({ collection: "marcas", id: existing.id, data });
        marcaIdBySlug.set(slug, doc.id);
        report.actualizados.push(label);
      } else {
        const doc = await payload.create({ collection: "marcas", data });
        marcaIdBySlug.set(slug, doc.id);
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  async function resolveMarcaId(slug: string): Promise<number | null> {
    if (marcaIdBySlug.has(slug)) return marcaIdBySlug.get(slug) ?? null;
    const doc = await findOne("marcas", { slug: { equals: slug } });
    if (doc) marcaIdBySlug.set(slug, doc.id);
    return doc?.id ?? null;
  }

  // --- TIPOS ----------------------------------------------------------------
  for (const row of readCSV("tipos.csv")) {
    const label = `Tipo "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      const marcaSlug = opt(row.marca_slug);
      if (!nombre || !slug || !marcaSlug) {
        report.omitidos.push(`${label}: falta nombre, slug o marca_slug`);
        continue;
      }
      const marcaId = await resolveMarcaId(marcaSlug);
      if (marcaId === null) {
        report.errores.push(`${label}: la marca "${marcaSlug}" no existe`);
        continue;
      }
      const data = {
        nombre,
        slug,
        marca: marcaId,
        descripcion: opt(row.descripcion),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("tipos-equipo", {
        and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }],
      });
      let id: number;
      if (existing) {
        const doc = await payload.update({ collection: "tipos-equipo", id: existing.id, data });
        id = doc.id;
        report.actualizados.push(label);
      } else {
        const doc = await payload.create({ collection: "tipos-equipo", data });
        id = doc.id;
        report.creados.push(label);
      }
      tipoIdByKey.set(`${marcaId}::${slug}`, id);
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  async function resolveTipoId(marcaId: number, slug: string): Promise<number | null> {
    const key = `${marcaId}::${slug}`;
    if (tipoIdByKey.has(key)) return tipoIdByKey.get(key) ?? null;
    const doc = await findOne("tipos-equipo", {
      and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }],
    });
    if (doc) tipoIdByKey.set(key, doc.id);
    return doc?.id ?? null;
  }

  // --- MODELOS --------------------------------------------------------------
  for (const row of readCSV("modelos.csv")) {
    const label = `Modelo "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      const marcaSlug = opt(row.marca_slug);
      const tipoSlug = opt(row.tipo_slug);
      if (!nombre || !slug || !marcaSlug || !tipoSlug) {
        report.omitidos.push(`${label}: falta nombre, slug, marca_slug o tipo_slug`);
        continue;
      }
      const marcaId = await resolveMarcaId(marcaSlug);
      if (marcaId === null) {
        report.errores.push(`${label}: la marca "${marcaSlug}" no existe`);
        continue;
      }
      const tipoId = await resolveTipoId(marcaId, tipoSlug);
      if (tipoId === null) {
        report.errores.push(`${label}: el tipo "${tipoSlug}" no existe en la marca "${marcaSlug}"`);
        continue;
      }
      const data = {
        nombre,
        slug,
        marca: marcaId,
        tipo: tipoId,
        codigo: opt(row.codigo),
        descripcion: opt(row.descripcion),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("modelos-repuesto", {
        and: [{ tipo: { equals: tipoId } }, { slug: { equals: slug } }],
      });
      if (existing) {
        await payload.update({ collection: "modelos-repuesto", id: existing.id, data });
        report.actualizados.push(label);
      } else {
        await payload.create({ collection: "modelos-repuesto", data });
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  // --- CATEGORÍAS TÉCNICAS --------------------------------------------------
  for (const row of readCSV("categorias.csv")) {
    const label = `Categoría "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      if (!nombre || !slug) {
        report.omitidos.push(`${label}: falta nombre o slug`);
        continue;
      }
      const data = {
        nombre,
        slug,
        descripcion: opt(row.descripcion),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("categorias-tecnicas", { slug: { equals: slug } });
      if (existing) {
        await payload.update({ collection: "categorias-tecnicas", id: existing.id, data });
        report.actualizados.push(label);
      } else {
        await payload.create({ collection: "categorias-tecnicas", data });
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  // ==========================================================================
  // MAQUINARIA (ADR 0007)
  //
  // Jerarquía propia y separada de repuestos: marcas -> tipos -> equipos, más
  // las categorías transversales de la línea nueva y las de la línea usada con
  // su inventario. Mismos slugs que el sitio actual, tomados del crawl.
  // ==========================================================================
  const marcaMaqIdBySlug = new Map<string, number>();
  const tipoMaqIdByKey = new Map<string, number>(); // key = `${marcaId}::${tipoSlug}`

  // --- MARCAS DE MAQUINARIA -------------------------------------------------
  for (const row of readCSV("maquinaria-marcas.csv")) {
    const label = `Marca de maquinaria "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      if (!nombre || !slug) {
        report.omitidos.push(`${label}: falta nombre o slug`);
        continue;
      }
      const data = { nombre, slug, descripcion: opt(row.descripcion) };
      const existing = await findOne("marcas-maquinaria", { slug: { equals: slug } });
      if (existing) {
        const doc = await payload.update({
          collection: "marcas-maquinaria",
          id: existing.id,
          data,
        });
        marcaMaqIdBySlug.set(slug, doc.id);
        report.actualizados.push(label);
      } else {
        const doc = await payload.create({ collection: "marcas-maquinaria", data });
        marcaMaqIdBySlug.set(slug, doc.id);
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  async function resolveMarcaMaqId(slug: string): Promise<number | null> {
    if (marcaMaqIdBySlug.has(slug)) return marcaMaqIdBySlug.get(slug) ?? null;
    const doc = await findOne("marcas-maquinaria", { slug: { equals: slug } });
    if (doc) marcaMaqIdBySlug.set(slug, doc.id);
    return doc?.id ?? null;
  }

  // --- TIPOS DE MAQUINARIA --------------------------------------------------
  for (const row of readCSV("maquinaria-tipos.csv")) {
    const label = `Tipo de maquinaria "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      const marcaSlug = opt(row.marca_slug);
      if (!nombre || !slug || !marcaSlug) {
        report.omitidos.push(`${label}: falta nombre, slug o marca_slug`);
        continue;
      }
      const marcaId = await resolveMarcaMaqId(marcaSlug);
      if (marcaId === null) {
        report.errores.push(`${label}: la marca "${marcaSlug}" no existe`);
        continue;
      }
      const data = {
        nombre,
        slug,
        marca: marcaId,
        descripcion: opt(row.descripcion),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("tipos-maquinaria", {
        and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }],
      });
      let id: number;
      if (existing) {
        const doc = await payload.update({ collection: "tipos-maquinaria", id: existing.id, data });
        id = doc.id;
        report.actualizados.push(label);
      } else {
        const doc = await payload.create({ collection: "tipos-maquinaria", data });
        id = doc.id;
        report.creados.push(label);
      }
      tipoMaqIdByKey.set(`${marcaId}::${slug}`, id);
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  async function resolveTipoMaqId(marcaId: number, slug: string): Promise<number | null> {
    const key = `${marcaId}::${slug}`;
    if (tipoMaqIdByKey.has(key)) return tipoMaqIdByKey.get(key) ?? null;
    const doc = await findOne("tipos-maquinaria", {
      and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }],
    });
    if (doc) tipoMaqIdByKey.set(key, doc.id);
    return doc?.id ?? null;
  }

  /*
   * Ficha técnica de DEMOSTRACIÓN.
   *
   * Las etiquetas son plausibles para una excavadora, pero los valores dicen
   * explícitamente que no hay dato. Es deliberado: publicar specs inventadas de
   * una máquina real sería peor que no publicar ninguna. Solo la lleva la ficha
   * marcada con `ficha_tecnica_demo` en el CSV, para comprobar que la tabla
   * renderiza. El resto van con el array vacío.
   */
  const PENDIENTE = "— dato pendiente del fabricante —";
  const FICHA_TECNICA_DEMO = [
    { etiqueta: "Peso operativo", valor: PENDIENTE },
    { etiqueta: "Potencia neta", valor: PENDIENTE },
    { etiqueta: "Capacidad del cucharón", valor: PENDIENTE },
    { etiqueta: "Profundidad máxima de excavación", valor: PENDIENTE },
    { etiqueta: "Alcance máximo", valor: PENDIENTE },
  ];

  // --- EQUIPOS NUEVOS -------------------------------------------------------
  for (const row of readCSV("maquinaria-equipos.csv")) {
    const label = `Equipo nuevo "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      const marcaSlug = opt(row.marca_slug);
      const tipoSlug = opt(row.tipo_slug);
      if (!nombre || !slug || !marcaSlug || !tipoSlug) {
        report.omitidos.push(`${label}: falta nombre, slug, marca_slug o tipo_slug`);
        continue;
      }
      const marcaId = await resolveMarcaMaqId(marcaSlug);
      if (marcaId === null) {
        report.errores.push(`${label}: la marca "${marcaSlug}" no existe`);
        continue;
      }
      const tipoId = await resolveTipoMaqId(marcaId, tipoSlug);
      if (tipoId === null) {
        report.errores.push(`${label}: el tipo "${tipoSlug}" no existe en la marca "${marcaSlug}"`);
        continue;
      }

      // Los destacados vienen en una sola celda separados por "|".
      const destacados = (opt(row.destacados) ?? "")
        .split("|")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((texto) => ({ texto }));

      const data = {
        nombre,
        slug,
        marca: marcaId,
        tipo: tipoId,
        codigo: opt(row.codigo),
        entradilla: opt(row.entradilla),
        destacados,
        fichaTecnica: opt(row.ficha_tecnica_demo) ? FICHA_TECNICA_DEMO : [],
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("equipos-nuevos", {
        and: [{ tipo: { equals: tipoId } }, { slug: { equals: slug } }],
      });
      if (existing) {
        await payload.update({ collection: "equipos-nuevos", id: existing.id, data });
        report.actualizados.push(label);
      } else {
        await payload.create({ collection: "equipos-nuevos", data });
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  // --- CATEGORÍAS TRANSVERSALES DE LA LÍNEA NUEVA ---------------------------
  for (const row of readCSV("maquinaria-categorias.csv")) {
    const label = `Categoría de maquinaria nueva "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      if (!nombre || !slug) {
        report.omitidos.push(`${label}: falta nombre o slug`);
        continue;
      }

      // `tipos` viene como "marca_slug:tipo_slug|marca_slug:tipo_slug".
      const tiposIncluidos: number[] = [];
      for (const par of (opt(row.tipos) ?? "").split("|").filter(Boolean)) {
        const [marcaSlug, tipoSlug] = par.split(":").map((s) => s.trim());
        if (!marcaSlug || !tipoSlug) continue;
        const marcaId = await resolveMarcaMaqId(marcaSlug);
        const tipoId = marcaId === null ? null : await resolveTipoMaqId(marcaId, tipoSlug);
        if (tipoId === null) {
          report.errores.push(`${label}: el tipo "${par}" no existe`);
          continue;
        }
        tiposIncluidos.push(tipoId);
      }

      const data = {
        nombre,
        slug,
        descripcion: opt(row.descripcion),
        tiposIncluidos,
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("categorias-maquinaria", { slug: { equals: slug } });
      if (existing) {
        await payload.update({ collection: "categorias-maquinaria", id: existing.id, data });
        report.actualizados.push(label);
      } else {
        await payload.create({ collection: "categorias-maquinaria", data });
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  // --- CATEGORÍAS DE LA LÍNEA USADA -----------------------------------------
  const categoriaUsadaIdBySlug = new Map<string, number>();

  for (const row of readCSV("maquinaria-usada-categorias.csv")) {
    const label = `Categoría de usada "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      if (!nombre || !slug) {
        report.omitidos.push(`${label}: falta nombre o slug`);
        continue;
      }
      const data = {
        nombre,
        slug,
        descripcion: opt(row.descripcion),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("categorias-usada", { slug: { equals: slug } });
      if (existing) {
        const doc = await payload.update({ collection: "categorias-usada", id: existing.id, data });
        categoriaUsadaIdBySlug.set(slug, doc.id);
        report.actualizados.push(label);
      } else {
        const doc = await payload.create({ collection: "categorias-usada", data });
        categoriaUsadaIdBySlug.set(slug, doc.id);
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  /*
   * --- INVENTARIO DE USADA -------------------------------------------------
   *
   * `EquipoUsado` no tiene slug (no es una página), así que la identidad para la
   * idempotencia es el par (categoría, nombre). No es tan sólida como un slug
   * único, pero es lo que hay: dos unidades distintas con el mismo nombre en la
   * misma categoría se pisarían. Para datos de demostración es suficiente; con
   * inventario real conviene un campo de referencia interna.
   */
  for (const row of readCSV("maquinaria-usada-equipos.csv")) {
    const label = `Equipo usado "${row.nombre}"`;
    try {
      const nombre = opt(row.nombre);
      const categoriaSlug = opt(row.categoria_slug);
      if (!nombre || !categoriaSlug) {
        report.omitidos.push(`${label}: falta nombre o categoria_slug`);
        continue;
      }
      const categoriaId =
        categoriaUsadaIdBySlug.get(categoriaSlug) ??
        (await findOne("categorias-usada", { slug: { equals: categoriaSlug } }))?.id ??
        null;
      if (categoriaId === null) {
        report.errores.push(`${label}: la categoría "${categoriaSlug}" no existe`);
        continue;
      }

      const numero = (v: string | undefined) => {
        const n = Number(opt(v));
        return Number.isFinite(n) ? n : undefined;
      };

      const data = {
        nombre,
        categoria: categoriaId,
        marca: opt(row.marca),
        modelo: opt(row.modelo),
        anio: numero(row.anio),
        horometro: numero(row.horometro),
        ubicacion: opt(row.ubicacion),
        descripcion: opt(row.descripcion),
        disponible: opt(row.disponible) === "si",
      };
      const existing = await findOne("equipos-usados", {
        and: [{ categoria: { equals: categoriaId } }, { nombre: { equals: nombre } }],
      });
      if (existing) {
        await payload.update({ collection: "equipos-usados", id: existing.id, data });
        report.actualizados.push(label);
      } else {
        await payload.create({ collection: "equipos-usados", data });
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  // ==========================================================================
  // LUBRICANTES
  //
  // Dos niveles: marca -> categoría de aplicación. No hay fichas de producto
  // porque el sitio actual no publica ninguna.
  // ==========================================================================
  const marcaLubIdBySlug = new Map<string, number>();

  for (const row of readCSV("lubricantes-marcas.csv")) {
    const label = `Marca de lubricante "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      if (!nombre || !slug) {
        report.omitidos.push(`${label}: falta nombre o slug`);
        continue;
      }
      const data = {
        nombre,
        slug,
        entradilla: opt(row.entradilla),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("marcas-lubricante", { slug: { equals: slug } });
      if (existing) {
        const doc = await payload.update({
          collection: "marcas-lubricante",
          id: existing.id,
          data,
        });
        marcaLubIdBySlug.set(slug, doc.id);
        report.actualizados.push(label);
      } else {
        const doc = await payload.create({ collection: "marcas-lubricante", data });
        marcaLubIdBySlug.set(slug, doc.id);
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  for (const row of readCSV("lubricantes-categorias.csv")) {
    const label = `Categoría de lubricante "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      const marcaSlug = opt(row.marca_slug);
      if (!nombre || !slug || !marcaSlug) {
        report.omitidos.push(`${label}: falta nombre, slug o marca_slug`);
        continue;
      }
      const marcaId =
        marcaLubIdBySlug.get(marcaSlug) ??
        (await findOne("marcas-lubricante", { slug: { equals: marcaSlug } }))?.id ??
        null;
      if (marcaId === null) {
        report.errores.push(`${label}: la marca "${marcaSlug}" no existe`);
        continue;
      }

      /*
       * `productos` se deja SIN tocar a propósito: no tenemos el catálogo real
       * de la marca y publicar viscosidades o especificaciones inventadas de un
       * lubricante que existe sería peor que no publicar nada.
       */
      const data = {
        nombre,
        slug,
        marca: marcaId,
        entradilla: opt(row.entradilla),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("categorias-lubricante", {
        and: [{ marca: { equals: marcaId } }, { slug: { equals: slug } }],
      });
      if (existing) {
        await payload.update({ collection: "categorias-lubricante", id: existing.id, data });
        report.actualizados.push(label);
      } else {
        await payload.create({ collection: "categorias-lubricante", data });
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  // ==========================================================================
  // BLOG
  //
  // Los artículos se publican en la RAÍZ (`/{slug}/`), el mismo espacio de
  // nombres que las páginas institucionales. El hook `slugUnicoFrenteA` corre
  // también aquí —es un hook de colección, no del panel—, así que una colisión
  // introducida desde este script se rechaza igual y sale como error en el
  // reporte, en vez de dejar un artículo inalcanzable en silencio.
  // ==========================================================================
  const categoriaBlogIdBySlug = new Map<string, number>();

  for (const row of readCSV("blog-categorias.csv")) {
    const label = `Categoría de blog "${row.slug}"`;
    try {
      const nombre = opt(row.nombre);
      const slug = opt(row.slug);
      if (!nombre || !slug) {
        report.omitidos.push(`${label}: falta nombre o slug`);
        continue;
      }
      const data = {
        nombre,
        slug,
        descripcion: opt(row.descripcion),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("categorias-blog", { slug: { equals: slug } });
      if (existing) {
        const doc = await payload.update({ collection: "categorias-blog", id: existing.id, data });
        categoriaBlogIdBySlug.set(slug, doc.id);
        report.actualizados.push(label);
      } else {
        const doc = await payload.create({ collection: "categorias-blog", data });
        categoriaBlogIdBySlug.set(slug, doc.id);
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  for (const row of readCSV("blog-articulos.csv")) {
    const label = `Artículo "${row.slug}"`;
    try {
      const titulo = opt(row.titulo);
      const slug = opt(row.slug);
      const fechaPublicacion = opt(row.fechaPublicacion);
      if (!titulo || !slug || !fechaPublicacion) {
        report.omitidos.push(`${label}: falta titulo, slug o fechaPublicacion`);
        continue;
      }

      const categoriaSlug = opt(row.categoria_slug);
      const categoriaId = categoriaSlug
        ? (categoriaBlogIdBySlug.get(categoriaSlug) ??
          (await findOne("categorias-blog", { slug: { equals: categoriaSlug } }))?.id ??
          null)
        : null;
      if (categoriaSlug && categoriaId === null) {
        report.errores.push(`${label}: la categoría "${categoriaSlug}" no existe`);
        continue;
      }

      const data = {
        titulo,
        slug,
        fechaPublicacion: new Date(`${fechaPublicacion}T12:00:00.000Z`).toISOString(),
        autor: opt(row.autor),
        entradilla: opt(row.entradilla),
        ...(categoriaId !== null ? { categoria: categoriaId } : {}),
        seo: { metaTitle: opt(row.metaTitle), metaDescription: opt(row.metaDescription) },
      };
      const existing = await findOne("articulos", { slug: { equals: slug } });
      if (existing) {
        await payload.update({ collection: "articulos", id: existing.id, data });
        report.actualizados.push(label);
      } else {
        await payload.create({ collection: "articulos", data });
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  // ==========================================================================
  // REDIRECTS 301
  //
  // Solo se cargan las URLs que CAMBIAN de destino. Las 618 rutas conservadas
  // idénticas no necesitan redirect: emitir uno de `/x/` a `/x/` sería un bucle.
  //
  // Las que dependen de una decisión del cliente (landings de campaña,
  // /blog-partequipos/, /lubricantes-eni/, /pe-partsshop/) y la basura NO se
  // cargan: quedan listadas en docs/redirects-cobertura.md.
  //
  // La colección normaliza `desde` y `hacia` en sus propios hooks, y valida
  // cadenas y bucles (ADR 0005), así que aquí no se replica esa lógica.
  // ==========================================================================
  for (const row of readCSV("redirects.csv")) {
    const label = `Redirect "${row.desde}"`;
    try {
      const desde = opt(row.desde);
      const hacia = opt(row.hacia);
      if (!desde || !hacia) {
        report.omitidos.push(`${label}: falta desde o hacia`);
        continue;
      }
      if (desde === hacia) {
        report.omitidos.push(`${label}: desde y hacia son iguales (sería un bucle)`);
        continue;
      }

      const data = {
        desde,
        hacia,
        tipo: (opt(row.tipo) ?? "301") as "301" | "302",
        origen: "migracion" as const,
        notas: opt(row.motivo),
      };

      /*
       * La búsqueda es por `desde` NORMALIZADO, no por el valor del CSV: la
       * colección le quita la barra final al guardar, así que buscar el valor
       * crudo no encontraría el registro existente y el script crearía un
       * duplicado en cada corrida — rompiendo la idempotencia.
       */
      const existing = await findOne("redirects", {
        desde: { equals: normalizarRuta(desde) },
      });
      if (existing) {
        await payload.update({ collection: "redirects", id: existing.id, data });
        report.actualizados.push(label);
      } else {
        await payload.create({ collection: "redirects", data });
        report.creados.push(label);
      }
    } catch (err) {
      report.errores.push(`${label}: ${(err as Error).message}`);
    }
  }

  // --- REPORTE --------------------------------------------------------------
  console.log("\n=========== IMPORTACIÓN — REPORTE ===========");
  console.log(`Creados:      ${report.creados.length}`);
  console.log(`Actualizados: ${report.actualizados.length}`);
  console.log(`Omitidos:     ${report.omitidos.length}`);
  console.log(`Errores:      ${report.errores.length}`);

  if (report.omitidos.length > 0) {
    console.log("\n--- Omitidos ---");
    report.omitidos.forEach((m) => console.log(`  · ${m}`));
  }
  if (report.errores.length > 0) {
    console.log("\n--- Errores ---");
    report.errores.forEach((m) => console.error(`  ✗ ${m}`));
  }
  console.log("=============================================\n");

  // Falla ruidosa: cualquier error o registro omitido corta con código != 0.
  return report.errores.length > 0 || report.omitidos.length > 0 ? 1 : 0;
}

// Top-level await: bloquea la evaluación del módulo hasta terminar. Es
// imprescindible con `payload run`, que espera a que el import del script se
// resuelva; sin esto el proceso saldría antes de ejecutar la importación.
try {
  const code = await main();
  process.exit(code);
} catch (err) {
  console.error("Importación abortada por un error no controlado:");
  console.error(err);
  process.exit(1);
}
