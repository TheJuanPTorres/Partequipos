import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo, Media, TiposMaquinaria } from "@/payload-types";

import { seccionesAditamentos, usaDisenoAditamentos } from "./paginaAditamentos";

const foto = (id: number): Media =>
  ({
    id,
    url: `https://ejemplo.test/${id}.jpg`,
    alt: "Foto de ejemplo",
    width: 800,
    height: 600,
  }) as Media;
const tipo = (id: number, nombre: string): TiposMaquinaria =>
  ({ id, nombre, slug: nombre.toLowerCase(), marca: 1 }) as TiposMaquinaria;
const equipo = (id: number, tipoId: number, imagenes: (number | Media)[] = []): EquiposNuevo =>
  ({
    id,
    nombre: `PRODUCTO ${id}`,
    slug: `producto-${id}`,
    tipo: tipoId,
    imagenes,
  }) as unknown as EquiposNuevo;

const marca = { slug: "aditamentos" };

describe("página de marca de aditamentos", () => {
  it("un bloque por tipo con productos, en el orden de los tipos", () => {
    const s = seccionesAditamentos(
      marca,
      [tipo(1, "Excavadoras"), tipo(2, "Vacio"), tipo(3, "Minicargadores")],
      [equipo(30, 3), equipo(10, 1, [foto(7)])],
    );
    assert.deepEqual(
      s.map((x) => x.titulo),
      ["Aditamentos para Excavadoras", "Aditamentos para Minicargadores"],
    );
  });

  it("cada producto una vez, con su foto y «Ver todo» a SU ficha", () => {
    const s = seccionesAditamentos(
      marca,
      [tipo(1, "Excavadoras")],
      [equipo(10, 1, [5, foto(7)]), equipo(10, 1, [foto(7)])],
    )[0];
    assert.ok(s);
    assert.equal(s.tarjetas.length, 1);
    assert.equal(s.tarjetas[0]?.imagen?.url, "https://ejemplo.test/7.jpg");
    assert.equal(
      s.tarjetas[0]?.href,
      "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/excavadoras/producto-10/",
    );
  });

  it("sin foto, la tarjeta va sin imagen", () => {
    const s = seccionesAditamentos(marca, [tipo(1, "Excavadoras")], [equipo(10, 1)])[0];
    assert.ok(s);
    assert.equal(s.tarjetas[0]?.imagen, null);
  });

  it("la plantilla es solo para la marca de aditamentos", () => {
    assert.equal(usaDisenoAditamentos({ slug: "aditamentos" }), true);
    assert.equal(usaDisenoAditamentos({ slug: "otra-marca" }), false);
  });
});
