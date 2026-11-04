import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { botonesNav, botonesNavDeRespaldo } from "./navSecciones";

const m = { url: "/m.webp", alt: "", width: 10, height: 10, posicion: "50% 50%" };
const foto = { url: "/f.webp", alt: "", width: 10, height: 10, posicion: "50% 50%" };

describe("botonesNavDeRespaldo", () => {
  it("los tres botones con las anclas de la portada y la máquina de cada sección", () => {
    const b = botonesNavDeRespaldo([m, null, m]);
    assert.deepEqual(
      b.map((x) => [x.ancla, x.imagen ? "foto" : "sin"]),
      [
        ["nueva", "foto"],
        ["maquinaria-usada", "sin"],
        ["repuestos", "foto"],
      ],
    );
    assert.equal(b[2]!.texto, "Repuestos para maquinaria pesada");
  });
});

describe("botonesNav", () => {
  it("vacío o sin campos: el respaldo", () => {
    assert.equal(botonesNav(null, [m, m, m]).length, 3);
    assert.equal(botonesNav([], [m, m, m])[0]!.texto, "Maquinaria pesada nueva");
  });

  it("los del panel, en su orden; sin foto, la máquina de su sección", () => {
    const b = botonesNav(
      [
        { texto: " Repuestos ", ancla: "repuestos", imagen: foto },
        { texto: "Usada", ancla: "maquinaria-usada", imagen: null },
      ],
      [null, m, null],
    );
    assert.deepEqual(
      b.map((x) => [x.texto, x.ancla, x.imagen?.url ?? null]),
      [
        ["Repuestos", "repuestos", "/f.webp"],
        ["Usada", "maquinaria-usada", "/m.webp"],
      ],
    );
  });

  it("descarta los botones sin texto, con un destino que no existe o repetido", () => {
    const b = botonesNav(
      [
        { texto: "", ancla: "nueva" },
        { texto: "Otro", ancla: "contacto" },
        { texto: "Nueva", ancla: "nueva" },
        { texto: "Nueva otra vez", ancla: "nueva" },
      ],
      [null, null, null],
    );
    assert.deepEqual(
      b.map((x) => x.texto),
      ["Nueva"],
    );
  });

  it("si ninguno vale, el respaldo entero", () => {
    assert.equal(botonesNav([{ texto: "X", ancla: "nada" }], [null, null, null]).length, 3);
  });
});
