import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { CollectionConfig } from "payload";

/**
 * Una colección sin `admin.group` no da error: Payload la mete en silencio en
 * «Colecciones», el grupo por defecto, que es justo el cajón de sastre que la
 * agrupación del menú eliminó (2026-09-17). Esta prueba convierte ese olvido en
 * un fallo de CI.
 */
const GRUPOS_APROBADOS = [
  "Comercial",
  "Repuestos",
  "Maquinaria",
  "Lubricantes",
  "Contenido",
  "Configuración",
];

const dir = path.dirname(fileURLToPath(import.meta.url));

async function cargarColecciones(): Promise<CollectionConfig[]> {
  const ficheros = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
  const colecciones: CollectionConfig[] = [];
  for (const fichero of ficheros) {
    const modulo: Record<string, unknown> = await import(
      pathToFileURL(path.join(dir, fichero)).href
    );
    for (const exportado of Object.values(modulo)) {
      if (
        typeof exportado === "object" &&
        exportado !== null &&
        "slug" in exportado &&
        "fields" in exportado
      ) {
        colecciones.push(exportado as CollectionConfig);
      }
    }
  }
  return colecciones;
}

describe("grupos del menú del panel", () => {
  it("encuentra las 19 colecciones", async () => {
    assert.equal((await cargarColecciones()).length, 19);
  });

  it("toda colección tiene un grupo aprobado", async () => {
    for (const coleccion of await cargarColecciones()) {
      const grupo = coleccion.admin?.group;
      assert.ok(
        typeof grupo === "string" && GRUPOS_APROBADOS.includes(grupo),
        `«${coleccion.slug}» tiene grupo ${JSON.stringify(grupo)}: caería en «Colecciones»`,
      );
    }
  });
});
