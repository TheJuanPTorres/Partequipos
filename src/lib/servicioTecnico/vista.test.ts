import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import type { VistaBloque } from "../bloques/vista";
import { parrafosDe, vistaServicioTecnico } from "./vista";

const t = (text: string, negrita = false) => ({ type: "text", text, format: negrita ? 1 : 0 });
const lexical = (...parrafos: object[][]) =>
  ({
    root: { type: "root", children: parrafos.map((c) => ({ type: "paragraph", children: c })) },
  }) as unknown as SerializedEditorState;

const BLOQUES = [
  { blockType: "cabeceraVideo", titulo: "Servicio técnico", video: null, imagen: null },
  {
    blockType: "presentacionImagen",
    ancla: "taller",
    antetitulo: "EN PARTEQUIPOS",
    titulo: "CONTAMOS CON UN EXCELENTE SERVICIO TÉCNICO",
    texto: lexical([t("Nuestro departamento…")], [t("Contamos con personal calificado.", true)]),
    imagen: null,
    animacion: null,
    boton: { texto: "Contáctanos", href: "/contactanos/" },
  },
  {
    blockType: "presentacionImagen",
    ancla: "Siniestros",
    titulo: "¿TUVISTE UN ACCIDENTE?",
    texto: lexical(
      [t("Te acompañamos y asesoramos.", true)],
      [t("VALORACIÓN: ", true), t("Determinamos la cuantía.")],
      [t("REPARACIÓN: ", true), t("Reparamos.")],
      [t("Trabajamos con las principales aseguradoras")],
    ),
    imagen: null,
    animacion: null,
    boton: null,
  },
  { blockType: "galeria", imagenes: [{ url: "/a.jpg", alt: "a", width: 4, height: 3 }] },
  { blockType: "formularioContacto", ancla: "contacto", titulo: "Solicita servicio técnico" },
] as unknown as VistaBloque[];

describe("servicio técnico con diseño propio", () => {
  it("separa el arranque en negrita de cada párrafo", () => {
    assert.deepEqual(parrafosDe(lexical([t("ETIQUETA: ", true), t("resto")]))[0], {
      negrita: "ETIQUETA:",
      texto: "resto",
    });
    assert.deepEqual(parrafosDe(null), []);
  });

  it("saca los pasos de siniestros de sus párrafos «ETIQUETA: texto», tal cual", () => {
    const v = vistaServicioTecnico(BLOQUES);
    assert.equal(v.siniestros?.intro, "Te acompañamos y asesoramos.");
    assert.deepEqual(v.siniestros?.pasos, [
      { numero: "01", etiqueta: "VALORACIÓN", texto: "Determinamos la cuantía." },
      { numero: "02", etiqueta: "REPARACIÓN", texto: "Reparamos." },
    ]);
    // Sin título en la galería, «Trabajamos con las principales aseguradoras» es su titular.
    assert.equal(v.siniestros?.aseguradoras, "Trabajamos con las principales aseguradoras");
    assert.deepEqual(v.siniestros?.cierre, []);
    assert.equal(v.siniestros?.galeria.length, 1);
  });

  it("la cabecera: el título, el antetítulo y el lema del taller; los accesos por ancla", () => {
    const v = vistaServicioTecnico(BLOQUES);
    assert.equal(v.hero.titulo, "Servicio técnico");
    assert.equal(v.hero.antetitulo, "EN PARTEQUIPOS");
    assert.equal(v.hero.lema, "Contamos con personal calificado.");
    assert.deepEqual(
      v.accesos.map((a) => [a.ancla, a.titulo]),
      [
        ["taller", "Taller"],
        ["Siniestros", "Siniestros"],
      ],
    );
    assert.deepEqual(v.taller?.parrafos, ["Nuestro departamento…"]);
    assert.equal(v.alistamiento, null);
    assert.equal(v.contacto?.botonTexto, "Enviar solicitud");
  });

  it("con el bloque «Proceso paso a paso» y el título y el texto de la galería", () => {
    const bloques = [
      ...BLOQUES.filter((b) => b.ancla !== "Siniestros" && b.blockType !== "galeria"),
      {
        blockType: "procesoPasos",
        ancla: "Siniestros",
        titulo: "¿TUVISTE UN ACCIDENTE?",
        entradilla: "Te acompañamos.",
        pasos: [
          { etiqueta: "VALORACIÓN", texto: "Determinamos la cuantía." },
          { etiqueta: "REPARACIÓN", texto: "Reparamos." },
        ],
        boton: null,
        textura: { url: "/t.png", alt: "", width: 10, height: 2 },
      },
      {
        blockType: "galeria",
        titulo: "Trabajamos con las principales aseguradoras.",
        texto: "Así llegan.",
        imagenes: [{ url: "/a.jpg", alt: "a", width: 4, height: 3 }],
      },
    ] as unknown as VistaBloque[];
    const v = vistaServicioTecnico(bloques);
    assert.equal(v.siniestros?.intro, "Te acompañamos.");
    assert.deepEqual(
      v.siniestros?.pasos.map((p) => [p.numero, p.etiqueta]),
      [
        ["01", "VALORACIÓN"],
        ["02", "REPARACIÓN"],
      ],
    );
    assert.equal(v.siniestros?.aseguradoras, "Trabajamos con las principales aseguradoras.");
    assert.equal(v.siniestros?.galeriaTexto, "Así llegan.");
    assert.equal(v.textura?.url, "/t.png");
  });
});
