import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MarcasMaquinaria, Media } from "@/payload-types";

import { tarjetasDeMarcas } from "./secciones";

const media = (id: number, alt = ""): Media =>
  ({ id, url: `/m/${id}.jpg`, alt, width: 800, height: 600 }) as Media;
/** Un logo transparente: uno en JPG no se puede pintar en blanco (`logoEnBlanco`). */
const png = (id: number): Media =>
  ({ id, url: `/m/${id}.png`, alt: "", width: 300, height: 90 }) as Media;

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

  it("foto de respaldo: la de la cabecera del kit; si no, la de la tarjeta; si no, ninguna", () => {
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
      r.map((t) => t.foto?.url ?? null),
      ["/m/20.jpg", "/m/11.jpg", null],
    );
    assert.equal(r[0]!.foto!.alt, "");
    assert.equal(r[0]!.maquina, null);
  });

  it("máquina de «Tarjeta en la portada», decorativa", () => {
    const [t] = tarjetasDeMarcas([marca({ portada: { maquina: media(30, "Excavadora") } })]);
    assert.equal(t!.maquina!.url, "/m/30.jpg");
    assert.equal(t!.maquina!.alt, "");
  });

  it("enlace a la marca; logo con el nombre como alt; sin baldosa ni color, panel blanco", () => {
    const [t] = tarjetasDeMarcas([marca({ logo: media(11, "logo viejo") })]);
    assert.equal(t!.logo!.alt, "Hitachi");
    assert.equal(t!.href, "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/");
    assert.equal(t!.externo, null);
    assert.equal(t!.panel.claro, true);
    assert.equal(t!.logo!.blanco, undefined);
  });

  it("con la baldosa de la marca de repuestos: su color y su logo tal cual", () => {
    const logoB = { url: "/b.webp", width: 300, height: 90, oscuro: false };
    const [t] = tarjetasDeMarcas(
      [marca({ nombre: "Hitachi LANDCROS", logo: media(11), colorMarca: "#000000" })],
      new Map(),
      new Map([["hitachilandcros", { color: "#f36c1b", logo: logoB }]]),
    );
    assert.equal(t!.panel.inicio, "#f36c1b");
    assert.equal(t!.panel.claro, false);
    assert.equal(t!.logo!.url, "/b.webp");
    assert.equal(t!.logo!.blanco, undefined);
  });

  it("sin baldosa, su color de marca con su logo en blanco; un panel claro lo es (Case)", () => {
    const [d] = tarjetasDeMarcas([
      marca({ nombre: "Dynapac", slug: "dynapac", logo: png(12), colorMarca: "#bf2e1a" }),
    ]);
    assert.equal(d!.panel.inicio, "#bf2e1a");
    assert.equal(d!.logo!.blanco, true);
    const logoB = { url: "/c.webp", width: 300, height: 90, oscuro: false };
    const [c] = tarjetasDeMarcas(
      [marca({ nombre: "Case Construction", slug: "case-construction" })],
      new Map(),
      new Map([["caseconstruction", { color: "#f3e7cc", logo: logoB }]]),
    );
    assert.equal(c!.panel.claro, true);
  });

  it("marca sin página propia: a su enlace externo, con el dominio y el distribuidor en blanco", () => {
    const logoB = { url: "/l.webp", width: 300, height: 60, oscuro: false };
    const [t] = tarjetasDeMarcas(
      [
        marca({
          nombre: "LiuGong",
          slug: "liugong",
          enlaceExterno: "https://www.maquitecno.co/",
          portada: { distribuidorNombre: " Maquitecno ", distribuidorLogo: png(40) },
        }),
      ],
      new Map(),
      new Map([["liugong", { color: "#002568", logo: logoB }]]),
    );
    assert.equal(t!.href, "https://www.maquitecno.co/");
    assert.deepEqual(t!.externo, { dominio: "maquitecno.co" });
    assert.equal(t!.distribuidor!.nombre, "Maquitecno");
    assert.equal(t!.distribuidor!.logo!.alt, "Maquitecno");
    assert.equal(t!.distribuidor!.logo!.blanco, true);
  });

  it("sin logo poblado la tarjeta sale igual, sin logo; sin slug no sale", () => {
    const r = tarjetasDeMarcas([marca({ logo: 11 }), marca({ id: 2, slug: "" })]);
    assert.equal(r.length, 1);
    assert.equal(r[0]!.logo, null);
  });
});
