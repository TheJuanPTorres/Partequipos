import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HOST_DEVELOPMENT } from "../demo/copiaDemo";
import { HOST_PRODUCCION } from "../portada/heroPrueba";
import { esBaseDePrueba, exigirBaseDePrueba } from "./basePrueba";
import { HOST_PREVIEW } from "./vaciadoSolicitudes";

const uri = (host: string) => `postgresql://u:p@${host}/neondb?sslmode=require`;

describe("esBaseDePrueba", () => {
  it("admite development, el preview y un Postgres local (CI)", () => {
    for (const h of [HOST_DEVELOPMENT, HOST_PREVIEW, "localhost", "127.0.0.1"])
      assert.equal(esBaseDePrueba(uri(h)).permitido, true, h);
    assert.equal(esBaseDePrueba("postgres://u:p@[::1]:5432/x").permitido, true);
  });

  it("se niega con la base del sitio publicado, con otra cualquiera y sin variable", () => {
    for (const u of [
      uri(HOST_PRODUCCION),
      uri("ep-otra-rama-123-pooler.c-12.us-east-1.aws.neon.tech"),
      // Un host que solo CONTIENE el del preview no lo es.
      uri(`${HOST_PREVIEW}.trampa.example`),
      "no es una url",
      "",
      undefined,
    ])
      assert.equal(esBaseDePrueba(u).permitido, false, String(u));
  });

  it("exigirBaseDePrueba lanza con el área y el motivo, y devuelve el host si vale", () => {
    assert.throws(() => exigirBaseDePrueba("qa-x", uri(HOST_PRODUCCION)), /\[qa-x\] se niega/);
    assert.equal(exigirBaseDePrueba("qa-x", uri(HOST_PREVIEW)), HOST_PREVIEW);
  });
});
