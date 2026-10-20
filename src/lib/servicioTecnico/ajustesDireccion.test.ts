import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ajustar,
  CAMBIOS,
  DESCRIPCION_YOUTUBE_ALISTAMIENTO,
  type Bloque,
} from "./ajustesDireccion";

const parrafo = (texto: string, format = 0) => ({
  type: "paragraph",
  children: [{ type: "text", text: texto, format }],
});
const FRASE =
  "Contamos con personal calificado y altamente capacitado, junto con herramientas especializadas para esta labor.";

const pagina = (): Bloque[] => [
  {
    blockType: "presentacionImagen",
    ancla: "taller",
    antetitulo: "EN PARTEQUIPOS",
    titulo: "CONTAMOS CON UN EXCELENTE SERVICIO TÉCNICO",
    texto: { root: { children: [parrafo("Nuestro departamento…"), parrafo(FRASE)] } },
  },
  { blockType: "videoYoutube", ancla: "alistamiento", titulo: "ALISTAMIENTO DE MAQUINARIA" },
  {
    blockType: "presentacionImagen",
    ancla: "posventa",
    titulo: "CONTAMOS CON TÉCNICOS ALTAMENTE ESPECIALIZADOS Y CALIFICADOS.",
  },
  {
    blockType: "procesoPasos",
    ancla: "Siniestros",
    titulo: "¿TUVISTE UN ACCIDENTE CON TU MAQUINARIA AMARILLA?",
    pasos: [{ etiqueta: "VALORACIÓN" }, { etiqueta: "REPARACIÓN" }, { etiqueta: "REPUESTOS" }],
  },
];

describe("ajustes de dirección de servicio técnico", () => {
  it("aplica los 9 cambios sobre los datos de WordPress", () => {
    const r = ajustar(pagina(), CAMBIOS, "aplicar");
    assert.equal(r.aplicados.length, 9);
    assert.equal(r.saltados.length, 0);
    const [taller, alist, posventa, siniestros] = r.bloques;
    assert.equal(
      `${taller!.antetitulo} ${taller!.titulo}`,
      "En Partequipos contamos con un excelente servicio técnico",
    );
    const frase = (taller!.texto as { root: { children: { children: { format: number }[] }[] } })
      .root.children[1]!;
    assert.equal(frase.children[0]!.format & 1, 1);
    assert.equal(alist!.descripcionYoutube, DESCRIPCION_YOUTUBE_ALISTAMIENTO);
    assert.equal(posventa!.titulo, "Contamos con técnicos altamente especializados y calificados.");
    assert.deepEqual(
      (siniestros!.pasos as { etiqueta: string }[]).map((p) => p.etiqueta),
      ["Valoración", "Reparación", "Repuestos"],
    );
  });

  it("la segunda pasada no cambia nada", () => {
    const una = ajustar(pagina(), CAMBIOS, "aplicar").bloques;
    const r = ajustar(una, CAMBIOS, "aplicar");
    assert.equal(r.aplicados.length, 0);
    assert.equal(r.yaEstaban.length, 9);
    assert.deepEqual(r.bloques, una);
  });

  it("no pisa lo editado en el panel", () => {
    const b = pagina();
    b[2]!.titulo = "Un título propio del editor";
    const r = ajustar(b, CAMBIOS, "aplicar");
    assert.equal(r.saltados.length, 1);
    assert.equal(r.bloques[2]!.titulo, "Un título propio del editor");
  });

  it("la retirada devuelve exactamente lo de antes", () => {
    const original = pagina();
    const hecho = ajustar(original, CAMBIOS, "aplicar").bloques;
    const r = ajustar(hecho, CAMBIOS, "retirar");
    assert.equal(r.aplicados.length, 9);
    assert.deepEqual(
      r.bloques,
      original.map((b) => (b.ancla === "alistamiento" ? { ...b, descripcionYoutube: null } : b)),
    );
  });
});
