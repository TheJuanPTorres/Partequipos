import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TOPE_PDF_BYTES, esPdf, formatoDePdfPermitido } from "./formatoDePdfPermitido";

type Argumentos = Parameters<typeof formatoDePdfPermitido>[0];

const PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n", "ascii");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function llamar(data: Buffer, operation = "create", name = "ficha.pdf") {
  const args = { data: { titulo: "Ficha" } };
  return () =>
    formatoDePdfPermitido({
      args,
      operation,
      req: { file: { data, name, mimetype: "application/pdf", size: data.length } },
    } as unknown as Argumentos);
}

describe("formato de documento PDF", () => {
  it("reconoce un PDF por su firma, también con basura delante", () => {
    assert.equal(esPdf(PDF), true);
    assert.equal(esPdf(Buffer.concat([Buffer.from("\r\n\r\n"), PDF])), true);
  });

  it("rechaza lo que no es PDF aunque se llame .pdf", () => {
    assert.equal(esPdf(PNG), false);
    assert.equal(esPdf(Buffer.from("hola, no soy un pdf")), false);
    assert.throws(llamar(PNG), /no es un PDF/);
  });

  it("acepta un PDF y lo deja pasar sin tocar los datos", () => {
    assert.doesNotThrow(llamar(PDF));
  });

  it("rechaza un PDF que pasa del tope de 4 MB", () => {
    const grande = Buffer.concat([PDF, Buffer.alloc(TOPE_PDF_BYTES)]);
    assert.throws(llamar(grande), /máximo es 4 MB/);
  });

  it("no mira nada si la operación no lleva fichero o no es crear ni actualizar", () => {
    assert.doesNotThrow(llamar(Buffer.alloc(0)));
    assert.doesNotThrow(llamar(PNG, "delete"));
  });
});
