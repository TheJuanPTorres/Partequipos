import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CATEGORIAS_DE_PLANTILLA,
  categoriasDePlantillas,
  mismoTextoSalvoEspacios,
} from "./modelosWp";

describe("CATEGORIAS_DE_PLANTILLA", () => {
  it("las plantillas de WordPress tienen 10, 4, 9 y 1 categorías", () => {
    assert.equal(CATEGORIAS_DE_PLANTILLA["43095"]?.length, 10);
    assert.equal(CATEGORIAS_DE_PLANTILLA["43283"]?.length, 4);
    assert.equal(CATEGORIAS_DE_PLANTILLA["43307"]?.length, 9);
    assert.equal(CATEGORIAS_DE_PLANTILLA["43363"]?.length, 9);
    assert.equal(CATEGORIAS_DE_PLANTILLA["43404"]?.length, 9);
    assert.equal(CATEGORIAS_DE_PLANTILLA["45834"]?.length, 1);
  });

  it("la de excavadoras empieza por el tren de rodaje y no repite categorías", () => {
    const l = CATEGORIAS_DE_PLANTILLA["43095"] ?? [];
    assert.equal(l[0], "tren-de-rodaje-para-maquinaria-pesada");
    assert.equal(new Set(l).size, l.length);
  });
});

describe("categoriasDePlantillas", () => {
  it("todos los modelos con la misma plantilla: esa, sin aviso", () => {
    const r = categoriasDePlantillas([["43283"], ["43283"]]);
    assert.equal(r.slugs.length, 4);
    assert.equal(r.mezcla, null);
  });

  it("con mezcla, la más usada y el aviso", () => {
    const r = categoriasDePlantillas([["43307"], ["43307"], ["43095", "43433", "43429"], []]);
    assert.equal(r.slugs.length, 9);
    assert.equal(r.mezcla, "43095×1, 43307×2, ninguna×1");
  });

  it("las plantillas que no son de categorías no cuentan", () => {
    assert.deepEqual(categoriasDePlantillas([["43433", "35576"]]).slugs, []);
  });

  it("sin plantillas, ninguna categoría", () => {
    assert.deepEqual(categoriasDePlantillas([[], []]), { slugs: [], mezcla: null });
  });
});

describe("mismoTextoSalvoEspacios", () => {
  it("reconoce el defecto del importador anterior («E xcavadora»)", () => {
    assert.equal(
      mismoTextoSalvoEspacios("Mantén tu E xcavadora EJEMPLO", "Mantén tu Excavadora EJEMPLO"),
      true,
    );
  });

  it("un cambio de letras no lo es", () => {
    assert.equal(mismoTextoSalvoEspacios("Excavadora X100", "Excavadora X200"), false);
  });
});
