import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { estaPausado, etiquetaPausa } from "./pausa";
import {
  RITMOS,
  curvaCss,
  evaluarCurva,
  margenDeDisparo,
  partirEnPalabras,
  pasoElDisparo,
  resolverRitmo,
  textoPlano,
} from "./ritmos";

describe("ritmos del revelado", () => {
  it("los tres ritmos son los de 1717.json", () => {
    assert.deepEqual(RITMOS.titulo, { escalon: 0.06, duracion: 0.9, distancia: 100 });
    assert.deepEqual(RITMOS.portada, { escalon: 0.3, duracion: 2, distancia: 50 });
    assert.deepEqual(RITMOS.pausado, { escalon: 0.01, duracion: 2, distancia: 100 });
  });

  it("por defecto dispara al 85 %, con power3.out y una sola vez", () => {
    const r = resolverRitmo("titulo");
    assert.equal(r.disparo, 0.85);
    assert.equal(r.curva, "power3.out");
    assert.equal(r.unaVez, true);
  });

  it("los ajustes por instancia ganan al ritmo", () => {
    const r = resolverRitmo("titulo", { disparo: 0.95, curva: "back.out" });
    assert.equal(r.disparo, 0.95);
    assert.equal(r.curva, "back.out");
    assert.equal(r.escalon, 0.06);
  });

  it("rechaza un disparo fuera de rango, en vez de no dispararse nunca en silencio", () => {
    assert.throws(() => resolverRitmo("titulo", { disparo: 0 }), RangeError);
    assert.throws(() => resolverRitmo("titulo", { disparo: 85 }), RangeError);
    assert.throws(() => resolverRitmo("titulo", { duracion: 0 }), RangeError);
  });
});

describe("disparo", () => {
  it("se dispara al cruzar la línea, no antes", () => {
    assert.equal(pasoElDisparo(760, 900, 0.85), true); // 765 es la línea
    assert.equal(pasoElDisparo(770, 900, 0.85), false);
  });

  it("un bloque que ya quedó POR ENCIMA de la ventana también se revela", () => {
    // Entrar con el scroll bajado: un IntersectionObserver a secas no avisaría.
    assert.equal(pasoElDisparo(-2000, 900, 0.85), true);
  });

  it("el margen del observador recorta lo que queda por debajo de la línea", () => {
    assert.equal(margenDeDisparo(0.85), "0px 0px -15% 0px");
    assert.equal(margenDeDisparo(0.95), "0px 0px -5% 0px");
    assert.equal(margenDeDisparo(1), "0px 0px -0% 0px");
  });
});

describe("partir en palabras", () => {
  it("normaliza espacios, tabuladores y NBSP como el widget", () => {
    assert.deepEqual(partirEnPalabras("  Maquinaria \t pesada nueva "), [
      ["Maquinaria", "pesada", "nueva"],
    ]);
  });

  it("respeta el salto de línea forzado y descarta líneas vacías", () => {
    assert.deepEqual(partirEnPalabras("Potencia \n Hitachi\n\n"), [["Potencia"], ["Hitachi"]]);
  });

  it("el texto plano junta las líneas con un espacio", () => {
    assert.equal(textoPlano("Potencia\nHitachi"), "Potencia Hitachi");
  });

  it("un texto vacío no produce palabras", () => {
    assert.deepEqual(partirEnPalabras("   "), []);
  });
});

describe("curvas", () => {
  it("power3.out es la de GSAP: 1 − (1 − t)³", () => {
    assert.equal(evaluarCurva("power3.out", 0), 0);
    assert.equal(evaluarCurva("power3.out", 1), 1);
    assert.equal(evaluarCurva("power3.out", 0.5), 0.875);
  });

  it("back.out(1.4) se pasa de 1 y vuelve", () => {
    const pico = Math.max(
      ...Array.from({ length: 101 }, (_, i) => evaluarCurva("back.out", i / 100)),
    );
    assert.ok(pico > 1.05 && pico < 1.2, `pico ${pico}`);
    assert.equal(Math.round(evaluarCurva("back.out", 1) * 1e9) / 1e9, 1);
  });

  it("el linear() de CSS empieza en 0, acaba en 1 y lleva todas las muestras", () => {
    const css = curvaCss("power3.out", 10);
    const valores = css.slice("linear(".length, -1).split(", ").map(Number);
    assert.equal(valores.length, 11);
    assert.equal(valores[0], 0);
    assert.equal(valores.at(-1), 1);
  });
});

describe("pausa", () => {
  it("sin elección del usuario, manda prefers-reduced-motion", () => {
    assert.equal(estaPausado(null, true), true);
    assert.equal(estaPausado(null, false), false);
  });

  it("en cuanto el usuario elige, manda su elección", () => {
    assert.equal(estaPausado(false, true), false);
    assert.equal(estaPausado(true, false), true);
  });

  it("el botón dice lo que hará al pulsarlo", () => {
    assert.equal(etiquetaPausa(false, "el vídeo"), "Pausar el vídeo");
    assert.equal(etiquetaPausa(true, "el vídeo"), "Reproducir el vídeo");
  });
});
