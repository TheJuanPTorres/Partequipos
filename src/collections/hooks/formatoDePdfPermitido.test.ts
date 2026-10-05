import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TOPE_PDF_BYTES, formatoDePdfPermitido, veredictoPdf } from "./formatoDePdfPermitido";

type Argumentos = Parameters<typeof formatoDePdfPermitido>[0];

/** Un PDF mínimo pero completo: firma, `xref` y `%%EOF` (lo que exige Payload). */
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\ntrailer\n<<>>\nstartxref\n9\n%%EOF\n",
  "latin1",
);
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
  it("reconoce un PDF completo: firma al principio, xref y %%EOF al final", () => {
    assert.equal(veredictoPdf(PDF), "pdf");
    assert.doesNotThrow(llamar(PDF));
  });

  it("rechaza lo que no es PDF aunque se llame .pdf", () => {
    assert.equal(veredictoPdf(PNG), "no-pdf");
    assert.equal(veredictoPdf(Buffer.from("hola, no soy un pdf")), "no-pdf");
    assert.equal(veredictoPdf(Buffer.concat([Buffer.from("\r\n"), PDF])), "no-pdf");
    assert.throws(llamar(PNG), /no es un PDF/);
  });

  it("rechaza un PDF cortado (sin xref o sin %%EOF), en español", () => {
    const cortado = PDF.subarray(0, 30);
    assert.equal(veredictoPdf(cortado), "incompleto");
    assert.throws(llamar(cortado), /dañado o incompleto/);
  });

  it("rechaza un PDF que pasa del tope de 4 MB", () => {
    const grande = Buffer.concat([PDF.subarray(0, 9), Buffer.alloc(TOPE_PDF_BYTES), PDF]);
    assert.throws(llamar(grande), /máximo es 4 MB/);
  });

  it("no mira nada si la operación no lleva fichero o no es crear ni actualizar", () => {
    assert.doesNotThrow(llamar(Buffer.alloc(0)));
    assert.doesNotThrow(llamar(PNG, "delete"));
  });
});
