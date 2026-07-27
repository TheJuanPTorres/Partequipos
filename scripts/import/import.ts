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
 * - Respeta el orden de dependencias: Marcas -> Tipos -> Modelos (+ Categorías).
 *   Las relaciones se resuelven por SLUG, no por id.
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
import type { CollectionSlug, Where } from "payload";

// Import RELATIVO del config (evita depender de la resolución del alias
// @payload-config fuera del runtime de Next).
import config from "../../src/payload.config";

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
