import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TOPE_FUENTE_BYTES,
  formatoDeFuente,
  formatoDeFuentePermitido,
  veredictoFuente,
} from "./formatoDeFuentePermitido";

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

  it("OTF (OTTO) entra como TTF para el @font-face, con su tipo font/otf", () => {
    assert.equal(formatoDeFuente(conFirma("OTTO")), "truetype");
    assert.deepEqual(veredictoFuente("Marca.otf", conFirma("OTTO")), {
      valido: true,
      formato: "truetype",
      mime: "font/otf",
    });
  });

  it("rechaza lo que no es una fuente admitida (PNG, texto)", () => {
    assert.equal(formatoDeFuente(conFirma("\x89PNG")), null);
    assert.equal(veredictoFuente("a.woff2", conFirma("hola")).valido, false);
  });

  it("la extensión tiene que casar con el contenido", () => {
    assert.deepEqual(veredictoFuente("Marca.WOFF2", conFirma("wOF2")), {
      valido: true,
      formato: "woff2",
      mime: "font/woff2",
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

  it("pone el tipo MIME y el formato de la firma, no los del navegador (Chrome en Windows)", () => {
    const casos: [string, Buffer | string, string, string][] = [
      ["Anton.woff2", "wOF2", "font/woff2", "woff2"],
      ["Anton.woff", "wOFF", "font/woff", "woff"],
      ["Anton.ttf", Buffer.from([0, 1, 0, 0]), "font/ttf", "truetype"],
      ["Anton.ttf", "true", "font/ttf", "truetype"],
      ["Anton.otf", "OTTO", "font/otf", "truetype"],
    ];
    for (const [nombre, firma, mime, formato] of casos) {
      for (const delNavegador of ["", "application/octet-stream"]) {
        const file = { name: nombre, data: conFirma(firma), mimetype: delNavegador, size: 64 };
        const data: Record<string, unknown> = {};
        const hook = formatoDeFuentePermitido as unknown as (a: unknown) => unknown;
        hook({ args: { data }, operation: "create", req: { file } });
        assert.equal(file.mimetype, mime, `${nombre} con «${delNavegador}»`);
        assert.equal(data.formato, formato);
      }
    }
  });

  it("rechaza sin tocar el tipo si la firma no es de fuente", () => {
    const file = { name: "a.woff2", data: conFirma("PNG"), mimetype: "font/woff2", size: 64 };
    const hook = formatoDeFuentePermitido as unknown as (a: unknown) => unknown;
    assert.throws(
      () => hook({ args: { data: {} }, operation: "create", req: { file } }),
      /no es una fuente/,
    );
  });
});
