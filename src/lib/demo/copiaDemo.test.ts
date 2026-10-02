import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ALMACEN_PREVIEW, ALMACEN_PRODUCCION } from "../blob/almacen";
import { HOST_PREVIEW } from "../db/vaciadoSolicitudes";
import { HOST_PRODUCCION } from "../portada/heroPrueba";

import {
  HOST_DEVELOPMENT,
  MARCA_EJEMPLO,
  clave,
  esDeEjemplo,
  origenValido,
  veredictoDestino,
} from "./copiaDemo";

const uri = (host: string) => `postgres://u:p@${host}/neondb?sslmode=require`;
const token = (a: string) => `vercel_blob_rw_${a}_Secreto123`;

describe("copia de demostración: guarda del destino", () => {
  it("producción: solo base Y almacén de producción", () => {
    assert.equal(
      veredictoDestino("produccion", uri(HOST_PRODUCCION), token(ALMACEN_PRODUCCION)).valido,
      true,
    );
    assert.equal(
      veredictoDestino("produccion", uri(HOST_PRODUCCION), token(ALMACEN_PREVIEW)).valido,
      false,
    );
    assert.equal(
      veredictoDestino("produccion", uri(HOST_PREVIEW), token(ALMACEN_PRODUCCION)).valido,
      false,
    );
  });

  it("prueba: una rama desechable de Neon con el almacén del preview; nunca development", () => {
    assert.equal(
      veredictoDestino("prueba", uri("ep-rama-temporal-pooler.neon.tech"), token(ALMACEN_PREVIEW))
        .valido,
      true,
    );
    assert.equal(
      veredictoDestino("prueba", uri(HOST_DEVELOPMENT), token(ALMACEN_PREVIEW)).valido,
      false,
    );
  });

  it("prueba: solo una base local con el almacén del preview", () => {
    assert.equal(
      veredictoDestino("prueba", uri("127.0.0.1:54329"), token(ALMACEN_PREVIEW)).valido,
      true,
    );
    assert.equal(
      veredictoDestino("prueba", uri(HOST_PREVIEW), token(ALMACEN_PREVIEW)).valido,
      false,
    );
    assert.equal(
      veredictoDestino("prueba", uri(HOST_PRODUCCION), token(ALMACEN_PREVIEW)).valido,
      false,
    );
    assert.equal(
      veredictoDestino("prueba", uri("127.0.0.1"), token(ALMACEN_PRODUCCION)).valido,
      false,
    );
  });

  it("sin destino explícito, sin base o sin token: no", () => {
    assert.equal(
      veredictoDestino(undefined, uri(HOST_PRODUCCION), token(ALMACEN_PRODUCCION)).valido,
      false,
    );
    assert.equal(
      veredictoDestino("produccion", undefined, token(ALMACEN_PRODUCCION)).valido,
      false,
    );
    assert.equal(veredictoDestino("produccion", uri(HOST_PRODUCCION), undefined).valido, false);
  });
});

describe("copia de demostración: origen", () => {
  it("solo una URL fija de preview, nunca producción", () => {
    assert.equal(
      origenValido("https://partequipos-qd61e6bhz-thejuanptorres-projects.vercel.app/"),
      "https://partequipos-qd61e6bhz-thejuanptorres-projects.vercel.app",
    );
    for (const u of [
      "https://partequipos.vercel.app",
      "http://partequipos-qd61e6bhz-thejuanptorres-projects.vercel.app",
      "https://evil.com",
      undefined,
    ])
      assert.equal(origenValido(u), null, String(u));
  });
});

describe("copia de demostración: claves naturales", () => {
  it("no distinguen mayúsculas ni espacios", () => {
    assert.equal(clave.pregunta({ pregunta: " ¿Qué? " }), clave.pregunta({ pregunta: "¿qué?" }));
    assert.equal(clave.sede({ nombre: "Bogotá" }), "bogotá");
  });

  it("distinguen fichas con el mismo nombre por su descripción", () => {
    const a = { nombre: "Excavadora Hitachi ZX75US-7", descripcion: `${MARCA_EJEMPLO} ficha 1.` };
    const b = { nombre: "Excavadora Hitachi ZX75US-7", descripcion: `${MARCA_EJEMPLO} ficha 2.` };
    assert.notEqual(clave.equipo(a), clave.equipo(b));
    assert.equal(clave.equipo(a), clave.equipo({ ...a, nombre: " excavadora hitachi zx75us-7 " }));
  });
});

describe("copia de demostración: contenido de ejemplo", () => {
  it("reconoce la marca solo al principio", () => {
    assert.equal(esDeEjemplo(`${MARCA_EJEMPLO} ficha 1`), true);
    assert.equal(esDeEjemplo(`  ${MARCA_EJEMPLO} x`), true);
    assert.equal(esDeEjemplo(`Equipo real. ${MARCA_EJEMPLO}`), false);
    assert.equal(esDeEjemplo(null), false);
    assert.equal(esDeEjemplo(""), false);
  });
});
