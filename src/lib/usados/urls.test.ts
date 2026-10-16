import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { esSlugUnidadReservado, rutaAntiguaDeUnidad, slugDeUnidad, slugLibre } from "./urls";

describe("slugDeUnidad", () => {
  it("deriva el slug del nombre compuesto", () => {
    assert.equal(
      slugDeUnidad("Excavadora Hitachi ZX350H-5B 2016"),
      "excavadora-hitachi-zx350h-5b-2016",
    );
  });
  it("quita tildes y signos", () => {
    assert.equal(
      slugDeUnidad("Miniexcavadora Yanmar ViO55-6 (2019)"),
      "miniexcavadora-yanmar-vio55-6-2019",
    );
  });
  it("no devuelve un slug reservado", () => {
    assert.equal(slugDeUnidad("Pagina"), "pagina-unidad");
    assert.equal(slugDeUnidad("Marcas"), "marcas-unidad");
  });
});

describe("esSlugUnidadReservado", () => {
  it("reserva «pagina» y «marcas», sin importar mayúsculas", () => {
    assert.equal(esSlugUnidadReservado("pagina"), true);
    assert.equal(esSlugUnidadReservado("Marcas"), true);
    assert.equal(esSlugUnidadReservado("excavadora-1"), false);
  });
});

describe("slugLibre", () => {
  it("usa el base si está libre", () => {
    assert.equal(slugLibre("a", new Set()), "a");
  });
  it("añade el sufijo solo si chocan", () => {
    assert.equal(slugLibre("a", new Set(["a"]), 123), "a-123");
  });
  it("cae a un contador si el sufijo también está ocupado", () => {
    assert.equal(slugLibre("a", new Set(["a", "a-123"]), 123), "a-2");
    assert.equal(slugLibre("a", new Set(["a"])), "a-2");
  });
});

describe("rutaAntiguaDeUnidad", () => {
  it("saca la ruta de WordPress sin barra final", () => {
    assert.equal(
      rutaAntiguaDeUnidad("https://partequipos.com/maquinaria-pesada-usada/excavadora-x/"),
      "/maquinaria-pesada-usada/excavadora-x",
    );
  });
  it("rechaza lo que no es de esa raíz", () => {
    assert.equal(rutaAntiguaDeUnidad("https://partequipos.com/otra/x/"), null);
    assert.equal(rutaAntiguaDeUnidad("no es url"), null);
    assert.equal(rutaAntiguaDeUnidad("https://partequipos.com/maquinaria-pesada-usada/a/b/"), null);
  });
});
