import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  altParaMedia,
  decodificarEntidades,
  enlaceInterno,
  entradillaDeExtracto,
  esMismaImagen,
  extraerJsonWp,
  formatoPorExtension,
  nombreDeFicheroWp,
  quitarShortcodes,
  textoPlano,
  urlImagenCorregida,
  valoresUnicos,
} from "./wordpress";

describe("importador del blog: piezas puras", () => {
  it("lee el JSON aunque WordPress anteponga los <style> de Elementor", () => {
    const sucio = '<style id="elementor-post-1">.a{width:1px}</style>[{"id":1,"slug":"x"}]';
    assert.deepEqual(extraerJsonWp(sucio), [{ id: 1, slug: "x" }]);
    assert.deepEqual(extraerJsonWp('{"id":15,"name":"Noticias"}'), { id: 15, name: "Noticias" });
    assert.throws(() => extraerJsonWp("<html>sin json</html>"));
  });

  it("decodifica entidades y saca texto plano", () => {
    assert.equal(
      decodificarEntidades("Tier&nbsp;4 &#8211; &#x201C;sí&#x201D; &amp; más"),
      "Tier 4 – “sí” & más",
    );
    assert.equal(textoPlano("<p>Hola <strong>mundo</strong></p>\n<p>dos</p>"), "Hola mundo dos");
  });

  it("entradilla sin el [&hellip;] final y recortada por palabras", () => {
    assert.equal(entradillaDeExtracto("<p>Texto corto [&hellip;]</p>"), "Texto corto");
    const larga = entradillaDeExtracto(`<p>${"palabra ".repeat(80)}</p>`, 50);
    assert.ok(larga.length <= 51 && larga.endsWith("…"));
  });

  it("corrige solo el patrón de URL rota medido en el contenido", () => {
    assert.deepEqual(
      urlImagenCorregida(
        "https://partequipos.comquipos.com/partequipos/wp-content/uploads/2019/09/lubricantes-eni-1..png",
      ),
      {
        url: "https://partequipos.com/wp-content/uploads/2019/09/lubricantes-eni-1..png",
        corregida: true,
      },
    );
    const buena = "https://partequipos.com/wp-content/uploads/2024/05/a.jpg";
    assert.deepEqual(urlImagenCorregida(buena), { url: buena, corregida: false });
  });

  it("admite JPEG, PNG y WebP; no AVIF, GIF ni SVG", () => {
    assert.equal(formatoPorExtension("https://x/a.JPG?ver=2"), "jpeg");
    assert.equal(formatoPorExtension("https://x/a.png"), "png");
    assert.equal(formatoPorExtension("https://x/a.webp"), "webp");
    for (const e of ["avif", "gif", "svg", ""]) {
      assert.equal(formatoPorExtension(`https://x/a.${e}`), null);
    }
  });

  it("nombre de fichero determinista con año y mes, sin tildes ni puntos dobles", () => {
    assert.equal(
      nombreDeFicheroWp("https://partequipos.com/wp-content/uploads/2024/05/Grúa%20Nueva..PNG"),
      "wp-2024-05-grua-nueva.png",
    );
    assert.equal(nombreDeFicheroWp("https://partequipos.com/otra/foto.jpg"), "wp-foto.jpg");
  });

  it("usa el alt de WordPress si sirve y, si no, uno de respaldo que el panel acepta", () => {
    assert.deepEqual(altParaMedia("Excavadora Hitachi en obra", "T", 1, "x.jpg"), {
      alt: "Excavadora Hitachi en obra",
      deRespaldo: false,
    });
    for (const flojo of ["", "imagen", "zx350"]) {
      const r = altParaMedia(flojo, "Fuga de aceite", 2, "zx350.jpg");
      assert.equal(r.deRespaldo, true);
      assert.equal(r.alt, "Ilustración del artículo «Fuga de aceite» (2)");
    }
  });

  it("los enlaces al sitio actual pasan a rutas relativas; los demás, tal cual", () => {
    assert.equal(
      enlaceInterno("https://partequipos.com/contactanos/?a=1#f"),
      "/contactanos/?a=1#f",
    );
    assert.equal(
      enlaceInterno("https://partequipos.com/wp-content/uploads/2024/05/a.pdf"),
      "https://partequipos.com/wp-content/uploads/2024/05/a.pdf",
    );
    assert.equal(enlaceInterno("https://www.donaldson.com/"), "https://www.donaldson.com/");
    assert.equal(enlaceInterno("mailto:a@b.co"), "mailto:a@b.co");
  });

  it("quita los shortcodes que quedan como texto y los cuenta", () => {
    assert.deepEqual(quitarShortcodes("Antes [if gte mso 9]medio[endif] después"), {
      texto: "Antes medio después",
      quitados: ["if", "endif"],
    });
    assert.deepEqual(quitarShortcodes("[1] no es shortcode"), {
      texto: "[1] no es shortcode",
      quitados: [],
    });
  });

  it("reconoce la imagen ya subida aunque el Blob le haya añadido un sufijo aleatorio", () => {
    const d = "wp-2024-05-zx350.lc.jpg";
    assert.equal(esMismaImagen("wp-2024-05-zx350.lc.jpg", d), true);
    assert.equal(esMismaImagen("wp-2024-05-zx350.lc-nq9mcBWeeSmCupWXpPDZFDwJ1hBu3P.jpg", d), true);
    assert.equal(esMismaImagen("wp-2024-05-zx350.lc-1.jpg", d), false);
    assert.equal(esMismaImagen("wp-2024-05-zx350.lc-nq9mcBWeeSmCupWXpPDZFDwJ1hBu3P.png", d), false);
    assert.equal(esMismaImagen("wp-2024-05-zx350xlc.jpg", d), false);
    assert.equal(
      esMismaImagen("wp-2024-05-zx350.lc-extra-nq9mcBWeeSmCupWXpPDZFDwJ1hBu3P.jpg", d),
      false,
    );
  });

  it("valores únicos: lo repetido no se importa", () => {
    const u = valoresUnicos(["A", "B", "A", " ", null, "C"]);
    assert.deepEqual([...u].sort(), ["B", "C"]);
  });
});
