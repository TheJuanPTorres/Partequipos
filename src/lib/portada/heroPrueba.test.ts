import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HOST_PREVIEW } from "../db/vaciadoSolicitudes";
import {
  ALMACEN_PREVIEW,
  ALMACEN_PRODUCCION,
  EQUIPOS_PRUEBA,
  IMAGENES_SECCIONES,
  almacenDeToken,
  esEquipoDePrueba,
  esDiapositivaDePrueba,
  puedeTocarHeroDePrueba,
  sinDiapositivasDePrueba,
} from "./heroPrueba";

const uri = (host: string) => `postgresql://u:p@${host}/neondb?sslmode=require`;
const token = (almacen: string) => `vercel_blob_rw_${almacen}_secreto123`;
const PROD_HOST = "ep-tiny-fog-awnwc8ie-pooler.c-12.us-east-1.aws.neon.tech";

describe("guardián de la diapositiva de prueba: base Y Blob del preview", () => {
  it("permite solo preview + preview", () => {
    assert.deepEqual(puedeTocarHeroDePrueba(uri(HOST_PREVIEW), token(ALMACEN_PREVIEW)), {
      permitido: true,
    });
  });

  it("RECHAZA la base de producción", () => {
    assert.equal(puedeTocarHeroDePrueba(uri(PROD_HOST), token(ALMACEN_PREVIEW)).permitido, false);
  });

  it("RECHAZA base de preview con el Blob de producción: el caso de .env.local", () => {
    const v = puedeTocarHeroDePrueba(uri(HOST_PREVIEW), token("sr2s4ngkjzfzpxhi"));
    assert.equal(v.permitido, false);
    assert.match(v.permitido ? "" : v.motivo, /PRODUCCIÓN/);
  });

  it("rechaza si falta cualquiera de las dos variables", () => {
    assert.equal(puedeTocarHeroDePrueba(undefined, token(ALMACEN_PREVIEW)).permitido, false);
    assert.equal(puedeTocarHeroDePrueba(uri(HOST_PREVIEW), undefined).permitido, false);
  });

  it("el id del almacén sale del token sin exponer el secreto", () => {
    assert.equal(almacenDeToken(token("AbC123")), "abc123");
    assert.equal(almacenDeToken("otra-cosa"), null);
  });
});

describe("reconocer y quitar la diapositiva de prueba", () => {
  const prueba = { titulo: "Potencia Hitachi", imagenFondo: 8, imagenFrontal: 9 };
  const real = { titulo: "Potencia Hitachi", imagenFondo: 3 };
  const otra = { titulo: "Potencia Case", imagenFondo: { id: 8 } };

  it("es de prueba si tiene el título Y usa una imagen de prueba", () => {
    assert.equal(esDiapositivaDePrueba(prueba, [8, 9]), true);
    assert.equal(esDiapositivaDePrueba(real, [8, 9]), false, "mismo título, imagen real");
    assert.equal(esDiapositivaDePrueba(otra, [8, 9]), false, "imagen de prueba, otro título");
  });

  it("quita solo la de prueba y conserva el orden del resto", () => {
    assert.deepEqual(sinDiapositivasDePrueba([real, prueba, otra], [8, 9]), [real, otra]);
  });
});

describe("modo producción (demo al cliente)", () => {
  it("con la bandera, solo base Y Blob de producción", () => {
    assert.deepEqual(puedeTocarHeroDePrueba(uri(PROD_HOST), token(ALMACEN_PRODUCCION), true), {
      permitido: true,
    });
  });

  it("sin la bandera, producción se sigue rechazando", () => {
    assert.equal(
      puedeTocarHeroDePrueba(uri(PROD_HOST), token(ALMACEN_PRODUCCION)).permitido,
      false,
    );
  });

  it("con la bandera, rechaza el preview y la base de development con el Blob de producción", () => {
    assert.equal(
      puedeTocarHeroDePrueba(uri(HOST_PREVIEW), token(ALMACEN_PREVIEW), true).permitido,
      false,
    );
    const dev = "ep-aged-forest-aw4bua7l-pooler.c-12.us-east-1.aws.neon.tech";
    assert.equal(
      puedeTocarHeroDePrueba(uri(dev), token(ALMACEN_PRODUCCION), true).permitido,
      false,
    );
  });
});

describe("secciones 2 y 3 de prueba", () => {
  it("cada equipo de prueba usa una imagen que se siembra, sin marca visible", () => {
    const ficheros = IMAGENES_SECCIONES.map((i) => i.fichero as string);
    for (const e of EQUIPOS_PRUEBA) {
      assert.ok(ficheros.includes(e.imagen), e.imagen);
      assert.doesNotMatch(`${e.nombre} ${e.descripcion}`, /PRUEBA/);
    }
    for (const i of IMAGENES_SECCIONES) assert.match(i.alt, /^PRUEBA HERO — /);
  });

  it("un equipo es de prueba solo si usa una imagen de prueba", () => {
    assert.equal(esEquipoDePrueba({ imagenes: [3, { id: 8 }] }, [8, 9]), true);
    assert.equal(esEquipoDePrueba({ imagenes: [3] }, [8, 9]), false);
    assert.equal(esEquipoDePrueba({ imagenes: null }, [8, 9]), false);
  });
});
