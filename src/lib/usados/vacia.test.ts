import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  alternativasEnNueva,
  mensajeSinUnidades,
  tituloEnNueva,
  usaEstadoVacioPropio,
  nombreComparable,
  type EquipoNuevoAlternativa,
} from "./vacia";

const rutas = {
  categoriaNueva: (s: string) => `/nueva/${s}`,
  tipoMaquinaria: (m: string, t: string) => `/nueva/marcas/${m}/${t}`,
};
const foto = { url: "/f.jpg", alt: "", width: 800, height: 600, focalX: 50, focalY: 50 };
const equipo = (
  tipoId: number,
  tipo: string,
  tipoSlug: string,
  marca: string,
  marcaSlug: string,
  conFoto = true,
): EquipoNuevoAlternativa => ({
  tipoId,
  tipoRef: { slug: tipoSlug, nombre: tipo },
  marcaRef: { slug: marcaSlug, nombre: marca },
  foto: conFoto ? foto : null,
});

describe("estado vacío de usados", () => {
  it("compara nombres sin tildes y en singular", () => {
    assert.equal(nombreComparable("Motoniveladoras"), "motoniveladora");
    assert.equal(nombreComparable("Cargadores"), "cargador");
    assert.equal(nombreComparable("Bulldozer"), nombreComparable("Bulldozers"));
    assert.equal(nombreComparable("Vibrocompactadores"), "vibrocompactador");
  });

  it("sin tipo del mismo nombre, la categoría de nueva con el mismo nombre, si tiene equipos", () => {
    const equipos = [equipo(1, "Frontales", "frontales", "Case Construction", "case-construction")];
    const t = alternativasEnNueva(
      "Cargadores",
      [{ slug: "cargadores", nombre: "Cargadores", tipos: [1] }],
      equipos,
      rutas,
    );
    assert.deepEqual(
      t.map((x) => [x.titulo, x.href, x.detalle ?? null, x.imagen?.url]),
      [["Cargadores nuevos", "/nueva/cargadores/", null, "/f.jpg"]],
    );
  });

  it("el tipo del mismo nombre va antes que la categoría: Cargadores Case Construction", () => {
    const aditamento = {
      ...equipo(5, "Minicargadores", "minicargadores", "Aditamentos", "aditamentos"),
      foto: { ...foto, url: "/ahoyador.jpg" },
    };
    const cargador = {
      ...equipo(1, "Cargadores", "cargadores", "Case Construction", "case-construction"),
      foto: { ...foto, url: "/w20f.jpg" },
    };
    const t = alternativasEnNueva(
      "Cargadores",
      [{ slug: "cargadores", nombre: "Cargadores", tipos: [5, 1] }],
      [aditamento, cargador],
      rutas,
    );
    assert.deepEqual(
      t.map((x) => [x.titulo, x.href, x.imagen?.url]),
      [
        [
          "Cargadores Case Construction",
          "/nueva/marcas/case-construction/cargadores/",
          "/w20f.jpg",
        ],
      ],
    );
  });

  it("sin categoría de nueva, los tipos con equipos que se llaman igual (las motoniveladoras de Case)", () => {
    const equipos = [
      equipo(
        7,
        "Motoniveladoras",
        "motoniveladoras-case",
        "Case Construction",
        "case-construction",
        false,
      ),
      equipo(
        7,
        "Motoniveladoras",
        "motoniveladoras-case",
        "Case Construction",
        "case-construction",
      ),
      equipo(2, "Excavadoras", "excavadoras", "Hitachi", "hitachi"),
    ];
    const t = alternativasEnNueva("Motoniveladoras", [], equipos, rutas);
    assert.deepEqual(
      t.map((x) => [x.titulo, x.href, x.detalle ?? null, x.imagen?.url]),
      [
        [
          "Motoniveladoras Case Construction",
          "/nueva/marcas/case-construction/motoniveladoras-case/",
          null,
          "/f.jpg",
        ],
      ],
    );
  });

  it("renombrar la categoría no rompe el emparejamiento: casa por su dirección web", () => {
    const equipos = [
      equipo(1, "Cargadores", "cargadores", "Case Construction", "case-construction"),
    ];
    // Sin la dirección web, «Cargadores Frontales» ya no se parece a «Cargadores».
    assert.deepEqual(alternativasEnNueva("Cargadores Frontales", [], equipos, rutas), []);
    const t = alternativasEnNueva("Cargadores Frontales", [], equipos, rutas, {
      slug: "cargadores",
    });
    assert.deepEqual(
      t.map((x) => [x.titulo, x.href]),
      [["Cargadores Case Construction", "/nueva/marcas/case-construction/cargadores/"]],
    );
  });

  it("sin nada parecido en nueva, ninguna alternativa", () => {
    assert.deepEqual(alternativasEnNueva("Grúas", [], [], rutas), []);
    // Una categoría de nueva sin equipos tampoco cuenta.
    assert.deepEqual(
      alternativasEnNueva(
        "Cargadores",
        [{ slug: "cargadores", nombre: "Cargadores", tipos: [9] }],
        [],
        rutas,
      ),
      [],
    );
  });

  it("el titular", () => {
    assert.equal(
      mensajeSinUnidades("categoria", "Cargadores usados", "Cargadores"),
      "Ahora mismo no tenemos cargadores usados disponibles",
    );
    assert.equal(
      mensajeSinUnidades("categoria", "Cargadores Frontales usados", "Cargadores Frontales"),
      "Ahora mismo no tenemos cargadores frontales usados disponibles",
    );
    assert.equal(
      mensajeSinUnidades("marca", "Maquinaria Doosan usada", "Doosan"),
      "Ahora mismo no tenemos maquinaria Doosan usada disponible",
    );
  });
});

describe("usaEstadoVacioPropio (dirección, 2026-10-19: solo diseños de Andrés)", () => {
  it("solo con «propio» se pinta el estado vacío diseñado", () => {
    assert.equal(usaEstadoVacioPropio({ estadoVacio: "propio" }), true);
  });

  it("por defecto, sin valor o con otro, el aviso provisional", () => {
    assert.equal(usaEstadoVacioPropio({ estadoVacio: "provisional" }), false);
    assert.equal(usaEstadoVacioPropio({ estadoVacio: null }), false);
    assert.equal(usaEstadoVacioPropio({}), false);
    assert.equal(usaEstadoVacioPropio(undefined), false);
    assert.equal(usaEstadoVacioPropio({ estadoVacio: "Propio" }), false);
  });
});

describe("tituloEnNueva", () => {
  it("lleva la categoría que se buscó, en minúscula dentro de la frase", () => {
    assert.equal(
      tituloEnNueva("Cargadores Frontales"),
      "Te invitamos a conocer nuestra disponibilidad de cargadores frontales",
    );
    assert.equal(
      tituloEnNueva("Motoniveladoras"),
      "Te invitamos a conocer nuestra disponibilidad de motoniveladoras",
    );
  });
});
