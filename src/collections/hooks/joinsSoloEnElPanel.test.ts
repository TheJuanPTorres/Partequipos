import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, it } from "node:test";

import type { Field } from "payload";

import { CategoriaTecnica } from "../CategoriaTecnica";
import { Marca } from "../Marca";
import { TipoEquipo } from "../TipoEquipo";
import { joinsSoloEnElPanel } from "./joinsSoloEnElPanel";

type Args = Parameters<typeof joinsSoloEnElPanel>[0];
const llamar = (operation: string, user: unknown, joins?: unknown) =>
  joinsSoloEnElPanel({
    args: joins === undefined ? {} : { joins },
    operation,
    req: { user },
  } as unknown as Args) as { joins?: unknown };

describe("joins solo en el panel", () => {
  it("una lectura sin usuario (el sitio, los runbooks) va sin joins", () => {
    assert.equal(llamar("read", null).joins, false);
    assert.equal(llamar("read", undefined).joins, false);
  });

  it("el panel (con usuario) los lee, y una consulta que los pide expresamente también", () => {
    assert.equal(llamar("read", { id: 1 }).joins, undefined);
    assert.deepEqual(llamar("read", null, { tipos: { limit: 5 } }).joins, { tipos: { limit: 5 } });
  });

  it("no toca las escrituras", () => {
    assert.equal(llamar("update", null).joins, undefined);
    assert.equal(llamar("create", null).joins, undefined);
  });

  it("lo llevan las dos colecciones con join ordenable", () => {
    for (const c of [Marca, TipoEquipo]) {
      assert.ok(c.hooks?.beforeOperation?.includes(joinsSoloEnElPanel), c.slug);
    }
  });

  it("los joins ordenables y las colecciones ordenables, como se aprobaron", () => {
    const join = (campos: Field[], nombre: string) =>
      campos.find((f) => f.type === "join" && f.name === nombre) as
        { collection: string; on: string; orderable?: boolean } | undefined;
    assert.deepEqual(
      { ...join(Marca.fields, "tipos") },
      { ...join(Marca.fields, "tipos"), collection: "tipos-equipo", on: "marca", orderable: true },
    );
    assert.deepEqual(
      { ...join(TipoEquipo.fields, "modelos") },
      {
        ...join(TipoEquipo.fields, "modelos"),
        collection: "modelos-repuesto",
        on: "tipo",
        orderable: true,
      },
    );
    assert.equal(Marca.orderable, true);
    assert.equal(CategoriaTecnica.orderable, true);
  });

  // El gancho depende de que `find` lea `args.joins` DESPUÉS de `beforeOperation` (Payload 3.89).
  it("Payload aplica beforeOperation antes de leer joins en find y findByID", () => {
    // `payload` resuelve a `dist/index.js`: las operaciones están al lado.
    const dist = path.dirname(createRequire(import.meta.url).resolve("payload"));
    for (const op of ["find.js", "findByID.js"]) {
      const codigo = readFileSync(path.join(dist, "collections/operations", op), "utf8");
      const antes = codigo.indexOf("buildBeforeOperation");
      const lee = codigo.search(/\bjoins,/);
      assert.ok(antes > 0 && lee > antes, `${op}: el orden cambió; revisar joinsSoloEnElPanel`);
    }
  });
});
