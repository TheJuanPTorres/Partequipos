import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
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
  return async () => {
    await formatoDePdfPermitido({
      args,
      operation,
      req: { file: { data, name, mimetype: "application/pdf", size: data.length } },
    } as unknown as Argumentos);
  };
}

describe("formato de documento PDF", () => {
  it("reconoce un PDF completo: firma al principio, xref y %%EOF al final", async () => {
    assert.equal(veredictoPdf(PDF), "pdf");
    await assert.doesNotReject(llamar(PDF));
  });

  it("rechaza lo que no es PDF aunque se llame .pdf", async () => {
    assert.equal(veredictoPdf(PNG), "no-pdf");
    assert.equal(veredictoPdf(Buffer.from("hola, no soy un pdf")), "no-pdf");
    assert.equal(veredictoPdf(Buffer.concat([Buffer.from("\r\n"), PDF])), "no-pdf");
    await assert.rejects(llamar(PNG), /no es un PDF/);
  });

  it("rechaza un PDF cortado (sin xref o sin %%EOF), en español", async () => {
    const cortado = PDF.subarray(0, 30);
    assert.equal(veredictoPdf(cortado), "incompleto");
    await assert.rejects(llamar(cortado), /dañado o incompleto/);
  });

  it("rechaza un PDF que pasa del tope de 25 MB", async () => {
    const grande = Buffer.concat([PDF.subarray(0, 9), Buffer.alloc(TOPE_PDF_BYTES), PDF]);
    await assert.rejects(llamar(grande), /máximo es 25 MB/);
  });

  it("no mira nada si la operación no lleva fichero o no es crear ni actualizar", async () => {
    await assert.doesNotReject(llamar(Buffer.alloc(0)));
    await assert.doesNotReject(llamar(PNG, "delete"));
  });

  it("SUBIDA DIRECTA: lee el fichero del temporal (data vacío) y guarda el tamaño real", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "pdf-"));
    const ruta = path.join(dir, "ficha.pdf");
    const grande = Buffer.concat([PDF.subarray(0, 9), Buffer.alloc(10 * 1024 * 1024), PDF]);
    writeFileSync(ruta, grande);
    const file = { data: Buffer.alloc(0), tempFilePath: ruta, name: "ficha.pdf", size: 5 };
    await assert.doesNotReject(
      () =>
        formatoDePdfPermitido({
          args: { data: {} },
          operation: "create",
          req: { file },
        } as unknown as Argumentos) as Promise<unknown>,
    );
    assert.equal(file.size, grande.length);
  });

  it("SUBIDA DIRECTA: un no-PDF en el temporal se rechaza (antes pasaba sin mirar)", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "pdf-"));
    const ruta = path.join(dir, "falso.pdf");
    writeFileSync(ruta, PNG);
    await assert.rejects(
      () =>
        formatoDePdfPermitido({
          args: { data: {} },
          operation: "create",
          req: { file: { data: Buffer.alloc(0), tempFilePath: ruta, name: "falso.pdf", size: 1 } },
        } as unknown as Argumentos) as Promise<unknown>,
      /no es un PDF/,
    );
  });
});
