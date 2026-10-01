import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { consultaEstructura, tipoPostgres, type Snapshot } from "./estructuraSnapshot";

describe("consulta de estructura desde el snapshot", () => {
  it("traduce los tipos de drizzle-kit a los de format_type", () => {
    assert.equal(tipoPostgres("serial"), "integer");
    assert.equal(tipoPostgres("varchar"), "character varying");
    assert.equal(tipoPostgres("varchar(20)"), "character varying(20)");
    assert.equal(tipoPostgres("timestamp(3) with time zone"), "timestamp(3) with time zone");
    assert.equal(tipoPostgres("enum_users_rol"), "enum_users_rol");
  });

  it("la clave primaria cuenta como NOT NULL y escapa comillas", () => {
    const sql = consultaEstructura({
      tables: {
        t: {
          name: "t",
          columns: {
            id: { name: "id", type: "serial", primaryKey: true },
            x: { name: "o'x", type: "varchar" },
          },
          indexes: { i: { name: "t_idx", isUnique: true } },
          foreignKeys: { f: { name: "t_fk" } },
        },
      },
      enums: { e: { name: "enum_e", values: ["a", "b"] } },
    });
    assert.match(sql, /\('t','id','integer',true\)/);
    assert.match(sql, /\('t','o''x','character varying',false\)/);
    assert.match(sql, /\('t','t_idx',true\)/);
    assert.match(sql, /\('t','t_fk'\)/);
    assert.match(sql, /\('enum_e','a,b'\)/);
  });

  it("sin índices ni claves foráneas no rompe la sintaxis (VALUES vacío)", () => {
    const sql = consultaEstructura({ tables: { t: { name: "t", columns: {} } } });
    assert.doesNotMatch(sql, /AS \(VALUES\n\)/);
    assert.match(sql, /WHERE false/);
  });

  it("genera la consulta del último snapshot real del repositorio", () => {
    const dir = path.join(process.cwd(), "src", "migrations");
    const ultimo = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .at(-1)!;
    const snap = JSON.parse(fs.readFileSync(path.join(dir, ultimo), "utf8")) as Snapshot;
    const sql = consultaEstructura(snap);
    assert.match(sql, /\('payload_migrations','id','integer',true\)/);
    assert.match(sql, /\('pie','imagen_decorativa_id','integer',false\)/);
  });
});
