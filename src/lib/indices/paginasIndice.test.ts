import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PaginasIndice } from "@/payload-types";

import {
  canalesDeContacto,
  enlaceTelefono,
  tarjetasDeIndice,
  vistaEncabezadoDeIndice,
} from "./paginasIndice";

const grupo = {
  antetitulo: " Somos tu socio ",
  titulo: " Repuestos para Maquinaria pesada ",
  texto: " Presentación. ",
  tarjetas: [
    { id: "a", titulo: "Marcas", enlace: "/marcas/" },
    { id: "b", titulo: "Sin enlace", enlace: " " },
    { id: "c", titulo: " ", enlace: "/x/" },
    { id: "d", titulo: "Lubricantes", enlace: "/lubricantes/" },
  ],
} as NonNullable<PaginasIndice["repuestos"]>;

describe("vistaEncabezadoDeIndice", () => {
  it("toma antetítulo, título y párrafo del grupo, sin segunda línea ni logo", () => {
    const v = vistaEncabezadoDeIndice(grupo, "Respaldo", null);
    assert.equal(v.antetitulo, "Somos tu socio");
    assert.equal(v.linea1, "Repuestos para Maquinaria pesada");
    assert.equal(v.linea2, "");
    assert.equal(v.descripcion, "Presentación.");
    assert.equal(v.logo, null);
    assert.equal(v.fondo, null);
  });

  it("sin grupo el título no queda vacío (una página sin h1 sería peor)", () => {
    const v = vistaEncabezadoDeIndice(null, "Respaldo", null);
    assert.equal(v.linea1, "Respaldo");
    // Sin antetítulo propio, el de la «Plantilla 1» de Andrés.
    assert.equal(v.antetitulo, "Somos tu socio confiable en maquinaria pesada y repuestos");
  });
});

describe("tarjetasDeIndice", () => {
  it("descarta las tarjetas sin título o sin enlace y conserva el orden", () => {
    const t = tarjetasDeIndice(grupo);
    assert.deepEqual(
      t.map((x) => x.titulo),
      ["Marcas", "Lubricantes"],
    );
    assert.equal(t[0]?.href, "/marcas/");
  });

  it("ninguna se oculta en móvil", () => {
    assert.ok(tarjetasDeIndice(grupo).every((t) => t.soloEscritorio === false));
  });

  it("como mucho seis", () => {
    const muchas = {
      tarjetas: Array.from({ length: 9 }, (_, i) => ({
        id: String(i),
        titulo: `T${i}`,
        enlace: "/x/",
      })),
    } as NonNullable<PaginasIndice["maquinaria"]>;
    assert.equal(tarjetasDeIndice(muchas).length, 6);
  });

  it("sin grupo no hay tarjetas", () => {
    assert.deepEqual(tarjetasDeIndice(undefined), []);
  });
});

describe("canalesDeContacto", () => {
  const empresa = {
    telefono: "+57 317 670 7071",
    correo: "info@ejemplo.com",
    direccion: "Carrera 1 # 2-3",
    ciudad: "Bogotá D.C.",
  };

  it("usa los datos de la empresa: teléfono con enlace tel:, correo con mailto: y dirección con ciudad", () => {
    const c = canalesDeContacto(null, empresa);
    assert.deepEqual(
      c.map((x) => x.clave),
      ["telefono", "correo", "direccion"],
    );
    assert.equal(c[0]?.href, "tel:+573176707071");
    assert.equal(c[1]?.href, "mailto:info@ejemplo.com");
    assert.equal(c[2]?.valor, "Carrera 1 # 2-3 Bogotá D.C.");
    assert.equal(c[2]?.href, null);
  });

  it("un dato vacío no sale", () => {
    const c = canalesDeContacto(null, { ...empresa, correo: " " });
    assert.deepEqual(
      c.map((x) => x.clave),
      ["telefono", "direccion"],
    );
  });

  it("las etiquetas son las del global, con respaldo", () => {
    const c = canalesDeContacto(
      { etiquetaTelefono: "Llama" } as PaginasIndice["contacto"],
      empresa,
    );
    assert.equal(c[0]?.etiqueta, "Llama");
    assert.equal(c[1]?.etiqueta, "Email");
  });
});

describe("enlaceTelefono", () => {
  it("quita espacios y signos, conserva el +", () => {
    assert.equal(enlaceTelefono("+57 (317) 670-7071"), "tel:+573176707071");
  });
  it("sin dígitos suficientes, null", () => {
    assert.equal(enlaceTelefono("n/d"), null);
  });
});
