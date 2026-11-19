import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  leFaltaLandcros,
  reescribirRutas,
  reescribirRutasProfundo,
  slugConLandcros,
} from "./hitachiLandcrosUrls";

describe("slugConLandcros", () => {
  it("añade «landcros» detrás de «hitachi», en su sitio", () => {
    assert.equal(slugConLandcros("hitachi"), "hitachi-landcros");
    assert.equal(slugConLandcros("excavadoras-hitachi"), "excavadoras-hitachi-landcros");
    assert.equal(
      slugConLandcros("excavadora-hitachi-zx130-5b"),
      "excavadora-hitachi-landcros-zx130-5b",
    );
    assert.equal(
      slugConLandcros("repuestos-para-maquinaria-pesada-excavadora-hitachi"),
      "repuestos-para-maquinaria-pesada-excavadora-hitachi-landcros",
    );
    assert.equal(
      slugConLandcros("repuestos-miniexcavadora-hitachi-zx75u-3-2"),
      "repuestos-miniexcavadora-hitachi-landcros-zx75u-3-2",
    );
  });

  it("es idempotente y no toca otros slugs", () => {
    for (const s of [
      "hitachi-landcros",
      "excavadora-hitachi-landcros-zx130-5b",
      "case-construction",
      "hitachis",
      "xhitachi",
    ]) {
      assert.equal(slugConLandcros(s), s);
      assert.equal(leFaltaLandcros(s), false);
    }
    assert.equal(leFaltaLandcros("excavadoras-hitachi"), true);
    // «landcross» no es «landcros»: se trata como una palabra más.
    assert.equal(slugConLandcros("hitachi-landcross"), "hitachi-landcros-landcross");
  });
});

describe("reescribirRutas", () => {
  const pares = new Map([
    ["/nueva/marcas/hitachi", "/nueva/marcas/hitachi-landcros"],
    [
      "/nueva/marcas/hitachi/excavadoras-hitachi",
      "/nueva/marcas/hitachi-landcros/excavadoras-hitachi-landcros",
    ],
  ]);

  it("cambia la ruta entera y conserva barra, query y ancla", () => {
    assert.equal(
      reescribirRutas("/nueva/marcas/hitachi/", pares),
      "/nueva/marcas/hitachi-landcros/",
    );
    assert.equal(reescribirRutas("/nueva/marcas/hitachi", pares), "/nueva/marcas/hitachi-landcros");
    assert.equal(
      reescribirRutas("/nueva/marcas/hitachi/excavadoras-hitachi/?a=1#b", pares),
      "/nueva/marcas/hitachi-landcros/excavadoras-hitachi-landcros/?a=1#b",
    );
    assert.equal(
      reescribirRutas("Mira [esto](/nueva/marcas/hitachi/) y más", pares),
      "Mira [esto](/nueva/marcas/hitachi-landcros/) y más",
    );
  });

  it("no toca la ruta nueva, una hija desconocida ni otro texto", () => {
    for (const t of [
      "/nueva/marcas/hitachi-landcros/",
      "/nueva/marcas/hitachi-landcros/excavadoras-hitachi-landcros/",
      "/usada/marcas/hitachi/",
      // Una URL absoluta (otro sitio) no se toca.
      "https://partequipos.com/nueva/marcas/hitachi/",
      "Excavadora Hitachi LANDCROS",
    ]) {
      assert.equal(reescribirRutas(t, pares), t);
    }
    // Una hija que no está en el mapa: cambia solo el tramo conocido (su marca).
    assert.equal(
      reescribirRutas("/nueva/marcas/hitachi/otro-tipo/", pares),
      "/nueva/marcas/hitachi-landcros/otro-tipo/",
    );
  });

  it("recorre objetos, listas y texto enriquecido", () => {
    const antes = {
      enlace: "/nueva/marcas/hitachi/",
      n: 3,
      hijos: [{ type: "link", fields: { url: "/nueva/marcas/hitachi/excavadoras-hitachi/" } }],
    };
    assert.deepEqual(reescribirRutasProfundo(antes, pares), {
      enlace: "/nueva/marcas/hitachi-landcros/",
      n: 3,
      hijos: [
        {
          type: "link",
          fields: { url: "/nueva/marcas/hitachi-landcros/excavadoras-hitachi-landcros/" },
        },
      ],
    });
  });
});
