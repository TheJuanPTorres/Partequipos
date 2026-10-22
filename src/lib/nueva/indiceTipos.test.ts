import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquipoNuevoListado, FotoDeTarjeta } from "../queries/getMaquinaria";
import { tarjetasDeTiposNueva, tarjetasIndiceNueva } from "./indiceTipos";

const foto = (id: number): FotoDeTarjeta => ({
  id,
  url: `https://ejemplo.test/foto-${id}.jpg`,
  alt: `Foto ${id}`,
  width: 800,
  height: 600,
  focalX: 50,
  focalY: 50,
});

function equipo(
  id: number,
  nombre: string,
  tipoId: number,
  marca: string,
  f: FotoDeTarjeta | null,
): EquipoNuevoListado {
  return {
    id,
    nombre,
    slug: `equipo-${id}`,
    href: `/x/${id}/`,
    tipoId,
    marcaRef: { slug: marca, nombre: marca },
    tipoRef: { slug: `tipo-${tipoId}`, nombre: `Tipo ${tipoId}` },
    foto: f,
    logo: null,
    logoOscuro: false,
    datos: { peso: null, potencia: null, motor: null },
    pdf: null,
  };
}

const equipos = [
  equipo(1, "Excavadora B", 10, "hitachi", foto(1)),
  equipo(2, "Excavadora A", 11, "case-construction", foto(2)),
  equipo(3, "Retro Z", 20, "case-construction", null),
  equipo(4, "Retro Y", 20, "case-construction", foto(4)),
  equipo(5, "Ahoyador", 30, "aditamentos", foto(5)),
];

const datos = {
  equipos,
  categorias: [
    { slug: "excavadoras", nombre: "Excavadoras", tipos: [10, 11] },
    { slug: "cargadores", nombre: "Cargadores", tipos: [99] }, // sin equipos: no sale
  ],
  pestanasTipos: [
    {
      id: 20,
      nombre: "Retrocargadoras",
      href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/",
      foto: null,
      tipos: [20],
    },
    {
      id: 40,
      nombre: "Bulldozers",
      href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/",
      foto: foto(40),
      tipos: [40],
    },
  ],
};

describe("tarjetasDeTiposNueva", () => {
  const tarjetas = tarjetasDeTiposNueva(datos);

  it("una por categoría con equipos y por tipo con pestaña, por orden alfabético, y «Aditamentos» al final", () => {
    assert.deepEqual(
      tarjetas.map((t) => t.titulo),
      ["Bulldozers", "Excavadoras", "Retrocargadoras", "Aditamentos"],
    );
  });

  it("la categoría de varias marcas lleva a su página transversal; el tipo de una marca, a su página", () => {
    const porTitulo = new Map(tarjetas.map((t) => [t.titulo, t.href]));
    assert.equal(
      porTitulo.get("Excavadoras"),
      "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras/",
    );
    assert.equal(
      porTitulo.get("Retrocargadoras"),
      "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/",
    );
    assert.equal(
      porTitulo.get("Aditamentos"),
      "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/",
    );
  });

  it("foto: la del tipo; si no, la del primer equipo CON foto por nombre", () => {
    const porTitulo = new Map(tarjetas.map((t) => [t.titulo, t.imagen?.url]));
    assert.equal(porTitulo.get("Bulldozers"), "https://ejemplo.test/foto-40.jpg");
    assert.equal(porTitulo.get("Excavadoras"), "https://ejemplo.test/foto-2.jpg"); // «Excavadora A»
    assert.equal(porTitulo.get("Retrocargadoras"), "https://ejemplo.test/foto-4.jpg"); // «Retro Y»
  });

  it("sin equipos de aditamentos, no hay tarjeta «Aditamentos»", () => {
    const sin = tarjetasDeTiposNueva({ ...datos, equipos: equipos.filter((e) => e.id !== 5) });
    assert.equal(sin.at(-1)?.titulo, "Retrocargadoras");
  });
});

describe("tarjetasIndiceNueva", () => {
  it("dos tarjetas: «Por marca» al índice de marcas y «Por tipo de máquina» al de tipos", () => {
    const [marca, tipo] = tarjetasIndiceNueva(null, tarjetasDeTiposNueva(datos));
    assert.equal(marca?.href, "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/");
    assert.equal(marca?.imagen, null);
    assert.equal(tipo?.href, "/maquinaria-pesada/maquinaria-pesada-nueva/tipos/");
    // La foto de la primera tarjeta de tipos que la tenga (Bulldozers).
    assert.equal(tipo?.imagen?.url, "https://ejemplo.test/foto-40.jpg");
  });
});
