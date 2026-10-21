import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  alternativasEnNueva,
  mensajeSinUnidades,
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

  it("la categoría de nueva con el mismo nombre, si tiene equipos", () => {
    const equipos = [
      equipo(1, "Cargadores", "cargadores", "Case Construction", "case-construction"),
    ];
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

  it("la foto de la categoría, mejor de un equipo de su mismo tipo (no del aditamento)", () => {
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
    assert.equal(t[0]?.imagen?.url, "/w20f.jpg");
    assert.equal(t[0]?.detalle, undefined);
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
