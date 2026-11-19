import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, it } from "node:test";

import type { Field } from "payload";

import { CategoriaTecnica } from "../CategoriaTecnica";
import { CategoriaUsada } from "../CategoriaUsada";
import { MarcaLubricante } from "../MarcaLubricante";
import { MarcaMaquinaria } from "../MarcaMaquinaria";
import { MarcaUsada } from "../MarcaUsada";
import { PreguntaFrecuente } from "../PreguntaFrecuente";
import { Sede } from "../Sede";
import { Testimonio } from "../Testimonio";
import { TipoMaquinaria } from "../TipoMaquinaria";
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
    for (const c of [Marca, TipoEquipo, MarcaMaquinaria, TipoMaquinaria, MarcaLubricante]) {
      assert.ok(c.hooks?.beforeOperation?.includes(joinsSoloEnElPanel), c.slug);
    }
  });

  it("los joins ordenables y las colecciones ordenables, como se aprobaron", () => {
    // Dentro de las pestañas sin nombre de la ficha (Contenido): se busca en todo el árbol.
    const todos = (campos: Field[]): Field[] =>
      campos.flatMap((f) =>
        f.type === "tabs"
          ? todos(f.tabs.flatMap((t) => t.fields))
          : !("name" in f) && "fields" in f
            ? todos(f.fields)
            : [f],
      );
    const join = (campos: Field[], nombre: string) =>
      todos(campos).find((f) => f.type === "join" && f.name === nombre) as
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
    // En la pestaña «Contenido» de su ficha.
    for (const [c, n] of [
      [Marca, "tipos"],
      [TipoEquipo, "modelos"],
      [MarcaMaquinaria, "tipos"],
      [TipoMaquinaria, "equipos"],
      [MarcaLubricante, "lineas"],
    ] as const) {
      const tabs = c.fields.find((f) => f.type === "tabs") as {
        tabs: { label: unknown; fields: Field[] }[];
      };
      const contenido = tabs.tabs.find((t) => t.label === "Contenido")!;
      assert.ok(
        todos(contenido.fields).some((f) => "name" in f && f.name === n),
        `${c.slug}.${n}`,
      );
    }
    for (const [c, coleccion, on] of [
      [MarcaMaquinaria, "tipos-maquinaria", "marca"],
      [TipoMaquinaria, "equipos-nuevos", "tipo"],
      [MarcaLubricante, "categorias-lubricante", "marca"],
    ] as const) {
      const j = todos(c.fields).find((f) => f.type === "join") as
        { collection: string; on: string; orderable?: boolean } | undefined;
      assert.deepEqual(
        [j?.collection, j?.on, j?.orderable],
        [coleccion, on, true],
        `join de ${c.slug}`,
      );
    }
    for (const c of [
      Marca,
      CategoriaTecnica,
      MarcaMaquinaria,
      CategoriaUsada,
      MarcaUsada,
      MarcaLubricante,
      Sede,
      Testimonio,
      PreguntaFrecuente,
    ]) {
      assert.equal(c.orderable, true, c.slug);
      // La lista se abre ordenada por el arrastre (si no, Payload no deja arrastrar).
      assert.ok(c.defaultSort === undefined || c.defaultSort === "_order", c.slug);
    }
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
