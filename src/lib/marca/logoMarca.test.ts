import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { claveDeMarca, indiceDeLogos, logoDeMarca, logoPropio } from "./logoMarca";

const media = (url: string) => ({ url, width: 419, height: 100 });

describe("claveDeMarca", () => {
  it("iguala espacios, guiones, mayúsculas y tildes", () => {
    assert.equal(claveDeMarca("Link Belt"), claveDeMarca("Link-Belt"));
    assert.equal(claveDeMarca("LiuGong"), claveDeMarca("Liugong"));
    assert.equal(claveDeMarca(" Case Construction "), "caseconstruction");
    assert.equal(claveDeMarca(null), "");
  });
});

describe("logoPropio", () => {
  it("con url y medidas, el logo y su casilla de tinta oscura", () => {
    assert.deepEqual(logoPropio({ logo: media("/a.png"), logoOscuroEnMenu: true }), {
      url: "/a.png",
      width: 419,
      height: 100,
      oscuro: true,
    });
    assert.equal(logoPropio({ logo: media("/a.png") })?.oscuro, false);
  });

  it("sin logo poblado, o sin url o medidas, null", () => {
    assert.equal(logoPropio({ logo: 7 }), null);
    assert.equal(logoPropio({ logo: { url: "/a.png", width: 0, height: 10 } }), null);
    assert.equal(logoPropio(null), null);
  });
});

describe("logoDeMarca", () => {
  const indice = indiceDeLogos([
    { nombre: "Hitachi", logo: media("/rep-hitachi.png"), logoOscuroEnMenu: true },
    { nombre: "Link Belt", logo: media("/rep-linkbelt.png"), logoOscuroEnMenu: true },
    { nombre: "Okada", logo: null },
  ]);

  it("una marca de nueva o de usados con el nombre de una de repuestos usa el logo de repuestos", () => {
    const l = logoDeMarca({ nombre: "Hitachi", logo: media("/nueva-hitachi.png") }, indice);
    assert.equal(l?.url, "/rep-hitachi.png");
    assert.equal(l?.oscuro, true);
    assert.equal(logoDeMarca({ nombre: "Link-Belt" }, indice)?.url, "/rep-linkbelt.png");
  });

  it("sin marca de repuestos con su nombre (o sin logo allí), el suyo propio", () => {
    assert.equal(
      logoDeMarca({ nombre: "Dynapac", logo: media("/dynapac.jpg") }, indice)?.url,
      "/dynapac.jpg",
    );
    assert.equal(
      logoDeMarca({ nombre: "Okada", logo: media("/okada.png") }, indice)?.url,
      "/okada.png",
    );
  });

  it("«CASE» es «Case Construction»: por el comienzo, solo si encaja una marca", () => {
    const conCase = indiceDeLogos([
      { nombre: "Case Construction", logo: media("/rep-case.png"), logoOscuroEnMenu: true },
      { nombre: "Hitachi", logo: media("/rep-hitachi.png") },
    ]);
    assert.equal(
      logoDeMarca({ nombre: "CASE", logo: media("/case.png") }, conCase)?.url,
      "/rep-case.png",
    );
    // Menos de 3 letras: no se adivina.
    assert.equal(logoDeMarca({ nombre: "CA", logo: media("/ca.png") }, conCase)?.url, "/ca.png");
    // ENI o CF no son marcas de repuestos: su logo.
    assert.equal(logoDeMarca({ nombre: "ENI", logo: media("/eni.jpg") }, conCase)?.url, "/eni.jpg");
  });

  it("sin ninguno, null", () => {
    assert.equal(logoDeMarca({ nombre: "Ammann" }, indice), null);
  });
});
