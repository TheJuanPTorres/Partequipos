import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { identificadoresDe, identificadoresLargos, MAX_IDENTIFICADOR } from "./identificadores";

const DIR = path.resolve("src/migrations");

describe("migraciones: ningún identificador de más de 63 bytes", () => {
  const snapshots = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));

  it("hay snapshots que revisar", () => {
    assert.ok(snapshots.length > 0);
  });

  for (const f of snapshots) {
    it(f, () => {
      const largos = identificadoresLargos(JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")));
      assert.deepEqual(
        largos,
        [],
        `Postgres recortaría a ${MAX_IDENTIFICADOR} bytes: ${largos.join(", ")}. Acorta el nombre del campo o de la colección.`,
      );
    });
  }
});

describe("el guardarraíl falla cuando debe", () => {
  // 64 bytes: uno de más.
  const largo = `${"a".repeat(57)}_fk_idx`;
  const snapshot = {
    tables: {
      "public.paginas": {
        name: "paginas",
        columns: { id: { name: "id" } },
        indexes: { [largo]: { name: largo } },
        foreignKeys: {},
      },
    },
    enums: { "public.enum_corto": { name: "enum_corto" } },
  };

  it("detecta un índice de 64 bytes", () => {
    assert.equal(Buffer.byteLength(largo), 64);
    assert.deepEqual(identificadoresLargos(snapshot), [largo]);
  });

  it("63 bytes exactos pasan", () => {
    const justo = "b".repeat(63);
    assert.deepEqual(identificadoresLargos({ tables: { [justo]: { name: justo } } }), []);
  });

  it("cuenta bytes, no caracteres (una tilde son 2 bytes)", () => {
    const conTilde = `${"c".repeat(62)}ó`; // 63 caracteres, 64 bytes
    assert.deepEqual(identificadoresLargos({ enums: { x: { name: conTilde } } }), [conTilde]);
  });

  it("recoge tablas, columnas, índices, claves foráneas y enums", () => {
    const ids = identificadoresDe({
      tables: {
        "public.t": {
          name: "t",
          columns: { c: { name: "c" } },
          indexes: { i: { name: "i" } },
          foreignKeys: { f: { name: "f" } },
        },
      },
      enums: { "public.e": { name: "e" } },
    });
    assert.deepEqual(ids.sort(), ["c", "e", "f", "i", "t"]);
  });
});
