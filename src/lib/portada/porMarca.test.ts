import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { MARCA_EJEMPLO } from "../demo/copiaDemo";

import { buscarPorMarca, deLaMarca } from "./porMarca";

const DIR = path.join(process.cwd(), "scripts", "portada");
const SCRIPTS = fs.readdirSync(DIR).filter((f) => f.endsWith(".ts"));
const leer = (f: string) => fs.readFileSync(path.join(DIR, f), "utf8");

/** Las marcas de verdad, leídas de los propios scripts (así no se desfasan). */
const MARCAS = [
  ...SCRIPTS.flatMap((f) =>
    [...leer(f).matchAll(/const MARCA(?:_\w+)? = "([^"]+)"/g)].map((m) => m[1]!),
  ),
  MARCA_EJEMPLO,
];

describe("cada script encuentra solo lo suyo", () => {
  it("las marcas se leen de los scripts (al menos las 4 fases)", () => {
    for (const fase of ["E", "F", "G", "H"]) {
      assert.ok(MARCAS.includes(`PRUEBA FASE ${fase} —`), `falta la marca de la fase ${fase}`);
    }
  });

  it("con documentos de TODAS las marcas, cada marca selecciona solo los suyos", () => {
    const docs = MARCAS.flatMap((m) =>
      Array.from({ length: 15 }, (_, i) => ({ alt: `${m} imagen ${i}` })),
    );
    for (const marca of MARCAS) {
      const suyos = deLaMarca(docs, (d) => d.alt, marca);
      assert.equal(suyos.length, 15, marca);
      assert.ok(
        suyos.every((d) => d.alt.startsWith(marca)),
        marca,
      );
    }
  });

  it("buscarPorMarca: subcadena entera, sin paginación, y filtra por prefijo", async () => {
    let pedido: Record<string, unknown> | undefined;
    // Simula lo que devolvía `like`: las 4 fases mezcladas, más de 10 resultados.
    const mezcla = ["E", "F", "G", "H"].flatMap((f) =>
      Array.from({ length: 12 }, (_, i) => ({ id: `${f}${i}`, alt: `PRUEBA FASE ${f} — ${i}` })),
    );
    const payload = {
      find: async (args: Record<string, unknown>) => {
        pedido = args;
        return { docs: mezcla };
      },
    } as unknown as Parameters<typeof buscarPorMarca>[0];

    const r = await buscarPorMarca(payload, "media", "alt", "PRUEBA FASE F —");
    assert.equal(r.length, 12);
    assert.deepEqual(pedido?.where, { alt: { contains: "PRUEBA FASE F —" } });
    assert.equal(pedido?.pagination, false);
    assert.equal("limit" in (pedido ?? {}), false);
  });

  it("una marca vacía se rechaza (casaría con todo)", async () => {
    assert.throws(() => deLaMarca([{ a: "x" }], (d) => d.a, "  "));
    const payload = { find: async () => ({ docs: [] }) } as unknown as Parameters<
      typeof buscarPorMarca
    >[0];
    await assert.rejects(buscarPorMarca(payload, "media", "alt", ""));
  });
});

describe("guardarraíl: los scripts de siembra no buscan por marca a mano", () => {
  it("ningún `like:` en scripts/portada", () => {
    for (const f of SCRIPTS) assert.doesNotMatch(leer(f), /\blike:/, f);
  });

  it("ninguna consulta con la marca en el `where`: todas por buscarPorMarca", () => {
    for (const f of SCRIPTS) {
      assert.doesNotMatch(leer(f), /where:\s*\{[^}]*MARCA/, f);
    }
  });

  it("el guardarraíl detecta la forma antigua (su propia comprobación)", () => {
    const antigua =
      'await payload.find({ collection: "media", where: { alt: { like: MARCA } }, limit: 10 })';
    assert.match(antigua, /\blike:/);
    assert.match(antigua, /where:\s*\{[^}]*MARCA/);
  });
});
