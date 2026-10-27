import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  aHitachiLandcros,
  aHitachiLandcrosProfundo,
  esModeloAntiguoHitachi,
  nombraEmpresaHitachi,
  nombraHitachi,
} from "./hitachiLandcros";

describe("aHitachiLandcros", () => {
  it("una sola forma, venga como venga", () => {
    assert.equal(aHitachiLandcros("Hitachi"), "Hitachi LANDCROS");
    assert.equal(aHitachiLandcros("HITACHI"), "Hitachi LANDCROS");
    assert.equal(aHitachiLandcros("hitachi"), "Hitachi LANDCROS");
    assert.equal(aHitachiLandcros("Hitachi Landcros"), "Hitachi LANDCROS");
    assert.equal(aHitachiLandcros("HITACHI-LANDCROS"), "Hitachi LANDCROS");
    assert.equal(
      aHitachiLandcros("Excavadora HITACHI ZX350H-5B 2016"),
      "Excavadora Hitachi LANDCROS ZX350H-5B 2016",
    );
    assert.equal(
      aHitachiLandcros("repuestos disponibles para excavadora hitachi zx200"),
      "repuestos disponibles para excavadora Hitachi LANDCROS zx200",
    );
    assert.equal(aHitachiLandcros("Maquinaria Hitachi."), "Maquinaria Hitachi LANDCROS.");
    assert.equal(aHitachiLandcros("(Hitachi), Case"), "(Hitachi LANDCROS), Case");
  });

  it("idempotente y sin repeticiones", () => {
    assert.equal(aHitachiLandcros("Hitachi LANDCROS"), "Hitachi LANDCROS");
    assert.equal(aHitachiLandcros(aHitachiLandcros("Hitachi ZX")), "Hitachi LANDCROS ZX");
    assert.equal(aHitachiLandcros("Hitachi Hitachi LANDCROS"), "Hitachi LANDCROS");
    assert.equal(aHitachiLandcros("HITACHI Hitachi Landcros ZX"), "Hitachi LANDCROS ZX");
  });

  it("pegada a la referencia del modelo: con un espacio", () => {
    assert.equal(
      aHitachiLandcros("HITACHIZX200-6, año 2018"),
      "Hitachi LANDCROS ZX200-6, año 2018",
    );
    assert.equal(aHitachiLandcros("Hitachi-ZX210LC-5"), "Hitachi LANDCROS ZX210LC-5");
    assert.equal(aHitachiLandcros("excavadora-hitachi-zx210"), "excavadora-hitachi-zx210");
  });

  it("el nombre de la EMPRESA se queda", () => {
    const t = "Hitachi Construction Machinery y Hitachi, Ltd. con excavadoras Hitachi";
    assert.equal(
      aHitachiLandcros(t),
      "Hitachi Construction Machinery y Hitachi, Ltd. con excavadoras Hitachi LANDCROS",
    );
    assert.equal(nombraEmpresaHitachi(t), true);
    assert.equal(nombraEmpresaHitachi("Hitachi LANDCROS"), false);
  });

  it("nunca dentro de una dirección, un fichero o un correo", () => {
    const intocables = [
      "/repuestos/repuestos-para-maquinaria-pesada-hitachi/",
      "excavadora-hitachi-zx130",
      "hitachi.jpg",
      "www.hitachi.com",
      "ventas@hitachi.com",
      "wp_hitachi",
      "Hitachi-Partequipos",
    ];
    for (const t of intocables) {
      assert.equal(aHitachiLandcros(t), t, t);
      assert.equal(nombraHitachi(t), false, t);
    }
    assert.equal(
      aHitachiLandcros("Mira [Hitachi](/marcas/hitachi/)"),
      "Mira [Hitachi LANDCROS](/marcas/hitachi/)",
    );
  });
});

describe("aHitachiLandcrosProfundo", () => {
  it("solo los nodos de texto del texto enriquecido", () => {
    const rico = {
      root: {
        children: [
          { type: "text", text: "Excavadora Hitachi" },
          { type: "link", fields: { url: "/marcas/hitachi/" }, children: [{ text: "hitachi" }] },
        ],
      },
    };
    assert.deepEqual(aHitachiLandcrosProfundo(rico), {
      root: {
        children: [
          { type: "text", text: "Excavadora Hitachi LANDCROS" },
          {
            type: "link",
            fields: { url: "/marcas/hitachi/" },
            children: [{ text: "Hitachi LANDCROS" }],
          },
        ],
      },
    });
  });

  it("grupos y filas, sin tocar slugs, direcciones ni ficheros", () => {
    const antes = {
      nombre: "Hitachi",
      slug: "hitachi",
      seo: { metaTitle: "Repuestos Hitachi", url: "https://x.com/hitachi" },
      filas: [
        { id: "a1", texto: "Miniexcavadora Hitachi EX450LC-5", enlace: "/x/hitachi/" },
        { id: "a2", valor: "/marcas/hitachi/" },
      ],
      logo: 12,
    };
    assert.deepEqual(aHitachiLandcrosProfundo(antes), {
      nombre: "Hitachi LANDCROS",
      slug: "hitachi",
      seo: { metaTitle: "Repuestos Hitachi LANDCROS", url: "https://x.com/hitachi" },
      filas: [
        { id: "a1", texto: "Miniexcavadora Hitachi LANDCROS EX450LC-5", enlace: "/x/hitachi/" },
        { id: "a2", valor: "/marcas/hitachi/" },
      ],
      logo: 12,
    });
  });
});

describe("esModeloAntiguoHitachi", () => {
  it("la serie EX (y lo que no es ZAXIS) es antigua; ZX no", () => {
    assert.equal(esModeloAntiguoHitachi("EX120-2"), true);
    assert.equal(esModeloAntiguoHitachi("ex200-5"), true);
    assert.equal(esModeloAntiguoHitachi("ZX200"), false);
    assert.equal(esModeloAntiguoHitachi(""), false);
    assert.equal(esModeloAntiguoHitachi(null), false);
  });
});
