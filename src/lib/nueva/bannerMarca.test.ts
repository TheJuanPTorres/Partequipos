import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Media } from "@/payload-types";

import { logoOpaco, mezclar, vistaBanner } from "./bannerMarca";

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

  it("un logo JPEG es opaco (placa blanca); PNG, WebP y SVG se tiñen", () => {
    assert.equal(logoOpaco("https://x/logo-dynapac.jpg"), true);
    assert.equal(logoOpaco("/api/media/file/logo.JPEG?v=1"), true);
    assert.equal(logoOpaco("https://x/logo-case.png"), false);
    assert.equal(logoOpaco("https://x/logo.webp"), false);
    assert.equal(logoOpaco("https://x/jpg-logo.svg"), false);
  });
});
