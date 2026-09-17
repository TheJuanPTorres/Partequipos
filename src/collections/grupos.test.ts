import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { CollectionConfig } from "payload";

import { ICONOS_DE_GRUPO } from "../components/admin/Nav/iconos";

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

  it("detecta una colección sin grupo (comprobación del propio guardián)", () => {
    const sinGrupo = { slug: "inventada", admin: {} } as CollectionConfig;
    const grupo = sinGrupo.admin?.group;
    assert.equal(typeof grupo === "string" && GRUPOS_APROBADOS.includes(grupo), false);
  });

  /*
   * El menú propio (src/components/admin/Nav) pone un icono por grupo. Si
   * alguien renombra un grupo y olvida el icono, el grupo se queda sin él y no
   * avisa nada: el panel sigue funcionando.
   */
  it("todo grupo aprobado tiene icono en el menú", () => {
    for (const grupo of GRUPOS_APROBADOS) {
      assert.ok(ICONOS_DE_GRUPO[grupo], `el grupo «${grupo}» no tiene icono asignado`);
    }
  });

  it("no hay iconos de grupos que ya no existen", () => {
    for (const nombre of Object.keys(ICONOS_DE_GRUPO)) {
      assert.ok(GRUPOS_APROBADOS.includes(nombre), `«${nombre}» ya no es un grupo del menú`);
    }
  });
});

/*
 * Dos cosas que el menú propio NO pinta, porque sus componentes no se exportan o
 * no se usan. Si algún día se configuran, desaparecerían en silencio del panel:
 * estas pruebas lo convierten en un fallo de CI que apunta al fichero correcto.
 */
describe("lo que el menú propio no puede pintar", () => {
  it("settingsMenu y las carpetas siguen sin configurarse", async () => {
    const { default: config } = (await import("../payload.config")) as {
      default: Promise<{
        admin?: { components?: { settingsMenu?: unknown } };
        folders?: unknown;
      }>;
    };
    const resuelto = await config;

    assert.equal(
      resuelto.admin?.components?.settingsMenu,
      undefined,
      "settingsMenu está configurado y el menú propio no lo pinta: ver src/components/admin/Nav",
    );
    assert.ok(
      !resuelto.folders,
      "las carpetas están activas y el menú propio no pinta su botón: ver src/components/admin/Nav",
    );
  });
});
