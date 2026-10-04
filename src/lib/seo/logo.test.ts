import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { seoConfig } from "./config";
import {
  LOGO_SITIO_RESPALDO,
  logoDelSitio,
  urlImagenSocialPorDefecto,
  urlLogoBuscadores,
} from "./logo";

const subido = { url: "https://ejemplo.blob/logo.png", width: 1614, height: 317 };

describe("logo institucional", () => {
  it("vacío, sin poblar o sin medidas: todo lo de siempre (nada cambia)", () => {
    for (const vacio of [
      undefined,
      null,
      7,
      {},
      { url: "  " },
      { url: "x", width: 0, height: 10 },
    ]) {
      assert.deepEqual(logoDelSitio(vacio), LOGO_SITIO_RESPALDO);
      assert.equal(urlLogoBuscadores(vacio), seoConfig.logoPath);
      assert.equal(urlImagenSocialPorDefecto(vacio), seoConfig.defaultOgImagePath);
    }
  });

  it("el de siempre de la cabecera es el de public/, no el del Blob", () => {
    assert.equal(LOGO_SITIO_RESPALDO.src, "/logo-partequipos.png");
    assert.deepEqual([LOGO_SITIO_RESPALDO.width, LOGO_SITIO_RESPALDO.height], [187, 51]);
  });

  it("subido: los cuatro usan el de Media", () => {
    assert.equal(urlLogoBuscadores(subido), subido.url);
    assert.equal(urlImagenSocialPorDefecto(subido), subido.url);
    assert.equal(logoDelSitio(subido).src, subido.url);
  });

  it("imagen social: la propia, si no el logo, si no config.ts; el JSON-LD sigue con el logo", () => {
    const social = { url: "https://ejemplo.blob/social.jpg", width: 1200, height: 630 };
    assert.equal(urlImagenSocialPorDefecto(subido, social), social.url);
    assert.equal(urlImagenSocialPorDefecto(undefined, social), social.url);
    assert.equal(urlImagenSocialPorDefecto(subido, null), subido.url);
    assert.equal(urlImagenSocialPorDefecto(null, { url: " " }), seoConfig.defaultOgImagePath);
    assert.equal(urlLogoBuscadores(subido), subido.url);
  });

  it("subido: medidas escaladas a 187 px de ancho, con su proporción", () => {
    assert.deepEqual(logoDelSitio(subido), { src: subido.url, width: 187, height: 37 });
  });
});
