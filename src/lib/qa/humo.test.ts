import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  debeReintentar,
  esperaMs,
  INTENTOS_MAXIMOS,
  RUTAS,
  rutasPara,
  veredicto,
  type Resultado,
} from "./humo";

/**
 * Una prueba de humo que nunca falla es el mismo problema que un guardarraíl que
 * nunca falla (§10.25). Aquí se fija que **falla cuando debe**: con un 500, con
 * un 404, con un 3xx y con la red caída.
 */
const ok = (ruta: string): Resultado => ({ estado: 200, intentos: 1, ruta });

describe("rutas de la prueba de humo", () => {
  it("no lee el sitemap: la lista es fija", () => {
    assert.ok(RUTAS.length >= 5);
    assert.ok(
      RUTAS.every((r) => r.ruta.startsWith("/")),
      "las rutas son relativas al despliegue que se mide",
    );
  });

  it("incluye las cuatro rutas que solo fallan en tiempo de petición", () => {
    const enPreview = rutasPara("preview").map((r) => r.ruta);
    for (const ruta of ["/admin/", "/api/marcas/", "/sitemap.xml", "/"]) {
      assert.ok(enPreview.includes(ruta), `falta ${ruta}`);
    }
  });

  it("el mapa de redirects se mide SOLO en producción (§10.22)", () => {
    assert.ok(rutasPara("production").some((r) => r.ruta === "/api/redirects-map/"));
    assert.ok(
      !rutasPara("preview").some((r) => r.ruta === "/api/redirects-map/"),
      "en preview el token de derivación falsearía el resultado",
    );
  });

  it("el mapa de redirects va con su cabecera interna, o daría 403", () => {
    const mapa = RUTAS.find((r) => r.ruta === "/api/redirects-map/");
    assert.equal(mapa?.cabeceras?.["x-proxy-internal"], "1");
  });
});

describe("reintentos acotados", () => {
  it("reintenta un 5xx y un fallo de red", () => {
    assert.equal(debeReintentar({ estado: 500, intentos: 1, ruta: "/" }), true);
    assert.equal(debeReintentar({ error: "ECONNRESET", intentos: 1, ruta: "/" }), true);
  });

  it("NO reintenta un 4xx: no es arranque en frío", () => {
    assert.equal(debeReintentar({ estado: 403, intentos: 1, ruta: "/" }), false);
    assert.equal(debeReintentar({ estado: 404, intentos: 1, ruta: "/" }), false);
  });

  it("para en el límite: un bucle infinito no puede ser la forma de fallar", () => {
    assert.equal(
      debeReintentar({ estado: 500, intentos: INTENTOS_MAXIMOS, ruta: "/" }),
      false,
      "siguió reintentando un 500 tras agotar los intentos",
    );
  });

  it("la espera crece pero está acotada: 7 s por ruta como máximo", () => {
    const esperas = [1, 2, 3].map(esperaMs);
    assert.deepEqual(esperas, [1000, 2000, 4000]);
    assert.equal(
      esperas.reduce((a, b) => a + b, 0),
      7000,
    );
  });
});

describe("veredicto (comprobación de que la prueba FALLA cuando debe)", () => {
  it("pasa solo si todas dan 200", () => {
    const v = veredicto([ok("/"), ok("/admin/")]);
    assert.equal(v.codigo, 0);
    assert.equal(v.fallos.length, 0);
  });

  it("FALLA con un 500, que es el modo de fallo de §10.18", () => {
    const v = veredicto([ok("/"), { estado: 500, intentos: 4, ruta: "/admin/" }]);
    assert.equal(v.codigo, 1, "un 500 en /admin/ pasó como bueno");
    assert.deepEqual(
      v.fallos.map((f) => f.ruta),
      ["/admin/"],
    );
  });

  it("FALLA con un 3xx: un redirect no es un éxito", () => {
    const v = veredicto([{ estado: 302, intentos: 1, ruta: "/api/redirects-map/" }]);
    assert.equal(v.codigo, 1, "un 302 —la protección sin derivar— pasó como bueno");
  });

  it("FALLA con la red caída", () => {
    const v = veredicto([{ error: "fetch failed", intentos: 4, ruta: "/" }]);
    assert.equal(v.codigo, 1);
    assert.match(v.lineas[0]!, /error de red/);
  });

  it("dice QUÉ ruta y QUÉ código, que es lo que se lee al fallar", () => {
    const v = veredicto([{ estado: 503, intentos: 4, ruta: "/sitemap.xml" }]);
    assert.match(v.lineas[0]!, /✗ \/sitemap\.xml — HTTP 503 \(4 intentos\)/);
  });
});
