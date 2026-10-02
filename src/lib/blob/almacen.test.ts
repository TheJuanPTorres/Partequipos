import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { almacenEsperado } from "../../collections/hooks/almacenEsperado";
import {
  ALMACEN_PREVIEW,
  ALMACEN_PRODUCCION,
  almacenDeToken,
  almacenDeUrl,
  almacenEsperado as esperadoDe,
  veredictoAlmacen,
} from "./almacen";

const token = (almacen: string) => `vercel_blob_rw_${almacen}_SecretoDePrueba123`;

describe("almacén de Blob: identificación sin escribir", () => {
  it("saca el id del almacén del token, sin el secreto", () => {
    assert.equal(almacenDeToken(token("LsNdNc29nh4ws7eh")), ALMACEN_PREVIEW);
    assert.equal(almacenDeToken(" " + token(ALMACEN_PRODUCCION) + "\n"), ALMACEN_PRODUCCION);
    assert.equal(almacenDeToken("otra-cosa"), null);
    assert.equal(almacenDeToken(undefined), null);
  });

  it("saca el almacén de una URL pública del Blob, y nada más", () => {
    assert.equal(
      almacenDeUrl(`https://${ALMACEN_PREVIEW}.public.blob.vercel-storage.com/a.png`),
      ALMACEN_PREVIEW,
    );
    assert.equal(almacenDeUrl("https://evil.com/a.png"), null);
    assert.equal(almacenDeUrl("/api/media/file/a.png"), null);
    assert.equal(almacenDeUrl(null), null);
  });
});

describe("almacén esperado por entorno", () => {
  it("fuera de Vercel (development, scripts): el del preview", () => {
    assert.equal(esperadoDe({}), ALMACEN_PREVIEW);
  });
  it("Vercel preview: el del preview; Vercel production: el de producción", () => {
    assert.equal(esperadoDe({ VERCEL_ENV: "preview" }), ALMACEN_PREVIEW);
    assert.equal(esperadoDe({ VERCEL_ENV: "production" }), ALMACEN_PRODUCCION);
  });
  it("una operación de producción fuera de Vercel lo DECLARA", () => {
    assert.equal(esperadoDe({ ALMACEN_BLOB_ESPERADO: ALMACEN_PRODUCCION }), ALMACEN_PRODUCCION);
  });
});

describe("veredicto: la guarda FALLA cuando debe", () => {
  it("development con el token de PRODUCCIÓN: bloquea (el incidente del 2026-10-01)", () => {
    const v = veredictoAlmacen({ BLOB_READ_WRITE_TOKEN: token(ALMACEN_PRODUCCION) });
    assert.equal(v.valido, false);
    assert.match(v.valido ? "" : v.motivo, /PRODUCCIÓN/);
  });
  it("producción en Vercel con el token del preview: bloquea (lo de producción no cae en el preview)", () => {
    const v = veredictoAlmacen({
      VERCEL_ENV: "production",
      BLOB_READ_WRITE_TOKEN: token(ALMACEN_PREVIEW),
    });
    assert.equal(v.valido, false);
  });
  it("sin token o ilegible: bloquea", () => {
    assert.equal(veredictoAlmacen({}).valido, false);
    assert.equal(veredictoAlmacen({ BLOB_READ_WRITE_TOKEN: "x" }).valido, false);
  });
  it("los casos buenos pasan, y el veredicto nunca lleva el token", () => {
    const a = veredictoAlmacen({ BLOB_READ_WRITE_TOKEN: token(ALMACEN_PREVIEW) });
    const b = veredictoAlmacen({
      VERCEL_ENV: "production",
      BLOB_READ_WRITE_TOKEN: token(ALMACEN_PRODUCCION),
    });
    assert.equal(a.valido && b.valido, true);
    assert.equal(JSON.stringify([a, b]).includes("SecretoDePrueba123"), false);
  });
});

describe("gancho almacenEsperado de media y videos", () => {
  const llamar = (operation: string) =>
    (almacenEsperado as unknown as (a: { args: object; operation: string }) => unknown)({
      args: { marca: 1 },
      operation,
    });
  const conToken = (t: string | undefined, fn: () => void) => {
    const antes = process.env.BLOB_READ_WRITE_TOKEN;
    const vercel = process.env.VERCEL_ENV;
    delete process.env.VERCEL_ENV;
    if (t === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = t;
    try {
      fn();
    } finally {
      if (antes === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
      else process.env.BLOB_READ_WRITE_TOKEN = antes;
      if (vercel !== undefined) process.env.VERCEL_ENV = vercel;
    }
  };

  it("con el almacén equivocado, aborta crear, actualizar y borrar", () => {
    conToken(token(ALMACEN_PRODUCCION), () => {
      for (const op of ["create", "update", "updateByID", "delete", "deleteByID"])
        assert.throws(() => llamar(op), /almacenamiento de archivos/, op);
    });
  });
  it("las lecturas no se bloquean nunca", () => {
    conToken(token(ALMACEN_PRODUCCION), () => {
      assert.deepEqual(llamar("read"), { marca: 1 });
    });
  });
  it("con el almacén que toca, deja pasar", () => {
    conToken(token(ALMACEN_PREVIEW), () => {
      assert.deepEqual(llamar("create"), { marca: 1 });
    });
  });
});
