import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TOPE_FUENTE_BYTES, formatoDeFuente, veredictoFuente } from "./formatoDeFuentePermitido";

const conFirma = (firma: Buffer | string) =>
  Buffer.concat([
    typeof firma === "string" ? Buffer.from(firma, "latin1") : firma,
    Buffer.alloc(60),
  ]);

describe("formatoDeFuentePermitido", () => {
  it("reconoce WOFF2, WOFF y TTF por su contenido", () => {
    assert.equal(formatoDeFuente(conFirma("wOF2")), "woff2");
    assert.equal(formatoDeFuente(conFirma("wOFF")), "woff");
    assert.equal(formatoDeFuente(conFirma(Buffer.from([0, 1, 0, 0]))), "truetype");
    assert.equal(formatoDeFuente(conFirma("true")), "truetype");
  });

  it("rechaza lo que no es una fuente admitida (OTF, PNG, texto)", () => {
    assert.equal(formatoDeFuente(conFirma("OTTO")), null);
    assert.equal(formatoDeFuente(conFirma("\x89PNG")), null);
    assert.equal(veredictoFuente("a.woff2", conFirma("hola")).valido, false);
  });

  it("la extensión tiene que casar con el contenido", () => {
    assert.deepEqual(veredictoFuente("Marca.WOFF2", conFirma("wOF2")), {
      valido: true,
      formato: "woff2",
    });
    assert.equal(veredictoFuente("marca.woff2", conFirma("wOFF")).valido, false);
    assert.equal(veredictoFuente("marca.ttf", conFirma("wOF2")).valido, false);
  });

  it("tope de 4 MB", () => {
    const grande = Buffer.concat([Buffer.from("wOF2"), Buffer.alloc(TOPE_FUENTE_BYTES)]);
    const v = veredictoFuente("a.woff2", grande);
    assert.equal(v.valido, false);
    assert.match(!v.valido ? v.motivo : "", /máximo es 4 MB/);
  });
});
