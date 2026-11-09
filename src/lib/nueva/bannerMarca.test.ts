import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Media } from "@/payload-types";

import { contraste, luminancia, rgbDeHex } from "../portada/contraste";

import { bannerConLogo, logoOpaco, mezclar, vistaBanner, vistaBannerDe } from "./bannerMarca";
import { fondoDePastilla } from "./logoSobreColor";

const media = (url: string) => ({ id: 1, url, alt: "x", width: 800, height: 400 }) as Media;

describe("banner de marca de la página general de tipo", () => {
  it("mezcla en sRGB", () => {
    assert.equal(mezclar("#000000", "#ffffff", 0.5), "#808080");
    assert.equal(mezclar("#ff0000", "#ffffff", 1), "#ff0000");
    assert.equal(mezclar("#ff0000", "#0000ff", 0), "#0000ff");
  });

  it("sin color, el naranja de la barra de marcas", () => {
    const v = vistaBanner({ colorMarca: null, kit: undefined, imagenTarjeta: null });
    assert.equal(v.acento, "#fc661c");
    assert.equal(v.foto, null);
  });

  it("el título se lee sobre el fondo claro y el logo toma su tinta por contraste", () => {
    const oscura = vistaBanner({ colorMarca: "#1a1a1a", kit: undefined, imagenTarjeta: null });
    assert.equal(oscura.tintaLogo, "clara");
    const clara = vistaBanner({ colorMarca: "#ffd400", kit: undefined, imagenTarjeta: null });
    assert.equal(clara.tintaLogo, "oscura");
    assert.equal(clara.tintaTitulo, "#000000");
  });

  it("la foto: la de la cabecera del kit; sin ella, la de la tarjeta", () => {
    const kit = vistaBanner({
      colorMarca: "#e30613",
      kit: { fotoCabecera: media("/kit.jpg") },
      imagenTarjeta: media("/tarjeta.jpg"),
    });
    assert.equal(kit.foto?.url, "/kit.jpg");
    const tarjeta = vistaBanner({
      colorMarca: "#e30613",
      kit: { fotoCabecera: null },
      imagenTarjeta: media("/tarjeta.jpg"),
    });
    assert.equal(tarjeta.foto?.url, "/tarjeta.jpg");
  });

  it("con color y foto ya elegidos (acceso de Filtración), el mismo resultado", () => {
    const foto = { url: "/fondo.jpg", alt: "", width: 800, height: 400, posicion: "50% 50%" };
    const v = vistaBannerDe("#0055a5", foto);
    assert.deepEqual(
      { ...v, foto: null },
      {
        ...vistaBanner({ colorMarca: "#0055a5", kit: undefined, imagenTarjeta: null }),
        foto: null,
      },
    );
    assert.equal(v.foto, foto);
    assert.equal(vistaBannerDe(null, null).acento, "#fc661c");
  });

  it("un logo JPEG es opaco (placa blanca); PNG, WebP y SVG se tiñen", () => {
    assert.equal(logoOpaco("https://x/logo-dynapac.jpg"), true);
    assert.equal(logoOpaco("/api/media/file/logo.JPEG?v=1"), true);
    assert.equal(logoOpaco("https://x/logo-case.png"), false);
    assert.equal(logoOpaco("https://x/logo.webp"), false);
    assert.equal(logoOpaco("https://x/jpg-logo.svg"), false);
  });
});

describe("bannerConLogo: el logo sobre el color, con la regla del selector (2026-11-09)", () => {
  const logo = (url: string, extra: Partial<{ oscuro: boolean; blanco: boolean }> = {}) => ({
    url,
    width: 300,
    height: 100,
    oscuro: false,
    alt: "Logo de Hitachi",
    ...extra,
  });
  const baldosas = new Map([
    [
      "hitachi",
      {
        color: "#f36c1b",
        logo: { url: "/hitachi-blanco.png", width: 640, height: 313, oscuro: false },
      },
    ],
    [
      "case",
      {
        color: "#f3e7c9",
        logo: { url: "/case-original.png", width: 228, height: 69, oscuro: false },
      },
    ],
  ]);

  it("con baldosa: su logo tal cual, sin tinta, y su color oscurecido lo justo para el blanco", () => {
    const b = bannerConLogo(
      "Hitachi LANDCROS",
      logo("/hitachi.png", { oscuro: true }),
      "#000000",
      null,
      baldosas,
    );
    assert.equal(b.sobreColor.logo?.url, "/hitachi-blanco.png");
    assert.equal(b.sobreColor.logo?.oscuro, false);
    assert.equal(b.sobreColor.logo?.blanco, false);
    assert.equal(b.sobreColor.placa, false);
    assert.equal(b.vista.acento, fondoDePastilla("#f36c1b"));
    // El blanco del logo, al menos a 3:1 sobre la forma.
    assert.ok(contraste(1, luminancia(...rgbDeHex(b.vista.acento)!)) >= 3);
    // En móvil (fondo blanco), el de todo el sitio tal cual: un logo blanco, con su tinta oscura.
    assert.equal(b.movil?.url, "/hitachi.png");
    assert.equal(b.movil?.oscuro, true);
  });

  it("Case: su logo original sobre su crema, que no se toca", () => {
    const b = bannerConLogo("Case Construction", logo("/case.png"), "#ffcc00", null, baldosas);
    assert.equal(b.sobreColor.logo?.url, "/case-original.png");
    assert.equal(b.vista.acento, "#f3e7c9");
  });

  it("sin baldosa: el color propio y el logo de siempre sobre plaquita blanca", () => {
    const b = bannerConLogo("Donaldson", logo("/donaldson.png"), "#0055a5", null, baldosas);
    assert.equal(b.sobreColor.logo?.url, "/donaldson.png");
    assert.equal(b.sobreColor.placa, true);
    assert.equal(b.vista.acento, "#0055a5");
  });

  it("un logo JPEG de baldosa va sobre plaquita (sin transparencia sería un rectángulo)", () => {
    const conJpeg = new Map([
      [
        "dynapac",
        { color: "#ffd400", logo: { url: "/d.jpg", width: 300, height: 100, oscuro: false } },
      ],
    ]);
    assert.equal(bannerConLogo("Dynapac", null, null, null, conJpeg).sobreColor.placa, true);
  });

  it("sin logo: sin plaquita y con el nombre (lo pinta el componente)", () => {
    const b = bannerConLogo("Ammann", null, null, null, new Map());
    assert.equal(b.sobreColor.logo, null);
    assert.equal(b.sobreColor.placa, false);
    assert.equal(b.movil, null);
  });
});
