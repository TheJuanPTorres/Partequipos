import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MarcasMaquinaria, Media } from "@/payload-types";

import { tarjetasDeMarcas } from "./secciones";

const media = (id: number, alt = ""): Media =>
  ({ id, url: `/m/${id}.jpg`, alt, width: 800, height: 600 }) as Media;

const marca = (over: Partial<MarcasMaquinaria>): MarcasMaquinaria =>
  ({ id: 1, nombre: "Hitachi", slug: "hitachi", ordenPortada: 1, ...over }) as MarcasMaquinaria;

describe("sección 2: tarjetas de marca", () => {
  it("en el orden de su posición en la portada; sin posición no salen (Dynapac, LiuGong)", () => {
    const r = tarjetasDeMarcas([
      marca({ id: 3, nombre: "Yanmar", slug: "yanmar", ordenPortada: 3, imagenTarjeta: media(12) }),
      marca({ id: 1, imagenTarjeta: media(10) }),
      marca({
        id: 2,
        nombre: "CASE",
        slug: "case-construction",
        ordenPortada: 2,
        imagenTarjeta: media(11),
      }),
      marca({
        id: 4,
        nombre: "Dynapac",
        slug: "dynapac",
        ordenPortada: null,
        imagenTarjeta: media(13),
      }),
    ]);
    assert.deepEqual(
      r.map((t) => t.nombre),
      ["Hitachi", "CASE", "Yanmar"],
    );
  });

  it("solo las marcas con foto de tarjeta; el resto no sale", () => {
    const r = tarjetasDeMarcas([
      marca({ id: 1, imagenTarjeta: media(10) }),
      marca({ id: 2, nombre: "Aditamentos", slug: "aditamentos" }),
    ]);
    assert.deepEqual(
      r.map((t) => t.id),
      [1],
    );
  });

  it("fondo decorativo (alt vacío) y logo con el nombre de la marca como alt", () => {
    const [t] = tarjetasDeMarcas([
      marca({ imagenTarjeta: media(10, "algo"), logo: media(11, "logo viejo") }),
    ]);
    assert.equal(t!.fondo.alt, "");
    assert.equal(t!.logo!.alt, "Hitachi");
    assert.equal(t!.href, "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/");
  });

  it("sin logo poblado la tarjeta sale igual, sin logo", () => {
    const [t] = tarjetasDeMarcas([marca({ imagenTarjeta: media(10), logo: 11 })]);
    assert.equal(t!.logo, null);
  });
});
