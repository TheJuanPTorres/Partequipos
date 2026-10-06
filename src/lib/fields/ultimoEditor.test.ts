import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CollectionConfig } from "payload";

import { CAMPO_ULTIMO_EDITOR, conUltimoEditor, ultimoEditor } from "./ultimoEditor";

describe("ultimoEditor", () => {
  it("con sesión, el usuario que guarda", () => {
    assert.equal(ultimoEditor({ id: 3, collection: "users" }, 1), 3);
  });

  it("sin sesión (un script), conserva el anterior y no lo borra", () => {
    assert.equal(ultimoEditor(null, 1), 1);
    assert.equal(ultimoEditor(undefined, { id: 2, email: "x" }), 2);
    assert.equal(ultimoEditor(null, undefined), null);
  });
});

describe("conUltimoEditor", () => {
  const c = (slug: string) => ({ slug, fields: [] }) as unknown as CollectionConfig;

  it("lo añade a las de contenido y nunca a Solicitudes ni Usuarios", () => {
    const r = conUltimoEditor([c("articulos"), c("solicitudes"), c("users"), c("media")]);
    const con = r.filter((x) =>
      x.fields.some((f) => "name" in f && f.name === CAMPO_ULTIMO_EDITOR),
    );
    assert.deepEqual(
      con.map((x) => x.slug),
      ["articulos", "media"],
    );
  });
});
