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

  it("enlace a la marca; logo con el nombre como alt; sin color de tarjeta, panel blanco", () => {
    const [t] = tarjetasDeMarcas([marca({ logo: media(11, "logo viejo") })]);
    assert.equal(t!.logo!.alt, "Hitachi");
    assert.equal(t!.href, "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/");
    assert.equal(t!.externo, null);
    assert.equal(t!.panel.claro, true);
    assert.equal(t!.logo!.blanco, undefined);
  });

  it("color de la tarjeta y su final; logo a color tal cual, sin la tinta oscura del menú", () => {
    const logoR = { url: "/r.webp", width: 300, height: 90, oscuro: true };
    const [t] = tarjetasDeMarcas(
      [
        marca({
          nombre: "Yanmar",
          slug: "yanmar",
          colorMarca: "#c8141f",
          portada: { colorPanel: "#FFFFFF", colorPanelFin: "#e9e9eb", logoVariante: "original" },
        }),
      ],
      new Map([["yanmar", logoR]]),
    );
    assert.deepEqual(t!.panel, { inicio: "#ffffff", fin: "#e9e9eb", claro: true });
    assert.equal(t!.logo!.url, "/r.webp");
    assert.equal(t!.logo!.oscuro, false);
    assert.equal(t!.logo!.blanco, undefined);
  });

  it("con «Logo de la tarjeta», ese logo tal cual, aunque pida el del sitio en blanco", () => {
    const [t] = tarjetasDeMarcas([
      marca({
        logo: png(12),
        portada: { logo: png(50), logoVariante: "blanco", colorPanel: "#c8141f" },
      }),
    ]);
    assert.equal(t!.logo!.url, "/m/50.png");
    assert.equal(t!.logo!.blanco, undefined);
    assert.equal(t!.logo!.alt, "Hitachi");
  });

  it("logo en blanco sobre un color oscuro; sin final, el degradado sale del color (Dynapac)", () => {
    const [d] = tarjetasDeMarcas([
      marca({
        nombre: "Dynapac",
        slug: "dynapac",
        logo: png(12),
        portada: { colorPanel: "#c8141f", logoVariante: "blanco" },
      }),
    ]);
    assert.equal(d!.panel.inicio, "#c8141f");
    assert.equal(d!.panel.claro, false);
    assert.notEqual(d!.panel.fin, "#c8141f");
    assert.equal(d!.logo!.blanco, true);
  });

  it("ya no usa el «Color de la marca» ni las baldosas: sin color de tarjeta, panel blanco", () => {
    const [c] = tarjetasDeMarcas([
      marca({ nombre: "Case Construction", slug: "case-construction", colorMarca: "#bf2e1a" }),
    ]);
    assert.equal(c!.panel.inicio, "#ffffff");
    assert.equal(c!.panel.claro, true);
    const [x] = tarjetasDeMarcas([marca({ portada: { colorPanel: "rojo" } })]);
    assert.equal(x!.panel.inicio, "#ffffff");
  });

  it("marca sin página propia: a su enlace externo; el distribuidor, a color sobre un panel claro y en blanco sobre uno oscuro", () => {
    const base = {
      nombre: "LiuGong",
      slug: "liugong",
      enlaceExterno: "https://www.maquitecno.co/",
    };
    const [t] = tarjetasDeMarcas([
      marca({
        ...base,
        portada: {
          distribuidorNombre: " Maquitecno ",
          distribuidorLogo: png(40),
          colorPanel: "#ffffff",
        },
      }),
    ]);
    assert.equal(t!.href, "https://www.maquitecno.co/");
    assert.deepEqual(t!.externo, { dominio: "maquitecno.co" });
    assert.equal(t!.distribuidor!.nombre, "Maquitecno");
    assert.equal(t!.distribuidor!.logo!.alt, "Maquitecno");
    assert.notEqual(t!.distribuidor!.logo!.blanco, true);
    const [o] = tarjetasDeMarcas([
      marca({
        ...base,
        portada: {
          distribuidorNombre: "Maquitecno",
          distribuidorLogo: png(40),
          colorPanel: "#002568",
        },
      }),
    ]);
    assert.equal(o!.distribuidor!.logo!.blanco, true);
  });

  it("sin logo poblado la tarjeta sale igual, sin logo; sin slug no sale", () => {
    const r = tarjetasDeMarcas([marca({ logo: 11 }), marca({ id: 2, slug: "" })]);
    assert.equal(r.length, 1);
    assert.equal(r[0]!.logo, null);
  });
});
