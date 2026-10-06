import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { huerfanos, nombreDeUrl, nombresDeRegistro, type FicheroBlob } from "./huerfanos";

const f = (pathname: string, dia: number): FicheroBlob => ({
  pathname,
  size: 100,
  uploadedAt: new Date(Date.UTC(2026, 9, dia)),
});

describe("huérfanos del Blob", () => {
  it("un registro usa su filename, su url y los de sus tamaños", () => {
    assert.deepEqual(
      nombresDeRegistro({
        filename: "ficha-AbC.pdf",
        url: "https://abc.public.blob.vercel-storage.com/ficha-AbC.pdf",
        sizes: { tarjeta: { filename: "ficha-AbC-400x300.webp" }, vacio: { filename: null } },
      }),
      ["ficha-AbC.pdf", "ficha-AbC.pdf", "ficha-AbC-400x300.webp"],
    );
  });

  it("de una URL ajena o rota no sale ningún nombre", () => {
    assert.equal(nombreDeUrl("https://ejemplo.com/foto.png"), null);
    assert.equal(nombreDeUrl("/api/media/file/foto.png"), null);
    assert.equal(
      nombreDeUrl("https://abc.public.blob.vercel-storage.com/foto%20uno.png"),
      "foto uno.png",
    );
  });

  it("huérfano = en el almacén y sin registro que lo use, del más viejo al más nuevo", () => {
    const lista = huerfanos(
      [f("nuevo-sin-uso.pdf", 5), f("en-uso.png", 1), f("viejo-sin-uso.png", 2)],
      ["en-uso.png"],
    );
    assert.deepEqual(
      lista.map((x) => x.pathname),
      ["viejo-sin-uso.png", "nuevo-sin-uso.pdf"],
    );
  });
});
