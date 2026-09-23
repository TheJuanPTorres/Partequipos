import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hostDeBlob, sinDescargaRemota, urlDeSubidaPermitida } from "./sinDescargaRemota";

const PROPIO = "abc123store.public.blob.vercel-storage.com";
type Argumentos = Parameters<typeof sinDescargaRemota>[0];

function llamar(data: object, operation = "create", file?: Buffer) {
  return sinDescargaRemota({
    args: { data },
    operation,
    req: { file: file ? { data: file, name: "x.png" } : undefined },
  } as unknown as Argumentos);
}

describe("host del almacén propio", () => {
  it("sale del token, como en el plugin", () => {
    assert.equal(hostDeBlob("vercel_blob_rw_AbC123Store_xyz789"), PROPIO);
  });
  it("sin token o con formato raro, no hay host (y todo se rechaza)", () => {
    assert.equal(hostDeBlob(undefined), null);
    assert.equal(hostDeBlob("otra-cosa"), null);
  });
});

describe("qué url se deja descargar al servidor", () => {
  it("PERMITE el caso de uso real: el propio fichero (recorte, punto focal, duplicado)", () => {
    assert.equal(urlDeSubidaPermitida(`https://${PROPIO}/foto.png`, PROPIO), true);
    assert.equal(urlDeSubidaPermitida(undefined, PROPIO), true);
    assert.equal(urlDeSubidaPermitida("", PROPIO), true);
  });

  it("RECHAZA otro dominio: es la vía que se cierra", () => {
    assert.equal(urlDeSubidaPermitida("https://evil.example/x.png", PROPIO), false);
  });

  it("rechaza el almacén de OTRO entorno (p. ej. producción desde el preview)", () => {
    assert.equal(
      urlDeSubidaPermitida("https://otrostore.public.blob.vercel-storage.com/x.png", PROPIO),
      false,
    );
  });

  it("rechaza rutas relativas: Payload las completa con la cabecera Origin", () => {
    assert.equal(urlDeSubidaPermitida("/api/media/file/x.png", PROPIO), false);
  });

  it("rechaza http, credenciales en la url y hosts que solo CONTIENEN el propio", () => {
    assert.equal(urlDeSubidaPermitida(`http://${PROPIO}/x.png`, PROPIO), false);
    assert.equal(urlDeSubidaPermitida(`https://u:p@${PROPIO}/x.png`, PROPIO), false);
    assert.equal(urlDeSubidaPermitida(`https://${PROPIO}.evil.example/x.png`, PROPIO), false);
    assert.equal(urlDeSubidaPermitida(`https://evil${PROPIO}/x.png`, PROPIO), false);
  });

  it("sin host propio configurado, falla cerrado", () => {
    assert.equal(urlDeSubidaPermitida(`https://${PROPIO}/x.png`, null), false);
  });

  it("rechaza lo que no es texto", () => {
    assert.equal(urlDeSubidaPermitida({ href: "x" }, PROPIO), false);
  });
});

describe("el gancho", () => {
  it("bloquea un create sin fichero con url externa (el guardián falla cuando debe)", () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_abc123store_xyz";
    assert.throws(
      () => llamar({ filename: "x.png", url: "https://evil.example/x.png" }),
      /dirección externa/,
    );
  });

  it("bloquea también un update", () => {
    assert.throws(
      () => llamar({ url: "https://evil.example/x.png" }, "update"),
      /dirección externa/,
    );
  });

  it("deja pasar una subida normal aunque traiga url: con fichero no se descarga nada", () => {
    assert.doesNotThrow(() =>
      llamar({ url: "https://evil.example/x.png" }, "create", Buffer.from([1, 2, 3])),
    );
  });

  it("deja pasar el recorte del propio fichero", () => {
    assert.doesNotThrow(() =>
      llamar({ url: `https://${PROPIO}/foto.png`, focalX: 30, focalY: 70 }, "update"),
    );
  });

  it("no interviene en lecturas ni borrados", () => {
    assert.doesNotThrow(() => llamar({ url: "https://evil.example/x.png" }, "delete"));
  });
});
