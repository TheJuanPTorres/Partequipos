import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica, Media, Pagina } from "@/payload-types";

import { logosDeMarcas, tarjetasDeRepuestos } from "./seccionesE";

const media = (id: number, alt = ""): Media =>
  ({ id, url: `/m/${id}.png`, alt, width: 605, height: 404 }) as Media;

const cat = (over: Partial<CategoriasTecnica>): CategoriasTecnica =>
  ({ id: 1, nombre: "Filtración", slug: "filtracion", ...over }) as CategoriasTecnica;

describe("sección 4: logos", () => {
  it("en su orden, con el nombre como alt aunque la imagen traiga otro", () => {
    const r = logosDeMarcas({
      logos: [
        { id: "a", nombre: "Hitachi", logo: media(1, "Mesa de trabajo 1") },
        { id: "b", nombre: " CASE ", logo: media(2) },
      ],
    } as Pagina["seccionLogos"]);
    assert.deepEqual(
      r.map((l) => [l.nombre, l.logo.alt]),
      [
        ["Hitachi", "Hitachi"],
        ["CASE", "CASE"],
      ],
    );
  });

  it("sin imagen poblada o sin nombre, ese logo no sale", () => {
    const r = logosDeMarcas({
      logos: [
        { id: "a", nombre: "Hitachi", logo: 1 },
        { id: "b", nombre: "  ", logo: media(2) },
      ],
    } as Pagina["seccionLogos"]);
    assert.deepEqual(r, []);
  });

  it("sin sección, lista vacía", () => {
    assert.deepEqual(logosDeMarcas(undefined), []);
  });
});

describe("sección 5: tarjetas de repuestos", () => {
  it("solo las que tienen posición, en ese orden (y por nombre al empatar)", () => {
    const r = tarjetasDeRepuestos([
      cat({ id: 1, nombre: "Filtración", ordenPortada: 4 }),
      cat({ id: 2, nombre: "Tren de rodaje" }),
      cat({ id: 3, nombre: "Lubricantes", ordenPortada: 3 }),
      cat({ id: 4, nombre: "Llantas", ordenPortada: 2 }),
      cat({ id: 5, nombre: "Blades", ordenPortada: 1 }),
      cat({ id: 6, nombre: "Aceites", ordenPortada: 3 }),
    ]);
    assert.deepEqual(
      r.map((t) => t.titulo),
      ["Blades", "Llantas", "Aceites", "Lubricantes", "Filtración"],
    );
  });

  it("la imagen es decorativa y opcional: sin ella la tarjeta sale igual", () => {
    const [con, sin] = tarjetasDeRepuestos([
      cat({ id: 1, ordenPortada: 1, imagen: media(9, "foto") }),
      cat({ id: 2, ordenPortada: 2, imagen: 9 }),
    ]);
    assert.equal(con!.imagen!.alt, "");
    assert.equal(sin!.imagen, null);
  });

  it("texto, icono y enlace vacíos pasan a null", () => {
    const [t] = tarjetasDeRepuestos([cat({ ordenPortada: 1, descripcion: " ", enlace: "" })]);
    assert.equal(t!.texto, null);
    assert.equal(t!.icono, null);
    assert.equal(t!.href, null);
  });
});
