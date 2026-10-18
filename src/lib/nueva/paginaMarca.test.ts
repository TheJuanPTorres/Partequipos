import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo, MarcasMaquinaria, Media, TiposMaquinaria } from "@/payload-types";

import {
  equiposPorTipo,
  primeraFotoPorTipo,
  tarjetasDeTiposNueva,
  vistaEncabezadoMarcaNueva,
} from "./paginaMarca";

const foto = (id: number, url = `https://ejemplo.test/${id}.jpg`): Media =>
  ({ id, url, alt: "Foto de ejemplo", width: 800, height: 600 }) as Media;

const marca = (extra: Partial<MarcasMaquinaria> = {}): MarcasMaquinaria =>
  ({ id: 1, nombre: "Marca Ejemplo", slug: "marca-ejemplo", ...extra }) as MarcasMaquinaria;

const tipo = (id: number, extra: Partial<TiposMaquinaria> = {}): TiposMaquinaria =>
  ({ id, nombre: `Tipo ${id}`, slug: `tipo-${id}`, marca: 1, ...extra }) as TiposMaquinaria;

const equipo = (tipoId: number, imagenes: (number | Media)[]): EquiposNuevo =>
  ({ id: tipoId * 10, tipo: tipoId, imagenes }) as unknown as EquiposNuevo;

describe("página de marca de maquinaria nueva", () => {
  it("cabecera: el h1 de siempre, la descripción y la foto de tarjeta de la marca", () => {
    const v = vistaEncabezadoMarcaNueva(
      marca({ descripcion: " Texto de ejemplo ", imagenTarjeta: foto(5) }),
    );
    assert.equal(v.linea1, "Maquinaria pesada Marca Ejemplo");
    assert.equal(v.descripcion, "Texto de ejemplo");
    assert.equal(v.fondo?.url, "https://ejemplo.test/5.jpg");
    assert.equal(v.logo, null);
  });

  it("cabecera sin foto: fondo nulo (el tono oscuro de los índices)", () => {
    assert.equal(vistaEncabezadoMarcaNueva(marca()).fondo, null);
  });

  it("la primera foto del primer equipo CON foto de cada tipo", () => {
    const fotos = primeraFotoPorTipo([
      equipo(1, []),
      equipo(1, [7, foto(2), foto(3)]),
      equipo(1, [foto(4)]),
      equipo(2, [foto(6)]),
    ]);
    // Un id sin poblar no sirve (sin URL); se toma la siguiente.
    assert.equal(fotos.get(1)?.url, "https://ejemplo.test/2.jpg");
    assert.equal(fotos.get(2)?.url, "https://ejemplo.test/6.jpg");
  });

  it("la imagen del tipo manda; si no, la del equipo; si no, sin foto", () => {
    const fotos = primeraFotoPorTipo([equipo(1, [foto(2)]), equipo(2, [foto(6)])]);
    const t = tarjetasDeTiposNueva(
      marca(),
      [tipo(1, { imagen: foto(9) }), tipo(2), tipo(3)],
      fotos,
      new Map([
        [1, 1],
        [2, 1],
        [3, 2],
      ]),
    );
    assert.deepEqual(
      t.map((x) => x.imagen?.url ?? null),
      ["https://ejemplo.test/9.jpg", "https://ejemplo.test/6.jpg", null],
    );
    assert.equal(
      t[0]!.href,
      "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/marca-ejemplo/tipo-1/",
    );
    assert.ok(t.every((x) => !x.soloEscritorio));
  });

  it("los tipos sin equipos (vacíos o que solo agrupan otros) no se pintan", () => {
    const equipos = [equipo(1, []), equipo(1, []), equipo(3, [])];
    const cuenta = equiposPorTipo(equipos);
    assert.equal(cuenta.get(1), 2);
    assert.equal(cuenta.get(2), undefined);
    const t = tarjetasDeTiposNueva(marca(), [tipo(1), tipo(2), tipo(3)], new Map(), cuenta);
    assert.deepEqual(
      t.map((x) => x.titulo),
      ["Tipo 1", "Tipo 3"],
    );
  });
});
