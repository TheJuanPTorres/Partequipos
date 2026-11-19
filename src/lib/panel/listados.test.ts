import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { CollectionConfig } from "payload";

import { camposDeDatos, conListados, LISTADOS } from "./listados";

const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "collections");

async function colecciones(): Promise<CollectionConfig[]> {
  const todas: CollectionConfig[] = [];
  for (const f of readdirSync(carpeta).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
  )) {
    const m: Record<string, unknown> = await import(pathToFileURL(path.join(carpeta, f)).href);
    for (const e of Object.values(m)) {
      if (e && typeof e === "object" && "slug" in e && "fields" in e)
        todas.push(e as CollectionConfig);
    }
  }
  return todas;
}

// Los que Payload añade solo: fechas, y los de los ficheros en las colecciones de subida.
const AUTOMATICOS = new Set(["id", "createdAt", "updatedAt"]);
const DE_SUBIDA = new Set(["filename", "width", "height", "filesize", "mimeType", "url"]);

describe("listados del panel (PR 5)", () => {
  it("cada colección de la tabla existe, y sus columnas y campos de búsqueda también", async () => {
    const todas = await colecciones();
    for (const [slug, listado] of Object.entries(LISTADOS)) {
      const c = todas.find((x) => x.slug === slug);
      assert.ok(c, `«${slug}» no es una colección`);
      const nombres = new Set(
        camposDeDatos(c.fields).flatMap((f) => ("name" in f && f.name ? [f.name] : [])),
      );
      const existe = (n: string) =>
        nombres.has(n) || AUTOMATICOS.has(n) || (Boolean(c.upload) && DE_SUBIDA.has(n));
      for (const n of [...listado.columnas, ...(listado.busqueda ?? [])]) {
        assert.ok(existe(n), `«${slug}»: no existe el campo «${n}»`);
      }
    }
  });

  it("aplica columnas y búsqueda, y pinta como miniatura una columna de subida sin celda", () => {
    const [c] = conListados([
      {
        slug: "marcas",
        fields: [
          {
            type: "tabs",
            tabs: [
              { label: "Fotos", fields: [{ name: "logo", type: "upload", relationTo: "media" }] },
            ],
          },
          { name: "nombre", type: "text" },
        ],
      } as CollectionConfig,
    ]);
    assert.deepEqual(c?.admin?.defaultColumns, ["logo", "nombre"]);
    assert.deepEqual(c?.admin?.listSearchableFields, ["nombre"]);
    const logo = camposDeDatos(c!.fields).find((f) => "name" in f && f.name === "logo");
    assert.equal(
      (logo as { admin?: { components?: { Cell?: string } } }).admin?.components?.Cell,
      "/components/admin/celdas/CeldaMiniatura",
    );
  });

  it("una colección fuera de la tabla no cambia", () => {
    const original = { slug: "sedes", fields: [] } as unknown as CollectionConfig;
    assert.equal(conListados([original])[0], original);
  });
});

describe("una sola fuente de columnas", () => {
  it("las colecciones de LISTADOS no declaran sus propias columnas ni campos de búsqueda", async () => {
    const conPropias = (await colecciones())
      .filter((c) => LISTADOS[c.slug])
      .filter((c) => c.admin?.defaultColumns || c.admin?.listSearchableFields)
      .map((c) => c.slug);
    assert.deepEqual(conPropias, [], "van en src/lib/panel/listados.ts");
  });
});
