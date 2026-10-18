import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import {
  enlacesDeEquipos,
  fotoDeCabecera,
  gruposDeEnlaces,
  tituloFranja,
  vistaEncabezadoTipoNueva,
} from "./paginaTipo";

const marca = { id: 1, nombre: "Hitachi", slug: "hitachi" } as MarcasMaquinaria;
const tipo = (extra: Partial<TiposMaquinaria> = {}) =>
  ({ id: 5, nombre: "Excavadoras", slug: "excavadoras", ...extra }) as TiposMaquinaria;
const media = (id: number) => ({ id, url: `/f${id}.jpg`, width: 800, height: 600, alt: "x" });
const equipo = (id: number, extra: Partial<EquiposNuevo> = {}) =>
  ({ id, nombre: `Equipo ${id}`, slug: `equipo-${id}`, ...extra }) as EquiposNuevo;

describe("enlacesDeEquipos", () => {
  it("un enlace por equipo, a su ficha, y sin los que no tienen nombre o slug", () => {
    const r = enlacesDeEquipos(marca, "excavadoras", [
      equipo(1),
      equipo(2, { nombre: " " }),
      equipo(3, { slug: "" }),
    ]);
    assert.deepEqual(
      r.map((e) => [e.id, e.href]),
      [[1, "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras/equipo-1/"]],
    );
  });

  it("el código solo acompaña al nombre si este no lo lleva ya", () => {
    const r = enlacesDeEquipos(marca, "excavadoras", [
      equipo(1, { nombre: "ZX120", codigo: "ZX120" }),
      equipo(2, { nombre: "Excavadora", codigo: "ZX350" }),
    ]);
    assert.deepEqual(
      r.map((e) => e.codigo),
      [null, "ZX350"],
    );
  });
});

describe("gruposDeEnlaces (paraguas)", () => {
  it("un grupo por subtipo, con la ficha colgando del subtipo, y sin grupos vacíos", () => {
    const sub = tipo({ id: 6, nombre: "Compactadores de suelo", slug: "compactador-suelo" });
    const vacio = tipo({ id: 7, nombre: "Vacío", slug: "vacio" });
    const r = gruposDeEnlaces(marca, [
      { tipo: sub, equipos: [equipo(1)] },
      { tipo: vacio, equipos: [] },
    ]);
    assert.equal(r.length, 1);
    assert.equal(r[0]?.titulo, "Compactadores de suelo");
    assert.equal(r[0]?.ancla, "subtipo-compactador-suelo");
    assert.match(r[0]?.modelos[0]?.href ?? "", /\/hitachi\/compactador-suelo\/equipo-1\/$/);
  });
});

describe("fotoDeCabecera", () => {
  it("la imagen de la tarjeta del tipo manda sobre la del equipo", () => {
    const f = fotoDeCabecera(tipo({ imagen: media(9) as never }), [
      equipo(1, { imagenes: [media(1) as never] }),
    ]);
    assert.equal(f?.url, "/f9.jpg");
  });

  it("sin imagen del tipo, la primera foto del primer equipo que la tenga", () => {
    const f = fotoDeCabecera(tipo(), [
      equipo(1),
      equipo(2, { imagenes: [media(2) as never] }),
      equipo(3, { imagenes: [media(3) as never] }),
    ]);
    assert.equal(f?.url, "/f2.jpg");
  });

  it("sin ninguna foto, null (cabecera oscura y baja)", () => {
    assert.equal(fotoDeCabecera(tipo(), [equipo(1)]), null);
    assert.equal(vistaEncabezadoTipoNueva(marca, tipo(), []).fondo, null);
  });
});

describe("títulos", () => {
  it("encabezado y franja con la marca, sin repetirla si el tipo ya la lleva", () => {
    assert.equal(vistaEncabezadoTipoNueva(marca, tipo(), []).linea1, "Excavadoras Hitachi");
    assert.equal(tituloFranja(marca, tipo()), "Modelos de excavadoras Hitachi");
    assert.equal(
      tituloFranja(marca, tipo({ nombre: "Excavadoras Hitachi" })),
      "Modelos de excavadoras Hitachi",
    );
    const case_ = { ...marca, nombre: "Case Construction" } as MarcasMaquinaria;
    assert.equal(tituloFranja(case_, tipo()), "Modelos de excavadoras Case Construction");
  });
});
