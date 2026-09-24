import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { diapositivasDeHero, sizesFondoHero } from "./hero";

const media = (id: number, extra: object = {}) =>
  ({
    id,
    alt: `alt ${id}`,
    url: `https://x/${id}.jpg`,
    width: 800,
    height: 600,
    ...extra,
  }) as never;

describe("diapositivas del hero", () => {
  it("convierte una diapositiva completa", () => {
    const [d] = diapositivasDeHero({
      diapositivas: [
        {
          titulo: " Potencia Hitachi ",
          parrafo: "Texto",
          imagenFondo: media(1, { focalX: 20, focalY: 30 }),
          imagenFrontal: media(2),
          enlace: "/maquinaria-pesada/",
          enlaceNombre: "Ver maquinaria Hitachi",
        },
      ],
    });
    assert.equal(d?.titulo, "Potencia Hitachi");
    assert.equal(d?.fondo.alt, "", "el fondo es decorativo");
    assert.equal(d?.fondo.posicion, "20% 30%");
    assert.equal(d?.frontal?.alt, "alt 2");
    assert.deepEqual(d?.enlace, { href: "/maquinaria-pesada/", nombre: "Ver maquinaria Hitachi" });
  });

  it("descarta la diapositiva sin fondo utilizable (p. ej. imagen borrada: llega el id)", () => {
    assert.deepEqual(diapositivasDeHero({ diapositivas: [{ titulo: "X", imagenFondo: 7 }] }), []);
  });

  it("sin nombre accesible o con destino inválido, no hay enlace", () => {
    const [a] = diapositivasDeHero({
      diapositivas: [{ titulo: "X", imagenFondo: media(1), enlace: "/a/" }],
    });
    const [b] = diapositivasDeHero({
      diapositivas: [
        { titulo: "X", imagenFondo: media(1), enlace: "javascript:alert(1)", enlaceNombre: "n" },
      ],
    });
    assert.equal(a?.enlace, null);
    assert.equal(b?.enlace, null);
  });

  it("sin hero, ninguna diapositiva", () => {
    assert.deepEqual(diapositivasDeHero(undefined), []);
    assert.deepEqual(diapositivasDeHero({ diapositivas: null }), []);
  });
});

describe("sizes del fondo del hero", () => {
  it("Fondo.jpg (2048×1360): el alto manda por debajo de 1,30:1", () => {
    assert.equal(sizesFondoHero(2048, 1360), "(max-aspect-ratio: 130/100) 130vh, 100vw");
  });

  it("una foto más panorámica necesita más ancho en vertical", () => {
    assert.equal(sizesFondoHero(1920, 800), "(max-aspect-ratio: 207/100) 207vh, 100vw");
  });

  it("sin dimensiones, 100vw como antes", () => {
    assert.equal(sizesFondoHero(0, 800), "100vw");
    assert.equal(sizesFondoHero(Number.NaN, 800), "100vw");
  });
});
