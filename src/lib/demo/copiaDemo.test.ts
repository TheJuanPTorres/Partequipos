import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ALMACEN_PREVIEW, ALMACEN_PRODUCCION } from "../blob/almacen";
import { HOST_PREVIEW } from "../db/vaciadoSolicitudes";
import { HOST_PRODUCCION } from "../portada/heroPrueba";

import {
  HOST_DEVELOPMENT,
  MARCA_EJEMPLO,
  PREFIJO_COPIA,
  clave,
  esDeEjemplo,
  nombreDeCopia,
  origenValido,
  puedeRetirar,
  urlEnAlmacen,
  veredictoCreado,
  veredictoDestino,
  veredictoSubida,
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

/*
 * NOMBRES PROPIOS DE LOS FICHEROS COPIADOS (decisión del 2026-10-03). Los tres
 * puntos: nombre con prefijo; nunca la URL del origen ni una que ya exista en
 * el destino; y la retirada solo borra lo suyo. El caso real que lo motivó: en
 * modo «prueba» origen y destino comparten almacén, así que con el nombre
 * original la copia pisaba —y la retirada borraba— el fichero del preview.
 */
describe("copia de demostración: nombre propio de los ficheros", () => {
  const origen = urlEnAlmacen(ALMACEN_PREVIEW, "Bogota.jpg");

  it("1. todo fichero copiado lleva el prefijo, sin duplicarlo", () => {
    assert.equal(nombreDeCopia("Bogota.jpg"), `${PREFIJO_COPIA}Bogota.jpg`);
    assert.equal(nombreDeCopia(`${PREFIJO_COPIA}Bogota.jpg`), `${PREFIJO_COPIA}Bogota.jpg`);
    assert.notEqual(nombreDeCopia("Bogota.jpg"), "Bogota.jpg");
  });

  it("2a. se sube si la URL prevista lleva el prefijo, es otra y no existe", () => {
    const prevista = urlEnAlmacen(ALMACEN_PREVIEW, nombreDeCopia("Bogota.jpg"));
    assert.deepEqual(
      veredictoSubida({ urlOrigen: origen, urlPrevista: prevista, existeEnDestino: false }),
      { valido: true },
    );
  });

  it("2b. se niega si el fichero YA EXISTE en el destino", () => {
    const prevista = urlEnAlmacen(ALMACEN_PREVIEW, nombreDeCopia("Bogota.jpg"));
    const v = veredictoSubida({ urlOrigen: origen, urlPrevista: prevista, existeEnDestino: true });
    assert.equal(v.valido, false);
    assert.match(v.valido ? "" : v.motivo, /ya existe/);
  });

  it("2c. se niega si la URL de destino coincide con la de origen (el caso del preview)", () => {
    // Un fichero del origen que ya lleva el prefijo: su copia tendría su MISMA URL.
    const origenConPrefijo = urlEnAlmacen(ALMACEN_PREVIEW, `${PREFIJO_COPIA}Bogota.jpg`);
    const prevista = urlEnAlmacen(ALMACEN_PREVIEW, nombreDeCopia(`${PREFIJO_COPIA}Bogota.jpg`));
    const v = veredictoSubida({
      urlOrigen: origenConPrefijo,
      urlPrevista: prevista,
      existeEnDestino: false,
    });
    assert.equal(v.valido, false);
    assert.match(v.valido ? "" : v.motivo, /origen/);
  });

  it("2d. se niega si la URL prevista no lleva el prefijo", () => {
    const v = veredictoSubida({ urlOrigen: origen, urlPrevista: origen, existeEnDestino: false });
    assert.equal(v.valido, false);
  });

  it("2e. tras subir: lo creado debe llevar el prefijo y no ser el origen", () => {
    const creada = urlEnAlmacen(ALMACEN_PREVIEW, `${PREFIJO_COPIA}Bogota-1.jpg`);
    assert.deepEqual(veredictoCreado({ urlOrigen: origen, urlCreada: creada }), { valido: true });
    assert.equal(veredictoCreado({ urlOrigen: origen, urlCreada: origen }).valido, false);
    assert.equal(veredictoCreado({ urlOrigen: origen, urlCreada: null }).valido, false);
  });

  it("la misma URL cuenta como la misma aunque cambie la codificación", () => {
    const conEspacio = urlEnAlmacen(ALMACEN_PREVIEW, `${PREFIJO_COPIA}foto final.jpg`);
    const codificada = `https://${ALMACEN_PREVIEW}.public.blob.vercel-storage.com/${PREFIJO_COPIA}foto%20final.jpg`;
    assert.equal(veredictoCreado({ urlOrigen: conEspacio, urlCreada: codificada }).valido, false);
    assert.equal(puedeRetirar(codificada, [conEspacio]), true);
  });

  it("3. la retirada solo borra lo que está en su manifiesto Y lleva el prefijo", () => {
    const suya = urlEnAlmacen(ALMACEN_PREVIEW, `${PREFIJO_COPIA}Bogota.jpg`);
    const ajenaConPrefijo = urlEnAlmacen(ALMACEN_PREVIEW, `${PREFIJO_COPIA}Cali.jpeg`);
    const manifiesto = [suya, origen]; // un manifiesto antiguo podría traer la URL del origen
    assert.equal(puedeRetirar(suya, manifiesto), true);
    assert.equal(
      puedeRetirar(origen, manifiesto),
      false,
      "sin prefijo: nunca, aunque esté en el manifiesto",
    );
    assert.equal(
      puedeRetirar(ajenaConPrefijo, manifiesto),
      false,
      "con prefijo pero fuera del manifiesto: no",
    );
    assert.equal(puedeRetirar(null, manifiesto), false);
  });

  it("vale igual para el almacén de destino real", () => {
    const prevista = urlEnAlmacen(ALMACEN_PRODUCCION, nombreDeCopia("Bogota.jpg"));
    assert.equal(
      veredictoSubida({ urlOrigen: origen, urlPrevista: prevista, existeEnDestino: false }).valido,
      true,
    );
    assert.equal(
      veredictoSubida({ urlOrigen: origen, urlPrevista: prevista, existeEnDestino: true }).valido,
      false,
    );
    assert.equal(puedeRetirar(prevista, [prevista]), true);
  });
});
