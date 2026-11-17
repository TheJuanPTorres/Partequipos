import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { conSustitucion, rutaLegible, rutasDeImagen, valorEn, type CampoRef } from "./referencias";

const CAMPOS: CampoRef[] = [
  { type: "upload", name: "foto", relationTo: "media" },
  { type: "number", name: "orden" },
  { type: "upload", name: "galeria", relationTo: "media", hasMany: true },
  { type: "relationship", name: "marca", relationTo: "marcas" },
  {
    type: "array",
    name: "grupos",
    fields: [
      { type: "text", name: "nombre" },
      { type: "upload", name: "imagen", relationTo: "media" },
    ],
  },
  {
    type: "blocks",
    name: "bloques",
    blocks: [
      {
        slug: "galeria",
        fields: [
          {
            type: "array",
            name: "imagenes",
            fields: [{ type: "upload", name: "imagen", relationTo: "media" }],
          },
        ],
      },
      { slug: "texto", fields: [{ type: "richText", name: "cuerpo" }] },
    ],
  },
  { type: "group", name: "kit", fields: [{ type: "upload", name: "fondo", relationTo: "media" }] },
  {
    type: "tabs",
    tabs: [
      { name: "seo", fields: [{ type: "upload", name: "imagen", relationTo: "media" }] },
      { fields: [{ type: "upload", name: "suelta", relationTo: "media" }] },
    ],
  },
  { type: "row", fields: [{ type: "upload", name: "enFila", relationTo: "media" }] },
  { type: "relationship", name: "poli", relationTo: ["media", "videos"] },
  { type: "richText", name: "texto" },
];

const DATOS = {
  foto: 7,
  orden: 7, // un número igual al id en otro campo: no se toca
  galeria: [3, { id: 7 }, 9],
  marca: 7, // relación a otra colección: no se toca
  grupos: [
    { id: "a", nombre: "uno", imagen: 1 },
    { id: "b", nombre: "dos", imagen: 7 },
  ],
  bloques: [
    { id: "x", blockType: "galeria", imagenes: [{ id: "i1", imagen: 7 }] },
    {
      id: "y",
      blockType: "texto",
      cuerpo: { root: { children: [{ type: "upload", relationTo: "media", value: 7 }] } },
    },
  ],
  kit: { fondo: 7 },
  seo: { imagen: 7 },
  suelta: 7,
  enFila: 7,
  poli: { relationTo: "media", value: 7 },
  texto: {
    root: {
      children: [
        { type: "upload", relationTo: "media", value: { id: 7 } },
        { type: "upload", relationTo: "videos", value: 7 },
      ],
    },
  },
};

describe("rutasDeImagen", () => {
  it("encuentra la imagen en cada tipo de campo, y solo ahí", () => {
    const rutas = rutasDeImagen(CAMPOS, DATOS, 7).map(rutaLegible).sort();
    assert.deepEqual(
      rutas,
      [
        "bloques[0].imagenes[0].imagen",
        "bloques[1].cuerpo.root.children[0].value",
        "enFila",
        "foto",
        "galeria[1]",
        "grupos[1].imagen",
        "kit.fondo",
        "poli.value",
        "seo.imagen",
        "suelta",
        "texto.root.children[0].value",
      ].sort(),
    );
  });

  it("sin la imagen, ninguna ruta", () => {
    assert.deepEqual(rutasDeImagen(CAMPOS, DATOS, 999), []);
  });
});

describe("conSustitucion", () => {
  it("cambia solo esas rutas y devuelve solo los campos de primer nivel tocados", () => {
    const rutas = rutasDeImagen(CAMPOS, DATOS, 7);
    const cambios = conSustitucion(DATOS, rutas, 70);
    assert.deepEqual(Object.keys(cambios).sort(), [
      "bloques",
      "enFila",
      "foto",
      "galeria",
      "grupos",
      "kit",
      "poli",
      "seo",
      "suelta",
      "texto",
    ]);
    assert.equal(cambios.foto, 70);
    assert.deepEqual(cambios.galeria, [3, 70, 9]);
    assert.equal(valorEn(cambios, ["grupos", 0, "imagen"]), 1);
    assert.equal(valorEn(cambios, ["grupos", 1, "imagen"]), 70);
    assert.equal(valorEn(cambios, ["grupos", 1, "id"]), "b");
    assert.equal(valorEn(cambios, ["texto", "root", "children", 1, "value"]), 7);
    assert.equal(DATOS.foto, 7, "el original no cambia");
    // Y de vuelta: la retirada exacta con las mismas rutas.
    const devuelto = { ...DATOS, ...cambios };
    assert.deepEqual(rutasDeImagen(CAMPOS, devuelto, 7), []);
    const vuelta = conSustitucion(devuelto, rutas, 7);
    assert.equal(vuelta.foto, 7);
    assert.deepEqual(vuelta.galeria, [3, 7, 9]);
  });
});
