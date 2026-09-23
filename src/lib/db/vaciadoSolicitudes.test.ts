import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HOST_PREVIEW, hostDeConexion, puedeVaciarSolicitudes } from "./vaciadoSolicitudes";

const conexion = (host: string) => `postgresql://usuario:clave@${host}/neondb?sslmode=require`;

describe("vaciar solicitudes: solo en la rama preview", () => {
  it("permite el host de preview", () => {
    assert.deepEqual(puedeVaciarSolicitudes(conexion(HOST_PREVIEW)), { permitido: true });
  });

  it("RECHAZA producción: es el caso que el guardián existe para impedir", () => {
    const v = puedeVaciarSolicitudes(
      conexion("ep-tiny-fog-awnwc8ie-pooler.c-12.us-east-1.aws.neon.tech"),
    );
    assert.equal(v.permitido, false);
  });

  it("rechaza development y cualquier host desconocido", () => {
    assert.equal(
      puedeVaciarSolicitudes(
        conexion("ep-aged-forest-aw4bua7l-pooler.c-12.us-east-1.aws.neon.tech"),
      ).permitido,
      false,
    );
    assert.equal(puedeVaciarSolicitudes(conexion("localhost")).permitido, false);
  });

  it("rechaza un host que solo CONTIENE el de preview", () => {
    assert.equal(puedeVaciarSolicitudes(conexion(`${HOST_PREVIEW}.otro.com`)).permitido, false);
  });

  it("rechaza sin variable o con una URL inválida", () => {
    assert.equal(puedeVaciarSolicitudes(undefined).permitido, false);
    assert.equal(puedeVaciarSolicitudes("   ").permitido, false);
    assert.equal(puedeVaciarSolicitudes("no-es-una-url").permitido, false);
  });

  it("el host se extrae sin credenciales", () => {
    assert.equal(hostDeConexion(conexion(HOST_PREVIEW)), HOST_PREVIEW);
  });
});
