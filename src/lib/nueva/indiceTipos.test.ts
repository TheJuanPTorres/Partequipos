import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquipoNuevoListado, FotoDeTarjeta } from "../queries/getMaquinaria";
import { tarjetasDeTiposNueva } from "./indiceTipos";

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

  it("una por categoría con equipos y por tipo con pestaña, por orden alfabético", () => {
    assert.deepEqual(
      tarjetas.map((t) => t.titulo),
      ["Bulldozers", "Excavadoras", "Retrocargadoras"],
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
  });

  it("foto: la del tipo; si no, la del primer equipo CON foto por nombre", () => {
    const porTitulo = new Map(tarjetas.map((t) => [t.titulo, t.imagen?.url]));
    assert.equal(porTitulo.get("Bulldozers"), "https://ejemplo.test/foto-40.jpg");
    assert.equal(porTitulo.get("Excavadoras"), "https://ejemplo.test/foto-2.jpg"); // «Excavadora A»
    assert.equal(porTitulo.get("Retrocargadoras"), "https://ejemplo.test/foto-4.jpg"); // «Retro Y»
  });

  it("la «Imagen de la tarjeta» de la categoría gana a la de sus equipos (2026-10-23)", () => {
    const con = tarjetasDeTiposNueva({
      ...datos,
      categorias: datos.categorias.map((c) =>
        c.slug === "excavadoras" ? { ...c, foto: foto(77) } : c,
      ),
    });
    const excavadoras = con.find((t) => t.titulo === "Excavadoras");
    assert.equal(excavadoras?.imagen?.url, "https://ejemplo.test/foto-77.jpg");
  });

  it("solo maquinaria: con equipos de aditamentos, ninguna tarjeta lleva a ellos (2026-10-23)", () => {
    assert.ok(equipos.some((e) => e.marcaRef?.slug === "aditamentos"));
    assert.ok(!tarjetas.some((t) => /aditamento/i.test(`${t.titulo} ${t.href}`)));
  });
});
