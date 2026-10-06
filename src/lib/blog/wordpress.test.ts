import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  altParaMedia,
  decodificarEntidades,
  enlaceInterno,
  entradillaDeExtracto,
  esAltGenerado,
  esAvif,
  esMismaImagen,
  extraerJsonWp,
  formatoPorExtension,
  limpiarLexical,
  nombreDeFicheroWp,
  normalizarRuta,
  quitarShortcodes,
  textoDescriptivo,
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

  it("reconoce AVIF por la extensión, con o sin consulta", () => {
    assert.equal(esAvif("https://x/a/foto-1024x576.avif"), true);
    assert.equal(esAvif("https://x/a/foto.AVIF?ver=2"), true);
    assert.equal(esAvif("https://x/a/foto.webp"), false);
  });

  it("nombre de fichero determinista con año y mes, sin tildes ni puntos dobles", () => {
    assert.equal(
      nombreDeFicheroWp("https://partequipos.com/wp-content/uploads/2024/05/Grúa%20Nueva..PNG"),
      "wp-2024-05-grua-nueva.png",
    );
    assert.equal(nombreDeFicheroWp("https://partequipos.com/otra/foto.jpg"), "wp-foto.jpg");
  });

  it("alt: el de WordPress si sirve; si no, pie, título de la imagen, sección o respaldo", () => {
    const base = { titulo: "Fuga de aceite", n: 2, fichero: "wp-2024-05-zx350.jpg" };
    assert.deepEqual(altParaMedia({ ...base, altWp: "Excavadora Hitachi en obra" }), {
      alt: "Excavadora Hitachi en obra",
      origen: "wordpress",
      marcado: false,
    });
    assert.deepEqual(
      altParaMedia({
        ...base,
        altWp: "",
        tituloWp: "sistema-hidráulico-del-pistón-para-tractores",
      }),
      {
        alt: "Sistema hidráulico del pistón para tractores",
        origen: "título de la imagen",
        marcado: false,
      },
    );
    assert.deepEqual(altParaMedia({ ...base, tituloWp: "IMG_0556", seccion: "Causas comunes:" }), {
      alt: "Ilustración de «Causas comunes», en el artículo «Fuga de aceite»",
      origen: "sección",
      marcado: true,
    });
    for (const flojo of ["", "imagen", "zx350"]) {
      const r = altParaMedia({ ...base, altWp: flojo });
      assert.equal(r.marcado, true);
      assert.equal(r.alt, "Ilustración del artículo «Fuga de aceite» (2)");
    }
  });

  it("título o pie de la imagen: solo si describe algo, en español y sin identificadores", () => {
    assert.equal(
      textoDescriptivo("fuga-de-aceite-FUSO-canter-senales-comunes"),
      "Fuga de aceite FUSO canter senales comunes",
    );
    assert.equal(textoDescriptivo("rodillo-ca6500d-dynapac-frontal-600&#215;600"), null);
    for (const malo of [
      "IMG_0556",
      "images (10)",
      "Gemini_Generated_Image_bjsohjbjsohjbjso",
      "a0ce467c-3ceb-4ebf-b62f-ef380f2755dd-2026-07-28",
      "Version 1.0.0",
      "crawler-excavators-cx210c",
      "handok logo",
      "",
    ]) {
      assert.equal(textoDescriptivo(malo), null, malo);
    }
  });

  it("reconoce los alt que escribió el importador (y que puede rehacer)", () => {
    assert.equal(esAltGenerado("Ilustración del artículo «X» (2)"), true);
    assert.equal(esAltGenerado("Ilustración de «Causas», en el artículo «X»"), true);
    assert.equal(esAltGenerado("Excavadora en obra"), false);
    assert.equal(esAltGenerado(null), false);
  });

  it("los enlaces al sitio actual pasan a rutas relativas, con barra final y sin codificar", () => {
    assert.equal(
      enlaceInterno("https://partequipos.com/contactanos/?a=1#f"),
      "/contactanos/?a=1#f",
    );
    assert.equal(enlaceInterno("https://partequipos.com"), "/");
    assert.equal(enlaceInterno("http://www.partequipos.com/maquinaria"), "/maquinaria/");
    assert.equal(normalizarRuta("/tama%C3%B1o/a.pdf"), "/tamaño/a.pdf");
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

  it("limpia el Lexical: alineaciones, párrafos vacíos y saltos de nivel", () => {
    const p = (texto: string, format = "") => ({
      type: "paragraph",
      format,
      children: texto ? [{ type: "text", text: texto }] : [],
    });
    const h = (tag: string) => ({
      type: "heading",
      tag,
      format: "",
      children: [{ type: "text", text: tag }],
    });
    const raiz = {
      children: [
        h("h4"),
        p("uno", "justify"),
        p(""),
        h("h5"),
        h("h2"),
        h("h4"),
        p("dos", "center"),
      ],
    };
    assert.deepEqual(limpiarLexical(raiz), { alineaciones: 2, vacios: 1, niveles: 3 });
    assert.deepEqual(
      (raiz.children as { type: string; tag?: string; format?: string }[]).map((n) =>
        n.type === "heading" ? n.tag : n.format,
      ),
      ["h2", "", "h3", "h2", "h3", ""],
    );
  });

  it("valores únicos: lo repetido no se importa", () => {
    const u = valoresUnicos(["A", "B", "A", " ", null, "C"]);
    assert.deepEqual([...u].sort(), ["B", "C"]);
  });
});
