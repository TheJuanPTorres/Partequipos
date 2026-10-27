import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MarcasMaquinaria, Media } from "@/payload-types";

import { tarjetasDeMarcas } from "./secciones";

const media = (id: number, alt = ""): Media =>
  ({ id, url: `/m/${id}.jpg`, alt, width: 800, height: 600 }) as Media;

const marca = (over: Partial<MarcasMaquinaria>): MarcasMaquinaria =>
  ({ id: 1, nombre: "Hitachi", slug: "hitachi", ordenPortada: 1, ...over }) as MarcasMaquinaria;

describe("«Maquinaria pesada nueva»: tarjetas de marca", () => {
  it("todas las que llegan, por su posición en la portada; sin posición, al final por nombre", () => {
    const r = tarjetasDeMarcas([
      marca({ id: 3, nombre: "Yanmar", slug: "yanmar", ordenPortada: 3 }),
      marca({ id: 5, nombre: "Volvo", slug: "volvo", ordenPortada: null }),
      marca({ id: 1, nombre: "Hitachi LANDCROS" }),
      marca({ id: 4, nombre: "Dynapac", slug: "dynapac", ordenPortada: null }),
      marca({ id: 2, nombre: "Case Construction", slug: "case-construction", ordenPortada: 2 }),
    ]);
    assert.deepEqual(
      r.map((t) => t.nombre),
      ["Hitachi LANDCROS", "Case Construction", "Yanmar", "Dynapac", "Volvo"],
    );
  });

  it("foto: la de la cabecera del kit; si no, la de la tarjeta; si no, ninguna", () => {
    const r = tarjetasDeMarcas([
      marca({
        id: 1,
        imagenTarjeta: media(10),
        kit: { fotoCabecera: media(20, "algo") } as MarcasMaquinaria["kit"],
      }),
      marca({ id: 2, nombre: "Yanmar", slug: "yanmar", ordenPortada: 2, imagenTarjeta: media(11) }),
      marca({ id: 3, nombre: "Dynapac", slug: "dynapac", ordenPortada: 3 }),
    ]);
    assert.deepEqual(
      r.map((t) => t.fondo?.url ?? null),
      ["/m/20.jpg", "/m/11.jpg", null],
    );
    assert.equal(r[0]!.fondo!.alt, "");
  });

  it("presentación = la descripción; enlace a la marca; logo con el nombre como alt", () => {
    const [t] = tarjetasDeMarcas([
      marca({ descripcion: "  Excavadoras.  ", logo: media(11, "logo viejo") }),
    ]);
    assert.equal(t!.texto, "Excavadoras.");
    assert.equal(t!.logo!.alt, "Hitachi");
    assert.equal(t!.href, "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/");
  });

  it("sin logo poblado la tarjeta sale igual, sin logo; sin slug no sale", () => {
    const r = tarjetasDeMarcas([marca({ logo: 11 }), marca({ id: 2, slug: "" })]);
    assert.equal(r.length, 1);
    assert.equal(r[0]!.logo, null);
  });
});
