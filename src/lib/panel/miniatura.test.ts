import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { primeraImagen, urlMiniatura } from "./miniatura";

describe("urlMiniatura", () => {
  it("pasa por el optimizador a 128 px", () => {
    assert.equal(
      urlMiniatura("https://x.public.blob.vercel-storage.com/a b.webp"),
      "/_next/image?url=https%3A%2F%2Fx.public.blob.vercel-storage.com%2Fa%20b.webp&w=128&q=75",
    );
    assert.equal(urlMiniatura(""), null);
    assert.equal(urlMiniatura(undefined), null);
  });
});

describe("primeraImagen", () => {
  it("acepta id, lista de ids u objetos poblados", () => {
    assert.equal(primeraImagen(7), 7);
    assert.equal(primeraImagen([3, 4]), 3);
    assert.equal(primeraImagen([{ id: 9, url: "x" }]), 9);
    assert.equal(primeraImagen([]), null);
    assert.equal(primeraImagen(null), null);
  });
});
