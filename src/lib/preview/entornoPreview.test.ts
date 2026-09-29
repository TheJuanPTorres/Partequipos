import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ALMACEN_PREVIEW, ALMACEN_PRODUCCION, HOST_PRODUCCION } from "../portada/heroPrueba";
import { HOST_PREVIEW } from "../db/vaciadoSolicitudes";
import { leerFicheroEntorno, veredictoEntornoPreview } from "./entornoPreview";

const uri = (host: string) => `postgresql://usuario:clave@${host}/neondb?sslmode=require`;
const token = (almacen: string) => `vercel_blob_rw_${almacen}_SecretoDePrueba123`;
const bueno = {
  DATABASE_URI: uri(HOST_PREVIEW),
  BLOB_READ_WRITE_TOKEN: token(ALMACEN_PREVIEW),
  VERCEL_AUTOMATION_BYPASS_SECRET: "x".repeat(32),
};

describe("leerFicheroEntorno", () => {
  it("lee claves, ignora comentarios, líneas vacías y claves ajenas, y quita comillas", () => {
    const e = leerFicheroEntorno(
      `# SOLO PREVIEW\r\nDATABASE_URI="${bueno.DATABASE_URI}"\n\nOTRA=1\nBLOB_READ_WRITE_TOKEN=${bueno.BLOB_READ_WRITE_TOKEN}\nVERCEL_AUTOMATION_BYPASS_SECRET=\n`,
    );
    assert.deepEqual(e, {
      DATABASE_URI: bueno.DATABASE_URI,
      BLOB_READ_WRITE_TOKEN: bueno.BLOB_READ_WRITE_TOKEN,
      VERCEL_AUTOMATION_BYPASS_SECRET: "",
    });
  });
});

describe("veredictoEntornoPreview: solo la base y el Blob del preview", () => {
  it("acepta el preview y dice si hay bypass", () => {
    assert.deepEqual(veredictoEntornoPreview(bueno), {
      valido: true,
      host: HOST_PREVIEW,
      almacen: ALMACEN_PREVIEW,
      bypass: "presente",
    });
    const sinBypass = veredictoEntornoPreview({ ...bueno, VERCEL_AUTOMATION_BYPASS_SECRET: "" });
    assert.equal(sinBypass.valido && sinBypass.bypass, "VACIO");
  });

  it("RECHAZA la base de producción, aunque el Blob sea el del preview", () => {
    const v = veredictoEntornoPreview({ ...bueno, DATABASE_URI: uri(HOST_PRODUCCION) });
    assert.equal(v.valido, false);
    assert.match(!v.valido ? v.motivo : "", /PRODUCCIÓN/);
  });

  it("RECHAZA cualquier endpoint ep-tiny-fog, también sin pooler", () => {
    const v = veredictoEntornoPreview({
      ...bueno,
      DATABASE_URI: uri("ep-tiny-fog-awnwc8ie.c-12.us-east-1.aws.neon.tech"),
    });
    assert.equal(v.valido, false);
  });

  it("RECHAZA el Blob de producción, aunque la base sea la del preview", () => {
    const v = veredictoEntornoPreview({
      ...bueno,
      BLOB_READ_WRITE_TOKEN: token(ALMACEN_PRODUCCION),
    });
    assert.equal(v.valido, false);
    assert.match(!v.valido ? v.motivo : "", /PRODUCCIÓN/);
  });

  it("rechaza development, un host que solo contiene el del preview y el fichero vacío", () => {
    assert.equal(
      veredictoEntornoPreview({
        ...bueno,
        DATABASE_URI: uri("ep-aged-forest-aw4bua7l-pooler.c-12.us-east-1.aws.neon.tech"),
      }).valido,
      false,
    );
    assert.equal(
      veredictoEntornoPreview({ ...bueno, DATABASE_URI: uri(`${HOST_PREVIEW}.evil.test`) }).valido,
      false,
    );
    assert.equal(veredictoEntornoPreview({}).valido, false);
    assert.equal(veredictoEntornoPreview({ ...bueno, BLOB_READ_WRITE_TOKEN: "" }).valido, false);
  });

  it("el motivo nunca contiene el secreto", () => {
    const v = veredictoEntornoPreview({ ...bueno, DATABASE_URI: uri(HOST_PRODUCCION) });
    assert.doesNotMatch(JSON.stringify(v), /clave|SecretoDePrueba/);
  });
});
