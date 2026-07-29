import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSitemapEntries } from "./sitemap";

process.env.NEXT_PUBLIC_SERVER_URL = "https://partequipos.com";

const AHORA = new Date("2026-07-28T00:00:00.000Z");

const datos = {
  marcas: [{ slug: "marca-a", updatedAt: "2026-07-20T10:00:00.000Z" }],
  tipos: [{ slug: "tipo-a", updatedAt: "2026-07-22T10:00:00.000Z", marcaSlug: "marca-a" }],
  modelos: [
    {
      slug: "modelo-a",
      updatedAt: "2026-07-25T10:00:00.000Z",
      marcaSlug: "marca-a",
      tipoSlug: "tipo-a",
    },
  ],
};

describe("buildSitemapEntries", () => {
  it("incluye los dos índices más una entrada por entidad", () => {
    const e = buildSitemapEntries(datos, AHORA);
    assert.equal(e.length, 5); // 2 índices + 1 marca + 1 tipo + 1 modelo
  });

  it("emite solo URLs absolutas", () => {
    for (const entrada of buildSitemapEntries(datos, AHORA)) {
      assert.match(entrada.url, /^https:\/\/partequipos\.com\//);
    }
  });

  it("construye la jerarquía completa en la URL del modelo", () => {
    const e = buildSitemapEntries(datos, AHORA);
    const modelo = e.find((x) => x.url.endsWith("/modelo-a"));

    assert.ok(modelo);
    assert.ok(modelo.url.includes("/marca-a/tipo-a/modelo-a"));
  });

  it("toma lastModified del updatedAt real de cada entidad", () => {
    const e = buildSitemapEntries(datos, AHORA);

    const marca = e.find((x) => x.url.endsWith("/marca-a"));
    assert.equal(marca?.lastModified.toISOString(), "2026-07-20T10:00:00.000Z");

    const modelo = e.find((x) => x.url.endsWith("/modelo-a"));
    assert.equal(modelo?.lastModified.toISOString(), "2026-07-25T10:00:00.000Z");
  });

  it("los índices usan la fecha más reciente de lo que listan", () => {
    const e = buildSitemapEntries(
      {
        ...datos,
        marcas: [
          { slug: "m1", updatedAt: "2026-07-01T00:00:00.000Z" },
          { slug: "m2", updatedAt: "2026-07-26T00:00:00.000Z" },
        ],
      },
      AHORA,
    );

    assert.equal(e[0]?.lastModified.toISOString(), "2026-07-26T00:00:00.000Z");
  });

  it("cae a la fecha actual si updatedAt falta o es inválido", () => {
    const e = buildSitemapEntries(
      { marcas: [{ slug: "m", updatedAt: null }], tipos: [], modelos: [] },
      AHORA,
    );
    const marca = e.find((x) => x.url.endsWith("/m"));
    assert.equal(marca?.lastModified.getTime(), AHORA.getTime());

    const invalida = buildSitemapEntries(
      { marcas: [{ slug: "m", updatedAt: "no-es-fecha" }], tipos: [], modelos: [] },
      AHORA,
    );
    assert.equal(
      invalida.find((x) => x.url.endsWith("/m"))?.lastModified.getTime(),
      AHORA.getTime(),
    );
  });

  it("con catálogo vacío devuelve solo los índices, sin romperse", () => {
    const e = buildSitemapEntries({ marcas: [], tipos: [], modelos: [] }, AHORA);

    assert.equal(e.length, 2);
    assert.equal(e[0]?.lastModified.getTime(), AHORA.getTime());
    for (const entrada of e) assert.match(entrada.url, /^https:\/\//);
  });

  it("no genera URLs duplicadas", () => {
    const e = buildSitemapEntries(datos, AHORA);
    assert.equal(new Set(e.map((x) => x.url)).size, e.length);
  });

  it("da más prioridad a los índices que a las fichas", () => {
    const e = buildSitemapEntries(datos, AHORA);
    const indice = e[0];
    const modelo = e.find((x) => x.url.endsWith("/modelo-a"));

    assert.ok(indice && modelo);
    assert.ok(indice.priority > modelo.priority);
  });
});
