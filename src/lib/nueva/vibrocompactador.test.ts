import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  aVibrocompactadorNombre,
  aVibrocompactadorRico,
  aVibrocompactadorTexto,
  avisoNoVibratorio,
  nombraCompactador,
} from "./vibrocompactador";

describe("aVibrocompactadorNombre", () => {
  it("categorías y tipos: en singular, con mayúscula en cada palabra salvo los enlaces", () => {
    assert.equal(aVibrocompactadorNombre("Compactador"), "Vibrocompactador");
    assert.equal(aVibrocompactadorNombre("Compactadores"), "Vibrocompactador");
    assert.equal(aVibrocompactadorNombre("Compactador de Llantas"), "Vibrocompactador de Llantas");
    assert.equal(aVibrocompactadorNombre("Compactadores de suelo"), "Vibrocompactador de Suelo");
    assert.equal(
      aVibrocompactadorNombre("Compactadores de doble rodillo"),
      "Vibrocompactador de Doble Rodillo",
    );
  });

  it("productos: las marcas y referencias en mayúsculas o con cifras no se tocan", () => {
    assert.equal(
      aVibrocompactadorNombre("Compactador doble rodillo DYNAPAC CC1200 VI"),
      "Vibrocompactador Doble Rodillo DYNAPAC CC1200 VI",
    );
    assert.equal(
      aVibrocompactadorNombre("Compactador de llantas DYNAPAC CP28"),
      "Vibrocompactador de Llantas DYNAPAC CP28",
    );
    assert.equal(
      aVibrocompactadorNombre("RODILLO COMPACTADOR PARA MINICARGADORES"),
      "RODILLO VIBROCOMPACTADOR PARA MINICARGADORES",
    );
  });

  it("lo que ya es «Vibrocompactador» se queda (el plural pasa a singular); el resto, igual", () => {
    assert.equal(aVibrocompactadorNombre("Vibrocompactador SV208"), "Vibrocompactador SV208");
    assert.equal(
      aVibrocompactadorNombre("Vibrocompactador Ammann ARX 26"),
      "Vibrocompactador Ammann ARX 26",
    );
    assert.equal(aVibrocompactadorNombre("Vibrocompactadores"), "Vibrocompactador");
    assert.equal(aVibrocompactadorNombre("Excavadora de orugas"), "Excavadora de orugas");
    assert.equal(aVibrocompactadorNombre("Compactación"), "Compactación");
  });
});

describe("aVibrocompactadorTexto", () => {
  it("solo la palabra, con su número y su caja", () => {
    assert.equal(
      aVibrocompactadorTexto("Compactador de Llantas Dynapac CP28 | Compactador Neumático"),
      "Vibrocompactador de Llantas Dynapac CP28 | Vibrocompactador Neumático",
    );
    assert.equal(
      aVibrocompactadorTexto("compactadores de suelos, rodillos y pavimentadoras"),
      "vibrocompactadores de suelos, rodillos y pavimentadoras",
    );
    assert.equal(aVibrocompactadorTexto("FICHA COMPACTADOR"), "FICHA VIBROCOMPACTADOR");
  });

  it("no toca «vibrocompactador», «compactación» ni otras palabras", () => {
    const t = "El Vibrocompactador SV208 mejora la compactación; vibrocompactadora Ammann.";
    assert.equal(aVibrocompactadorTexto(t), t);
  });
});

describe("aVibrocompactadorRico", () => {
  it("cambia los nodos de texto de Lexical y deja el resto igual", () => {
    const rico = {
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", text: "Compactador de suelo", format: 1 }],
          },
        ],
      },
    };
    const nuevo = aVibrocompactadorRico(rico);
    assert.equal(nuevo.root.children[0]!.children[0]!.text, "Vibrocompactador de suelo");
    assert.equal(nuevo.root.children[0]!.children[0]!.format, 1);
    assert.equal(rico.root.children[0]!.children[0]!.text, "Compactador de suelo"); // sin mutar
  });
});

describe("avisos", () => {
  it("marca los de llantas/neumáticos y el aditamento; los demás, no", () => {
    assert.ok(avisoNoVibratorio("Compactador de llantas DYNAPAC CP28"));
    assert.ok(avisoNoVibratorio("Compactador Neumático"));
    assert.ok(avisoNoVibratorio("RODILLO COMPACTADOR PARA MINICARGADORES"));
    assert.equal(avisoNoVibratorio("Compactador de suelo DYNAPAC CA15D"), null);
  });

  it("nombraCompactador sirve varias veces seguidas (sin estado entre llamadas)", () => {
    assert.ok(nombraCompactador("Compactador"));
    assert.ok(nombraCompactador("Compactador"));
    assert.ok(!nombraCompactador("Excavadora"));
  });
});
