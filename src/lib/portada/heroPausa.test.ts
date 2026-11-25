import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/*
 * GUARDARRAÍL DE LA PAUSA DEL CARRUSEL DE LA PORTADA (BUG-003, 2026-11-25).
 *
 * El carrusel y el texto circular solo se detienen con el botón de pausa. Antes también los
 * detenían el ratón encima y el foco dentro, y por eso «Reproducir» no reanudaba nada: el foco
 * seguía en el propio botón. Y las flechas y los puntos pausaban el pase.
 *
 * Esto mira el CÓDIGO, sin navegador, para que CI avise si vuelve una pausa automática. El ciclo
 * real pausa → play se prueba pintado con `npm run qa:hero-pausa -- <url>`.
 */

const aqui = path.dirname(fileURLToPath(import.meta.url));
const leer = (ruta: string) => readFileSync(path.join(aqui, "../../components/hero", ruta), "utf8");
const componente = leer("HeroPortada.tsx");
const css = leer("hero.module.css");

describe("pausa del carrusel de la portada", () => {
  it("el hero solo se pausa con el estado del botón", () => {
    assert.match(componente, /data-pausado=\{pausado \? "" : undefined\}/);
  });

  it("ni el ratón ni el foco pausan el hero", () => {
    const apertura = /<section[\s\S]*?\n {4}>/.exec(componente)?.[0] ?? "";
    assert.ok(apertura.includes("data-pausado"), "no encuentro la etiqueta del hero");
    for (const evento of ["onMouseEnter", "onMouseLeave", "onFocus", "onBlur", "onPointerEnter"]) {
      assert.ok(!apertura.includes(evento), `el hero vuelve a escuchar ${evento}`);
    }
  });

  it("cambiar de diapositiva no pausa: nadie llama a pausar()", () => {
    assert.doesNotMatch(componente, /\bpausar\(\)/);
  });

  it("el texto circular no se vuelve a montar en cada diapositiva", () => {
    assert.doesNotMatch(componente, /<TextoCircular[^>]*\bkey=/);
  });

  it("todo lo que se mueve solo se detiene con la misma pausa", () => {
    for (const pieza of [".fondo", ".circular svg", ".punto::after"]) {
      const regla = new RegExp(
        `\\.hero\\[data-pausado\\] ${pieza.replace(/[.:]/g, "\\$&")}[^{]*\\{\\s*animation-play-state: paused;`,
      );
      assert.match(css, regla, `falta la pausa de ${pieza}`);
    }
  });
});
