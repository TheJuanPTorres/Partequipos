import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ALTO_ENCOGIDA, inicioDelPanel, modoCabecera } from "./modo";

const base = { esPortada: true, arriba: true, menuMovilAbierto: false, megaAbierto: false };
const aqui = path.dirname(fileURLToPath(import.meta.url));
const leer = (rel: string) => fs.readFileSync(path.resolve(aqui, rel), "utf8");

describe("modoCabecera", () => {
  it("portada y arriba del todo: transparente", () => {
    assert.equal(modoCabecera(base), "transparente");
  });

  it("portada y bajando: velo", () => {
    assert.equal(modoCabecera({ ...base, arriba: false }), "velo");
  });

  it("portada con un megamenú abierto: velo aunque esté arriba (barra y panel, una sola pieza)", () => {
    assert.equal(modoCabecera({ ...base, megaAbierto: true }), "velo");
  });

  it("cualquier otra página: sólido, abierto o no el megamenú", () => {
    assert.equal(modoCabecera({ ...base, esPortada: false }), "solido");
    assert.equal(
      modoCabecera({ ...base, esPortada: false, arriba: false, megaAbierto: true }),
      "solido",
    );
  });

  it("con el menú móvil abierto: sólido (se lee sobre blanco)", () => {
    assert.equal(modoCabecera({ ...base, menuMovilAbierto: true }), "solido");
  });
});

describe("inicioDelPanel", () => {
  it("encogida, son 70 px; si no, el alto medido", () => {
    assert.equal(inicioDelPanel(100, true), ALTO_ENCOGIDA);
    assert.equal(inicioDelPanel(100, false), 100);
    assert.equal(inicioDelPanel(84.4, false), 84);
  });

  it("sin medida, null (el CSS tiene su valor de reserva)", () => {
    assert.equal(inicioDelPanel(null, false), null);
    assert.equal(inicioDelPanel(0, false), null);
  });
});

describe("la cabecera NUNCA se oculta (petición de Andrés, 2026-10-14)", () => {
  const tsx = leer("../../components/layout/Cabecera.tsx");
  const css = leer("../../components/layout/cabecera.module.css");

  it("el componente no tiene estado de ocultar ni el atributo `data-oculta`", () => {
    assert.doesNotMatch(tsx, /data-oculta/);
    assert.doesNotMatch(tsx, /setOculta|esconder/);
  });

  it("la hoja de estilos no mueve la cabecera fuera de la vista", () => {
    assert.doesNotMatch(css, /data-oculta/);
    assert.doesNotMatch(css, /translateY\(-110vh\)/);
  });

  it("la cabecera es `sticky` y no vuelve a `relative` en ningún ancho", () => {
    assert.match(css, /position:\s*sticky/);
    assert.doesNotMatch(css, /position:\s*relative/);
  });
});
