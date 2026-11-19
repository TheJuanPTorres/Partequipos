import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import type { Access, CollectionBeforeOperationHook } from "payload";

import { Articulo } from "../collections/Articulo";
import { PaginaInstitucional } from "../collections/PaginaInstitucional";
import {
  COLECCIONES_CON_BORRADORES,
  MAXIMO_VERSIONES,
  nacePublicado,
  PUBLICADO,
  soloPublicado,
} from "./borradores";

/*
 * GUARDARRAÍL DE LOS BORRADORES (2026-11-19, PR 8). Un borrador nuevo o despublicado está en la
 * tabla principal con `_status = 'draft'`, y la API local no pasa por el control de acceso: una
 * consulta pública de páginas o artículos sin `soloPublicado` lo publicaría sin ningún error.
 */

const RAIZ = path.resolve(process.cwd(), "src");

/** El panel ve también los borradores: no son consultas públicas. */
const EXCLUIDOS = [
  path.join("src", "collections"),
  path.join("src", "app", "(payload)"),
  path.join("src", "components", "admin"),
  path.join("src", "lib", "panel"),
  path.join("src", "migrations"),
  // «Lo último modificado» de la portada del panel.
  path.join("src", "lib", "queries", "getPortadaPanel.ts"),
];

function ficheros(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ficheros(p);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });
}

/** El texto de la llamada (`find`, `count`, `findByID`…) que contiene `pos`. */
function llamada(texto: string, pos: number): { nombre: string; texto: string } {
  const [nombre, inicio] = [".find(", ".count(", ".findByID(", ".findGlobal("]
    .map((f) => [f, texto.lastIndexOf(f, pos)] as const)
    .reduce((a, b) => (b[1] > a[1] ? b : a));
  let nivel = 0;
  for (let i = texto.indexOf("(", inicio); i < texto.length; i++) {
    if (texto[i] === "(") nivel++;
    else if (texto[i] === ")" && --nivel === 0)
      return { nombre, texto: texto.slice(inicio, i + 1) };
  }
  return { nombre, texto: texto.slice(inicio) };
}

/** Las lecturas públicas de páginas o artículos que podrían devolver un borrador. */
function lecturasConBorradores(archivos: { ruta: string; texto: string }[]): string[] {
  const fallos: string[] = [];
  for (const { ruta, texto } of archivos)
    for (const c of COLECCIONES_CON_BORRADORES)
      for (const m of texto.matchAll(new RegExp(`collection: "${c}"`, "g"))) {
        const l = llamada(texto, m.index ?? 0);
        // `findByID` no filtra por estado: una lectura pública va por `find` con `soloPublicado`.
        const bien = l.nombre !== ".findByID(" && /\bsoloPublicado\(/.test(l.texto);
        if (!bien) fallos.push(`${ruta}:${texto.slice(0, m.index).split("\n").length} (${c})`);
      }
  return fallos;
}

describe("borradores: la web nunca lee uno", () => {
  it("toda consulta pública de páginas y artículos filtra lo publicado", () => {
    const archivos = ficheros(RAIZ)
      .map((p) => path.relative(process.cwd(), p))
      .filter((r) => !EXCLUIDOS.some((x) => r.startsWith(x)))
      .map((ruta) => ({ ruta, texto: fs.readFileSync(ruta, "utf8") }));
    assert.ok(archivos.length > 50, "no encontró el código del sitio");
    assert.deepEqual(lecturasConBorradores(archivos), []);
  });

  it("y falla cuando una se lo olvida (comprobación del guardián)", () => {
    const de = (cuerpo: string) => [{ ruta: "x.ts", texto: cuerpo }];
    assert.deepEqual(
      lecturasConBorradores(de(`await payload.find({\n  collection: "paginas",\n  limit: 0,\n});`)),
      ["x.ts:2 (paginas)"],
    );
    assert.deepEqual(
      lecturasConBorradores(
        de(`await payload.count({ collection: "articulos", where: { slug: { equals: "a" } } });`),
      ),
      ["x.ts:1 (articulos)"],
    );
    assert.deepEqual(
      lecturasConBorradores(de(`await payload.findByID({ collection: "paginas", id: 3 });`)),
      ["x.ts:1 (paginas)"],
    );
    assert.deepEqual(
      lecturasConBorradores(
        de(`await payload.find({ collection: "articulos", where: soloPublicado({ id: 1 }) });`),
      ),
      [],
    );
  });

  it("soloPublicado añade la condición a la que trae", () => {
    assert.deepEqual(soloPublicado(), { _status: { equals: "published" } });
    assert.deepEqual(soloPublicado({ slug: { equals: "a" } }), {
      and: [{ _status: { equals: "published" } }, { slug: { equals: "a" } }],
    });
  });
});

describe("borradores: la configuración", () => {
  const colecciones = [PaginaInstitucional, Articulo];

  it("páginas y artículos guardan versiones con borradores, sin guardado automático", () => {
    assert.deepEqual(
      colecciones.map((c) => c.slug),
      [...COLECCIONES_CON_BORRADORES],
    );
    for (const c of colecciones) {
      const v = c.versions;
      assert.ok(v && typeof v === "object", c.slug);
      assert.equal(v.maxPerDoc, MAXIMO_VERSIONES, c.slug);
      assert.deepEqual(v.drafts, { autosave: false }, c.slug);
      assert.ok(c.hooks?.beforeOperation?.includes(nacePublicado), c.slug);
    }
  });

  it("con el token de lectura, solo lo publicado; las versiones, solo el personal", async () => {
    const anterior = process.env.API_LECTURA_TOKEN;
    process.env.API_LECTURA_TOKEN = "x".repeat(40);
    try {
      for (const c of colecciones) {
        const req = {
          headers: new Headers({ "x-partequipos-lectura": "x".repeat(40) }),
          user: null,
        };
        const leer = c.access?.read as Access;
        assert.deepEqual(await leer({ req } as unknown as Parameters<Access>[0]), PUBLICADO);
        const versiones = c.access?.readVersions as Access;
        assert.equal(await versiones({ req } as unknown as Parameters<Access>[0]), false, c.slug);
      }
    } finally {
      if (anterior === undefined) delete process.env.API_LECTURA_TOKEN;
      else process.env.API_LECTURA_TOKEN = anterior;
    }
  });

  it("lo creado sin estado (un script) nace publicado; un borrador pedido, no", () => {
    const crear = (args: Record<string, unknown>, operation = "create") =>
      nacePublicado({ args, operation } as unknown as Parameters<CollectionBeforeOperationHook>[0]);
    const sinEstado = { data: { titulo: "a" } as Record<string, unknown> };
    crear(sinEstado);
    assert.equal(sinEstado.data._status, "published");
    const borrador = { data: { titulo: "a" } as Record<string, unknown>, draft: true };
    crear(borrador);
    assert.equal(borrador.data._status, undefined);
    const explicito = { data: { titulo: "a", _status: "draft" } };
    crear(explicito);
    assert.equal(explicito.data._status, "draft");
    const actualizar = { data: { titulo: "a" } as Record<string, unknown> };
    crear(actualizar, "update");
    assert.equal(actualizar.data._status, undefined);
  });
});
