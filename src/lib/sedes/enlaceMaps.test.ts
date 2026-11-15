import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  enlaceDeGoogleMaps,
  enlaceDeLinea,
  leerCoordenadas,
  validarCoordenadas,
  validarEnlaceMaps,
} from "./enlaceMaps";

const base = { direccion: "Calle 6 Nro 26-73", ciudad: "Bogotá" };

describe("enlace de Google Maps", () => {
  it("acepta los enlaces de «Compartir» y los de la web de Google Maps", () => {
    for (const ok of [
      "https://maps.app.goo.gl/AbCdEf123",
      "https://goo.gl/maps/AbCdEf123",
      "https://www.google.com/maps/place/Partequipos/@4.6,-74.1,17z",
      "https://www.google.com.co/maps/@4.6,-74.1,17z",
      "https://google.com/maps?q=4.6,-74.1",
      "https://maps.google.com/?q=4.6,-74.1",
      "  https://maps.app.goo.gl/AbCdEf123  ",
    ]) {
      assert.ok(enlaceDeGoogleMaps(ok), ok);
      assert.equal(validarEnlaceMaps(ok), true, ok);
    }
  });

  it("rechaza lo que no es Google Maps, o http, o con trucos en el host", () => {
    for (const mal of [
      "http://maps.app.goo.gl/AbCdEf123",
      "https://maps.app.goo.gl/",
      "https://goo.gl/AbCdEf",
      "https://www.google.com/search?q=partequipos",
      "https://www.google.com.evil.co/maps/x",
      "https://google.com.co.evil.com/maps/x",
      "https://user@www.google.com/maps/x",
      "https://www.google.com:8443/maps/x",
      "https://www.waze.com/ul?ll=4.6,-74.1",
      "Calle 6 Nro 26-73",
      "javascript:alert(1)",
    ]) {
      assert.equal(enlaceDeGoogleMaps(mal), null, mal);
      assert.equal(typeof validarEnlaceMaps(mal), "string", mal);
    }
  });

  it("vacío es válido: el campo es opcional", () => {
    for (const v of [undefined, null, "", "   "]) assert.equal(validarEnlaceMaps(v), true);
  });
});

describe("coordenadas «lat, lng»", () => {
  it("lee el formato que copia Google Maps", () => {
    assert.deepEqual(leerCoordenadas("4.6467, -74.1287"), { lat: 4.6467, lng: -74.1287 });
    assert.deepEqual(leerCoordenadas("4.6467,-74.1287"), { lat: 4.6467, lng: -74.1287 });
    assert.equal(leerCoordenadas("4,6467 -74,1287"), null);
    assert.equal(leerCoordenadas("Bogotá"), null);
  });

  it("valida con las reglas de Colombia del #430", () => {
    assert.equal(validarCoordenadas("4.6467, -74.1287"), true);
    assert.equal(validarCoordenadas(""), true);
    assert.match(String(validarCoordenadas("4.6467, 74.1287")), /negativa/);
    assert.match(String(validarCoordenadas("-74.1287, 4.6467")), /latitud/i);
    assert.match(String(validarCoordenadas("4.6467")), /coma/);
  });
});

describe("el botón «Ver en Google Maps», por orden", () => {
  it("1. el enlace de la línea", () => {
    const r = enlaceDeLinea({
      ...base,
      enlace: "https://maps.app.goo.gl/AbCdEf123",
      coordenadas: "4.6, -74.1",
    });
    assert.deepEqual(r, { href: "https://maps.app.goo.gl/AbCdEf123", origen: "enlace" });
  });

  it("2. las coordenadas de la línea (un enlace inválido no cuenta)", () => {
    const r = enlaceDeLinea({
      ...base,
      enlace: "https://www.waze.com/x",
      coordenadas: "4.61, -74.08",
    });
    assert.equal(r.origen, "coordenadas");
    assert.equal(r.href, "https://www.google.com/maps/search/?api=1&query=4.61,-74.08");
  });

  it("3. la dirección escrita: sin enlace ni coordenadas de la línea (las de la sede no cuentan)", () => {
    const r = enlaceDeLinea({ ...base });
    assert.equal(r.origen, "direccion");
    assert.equal(
      r.href,
      "https://www.google.com/maps/search/?api=1&query=Calle%206%20Nro%2026-73%2C%20Bogot%C3%A1",
    );
  });

  it("3. también con coordenadas de la línea inválidas", () => {
    const r = enlaceDeLinea({ ...base, coordenadas: "4.6, 74.1" });
    assert.equal(r.origen, "direccion");
    assert.equal(
      r.href,
      "https://www.google.com/maps/search/?api=1&query=Calle%206%20Nro%2026-73%2C%20Bogot%C3%A1",
    );
  });
});
