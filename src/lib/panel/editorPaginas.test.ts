import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decisionEditor, idDeRutaEditor, rutaDeAcceso } from "./editorPaginas";

describe("idDeRutaEditor", () => {
  it("lee el id de /admin/editor-paginas/<id>", () => {
    assert.equal(idDeRutaEditor(["editor-paginas", "12"]), 12);
  });

  it("sin id, con un id raro o con más segmentos, null", () => {
    assert.equal(idDeRutaEditor(["editor-paginas"]), null);
    assert.equal(idDeRutaEditor(["editor-paginas", "abc"]), null);
    assert.equal(idDeRutaEditor(["editor-paginas", "0"]), null);
    assert.equal(idDeRutaEditor(["editor-paginas", "12", "x"]), null);
    assert.equal(idDeRutaEditor(["editor-paginas", "../12"]), null);
    assert.equal(idDeRutaEditor(undefined), null);
  });
});

describe("decisionEditor (la vista propia decide ella misma quién entra)", () => {
  it("sin sesión, al acceso; sin permiso de escritura, sin permiso", () => {
    assert.deepEqual(decisionEditor({ conSesion: false, puedeEscribir: false, id: 3 }), {
      tipo: "acceso",
    });
    assert.deepEqual(decisionEditor({ conSesion: true, puedeEscribir: false, id: 3 }), {
      tipo: "sin-permiso",
    });
  });

  it("con permiso: sin id, no encontrada; con id, entra", () => {
    assert.deepEqual(decisionEditor({ conSesion: true, puedeEscribir: true, id: null }), {
      tipo: "no-encontrada",
    });
    assert.deepEqual(decisionEditor({ conSesion: true, puedeEscribir: true, id: 3 }), {
      tipo: "entrar",
      id: 3,
    });
  });
});

describe("rutaDeAcceso", () => {
  it("vuelve al editor al entrar", () => {
    assert.equal(
      rutaDeAcceso("/admin", "/admin/editor-paginas/3"),
      "/admin/login?redirect=%2Fadmin%2Feditor-paginas%2F3",
    );
  });
});
