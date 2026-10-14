import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CORRECCIONES_WP,
  MAX_DESCRIPCION_GENERADA,
  codigoClave,
  descripcionGenerada,
  descripcionSeoDeFicha,
  mencionaModelo,
  primeraFrase,
  ETIQUETAS_CORREGIDAS,
  clasificarTexto,
  enlacesDe,
  etiquetaLegible,
  fotoDeFicha,
  nombreDeFicha,
  paresDeEspecificaciones,
  pdfDeFicha,
  pesoOperativoKg,
} from "./wordpress";

// Ejemplos inventados (CLAUDE.md §9): ni modelos ni cifras reales.

describe("clasificarTexto", () => {
  it("distingue plantilla, especificaciones y texto", () => {
    assert.equal(clasificarTexto('<p>[elementor-template id="1"]</p>'), "plantilla");
    assert.equal(
      clasificarTexto("<table><tr><td>A</td><td>1</td></tr></table>"),
      "especificaciones",
    );
    assert.equal(
      clasificarTexto("<ul><li><strong>ANCHO:</strong> 2 m</li></ul>"),
      "especificaciones",
    );
    assert.equal(clasificarTexto("<p>Una máquina de ejemplo.</p>"), "texto");
    // Una lista sin etiqueta en negrita es texto (argumentos de venta), no ficha técnica.
    assert.equal(clasificarTexto("<ul><li>Cabina amplia</li></ul>"), "texto");
  });
});

describe("ETIQUETAS_CORREGIDAS", () => {
  it("cada corrección es distinta de su original y no se encadena", () => {
    for (const [de, a] of Object.entries(ETIQUETAS_CORREGIDAS)) {
      assert.notEqual(de, a);
      assert.equal(ETIQUETAS_CORREGIDAS[a], undefined, `«${a}» volvería a corregirse`);
    }
  });
});

describe("etiquetaLegible", () => {
  it("pasa a minúsculas solo lo que viene todo en mayúsculas", () => {
    assert.equal(etiquetaLegible("POTENCIA NETA"), "Potencia neta");
    assert.equal(etiquetaLegible("ANCHO MÁXIMO:"), "Ancho máximo");
    assert.equal(etiquetaLegible("Marca y modelo del motor"), "Marca y modelo del motor");
    assert.equal(etiquetaLegible("Peso CE"), "Peso CE");
  });
});

describe("paresDeEspecificaciones", () => {
  it("tabla de 4 columnas con la etiqueta en negrita y una fila con colspan", () => {
    const html =
      "<table><tbody>" +
      "<tr><td><strong>POTENCIA NETA</strong></td><td>100 hp</td><td><strong>ALCANCE</strong></td><td>5,5 m</td></tr>" +
      '<tr><td><strong>MOTOR</strong></td><td colspan="2">Motor X1</td><td> </td></tr>' +
      "</tbody></table>";
    assert.deepEqual(paresDeEspecificaciones(html), [
      { etiqueta: "Potencia neta", valor: "100 hp" },
      { etiqueta: "Alcance", valor: "5,5 m" },
      { etiqueta: "Motor", valor: "Motor X1" },
    ]);
  });

  it("tabla de 2 columnas con el valor en negrita", () => {
    const html =
      "<p> </p><table><tbody>" +
      "<tr><td><p>Ancho de la pala</p></td><td><p><strong>3.000 mm</strong></p></td></tr>" +
      "<tr><td><p>Cilindros</p></td><td><p>4</p></td></tr></tbody></table>";
    assert.deepEqual(paresDeEspecificaciones(html), [
      { etiqueta: "Ancho de la pala", valor: "3.000 mm" },
      { etiqueta: "Cilindros", valor: "4" },
    ]);
  });

  it("lista con la etiqueta en negrita y una entidad numérica", () => {
    const html =
      "<ul><li><strong>ANCHO B&#193;SICO:</strong> 1.500 mm</li><li><strong>USO:</strong> Obra</li></ul>";
    assert.deepEqual(paresDeEspecificaciones(html), [
      { etiqueta: "Ancho básico", valor: "1.500 mm" },
      { etiqueta: "Uso", valor: "Obra" },
    ]);
  });

  it("tabla con <th> y celda de grupo con rowspan: el grupo se salta", () => {
    const html =
      "<table><tbody>" +
      '<tr><th rowspan="2">Peso</th><th>Peso de transporte\n\n</th><td class="c">1.000 kg</td></tr>' +
      "<tr><th>Peso en funcionamiento</th><td>900 kg</td></tr>" +
      '<tr><th rowspan="1">Motor</th><th>Tipo</th><td>Motor X1</td></tr>' +
      "</tbody></table>";
    assert.deepEqual(paresDeEspecificaciones(html), [
      { etiqueta: "Peso de transporte", valor: "1.000 kg" },
      { etiqueta: "Peso en funcionamiento", valor: "900 kg" },
      { etiqueta: "Tipo", valor: "Motor X1" },
    ]);
  });

  it("negrita mal cerrada: devuelve al valor lo que se llevó", () => {
    const html =
      "<ul><li><strong>ANCHO DE RODADURA: 1</strong>500 mm</li><li><strong>MOTOR: </strong>Motor X1</li></ul>";
    assert.deepEqual(paresDeEspecificaciones(html), [
      { etiqueta: "Ancho de rodadura", valor: "1500 mm" },
      { etiqueta: "Motor", valor: "Motor X1" },
    ]);
  });

  it("aplica la tabla de etiquetas corregidas, y solo a las que están", () => {
    const html =
      "<table><tr><td>Alcance maximo en el suelo</td><td>5 m</td><td>Peso operacional</td><td>9 t</td></tr></table>";
    assert.deepEqual(paresDeEspecificaciones(html), [
      { etiqueta: "Alcance máximo en el suelo", valor: "5 m" },
      { etiqueta: "Peso operacional", valor: "9 t" },
    ]);
  });

  it("descarta las filas sin valor: no inventa nada", () => {
    const html = "<table><tr><td><strong>MOTOR</strong></td><td> </td></tr></table>";
    assert.deepEqual(paresDeEspecificaciones(html), []);
  });
});

describe("pesoOperativoKg", () => {
  const conPeso = (valor: string, etiqueta = "Peso operativo") => [{ etiqueta, valor }];
  it("entiende t, kg y lb con la escritura española", () => {
    assert.equal(pesoOperativoKg(conPeso("12,5 t")), 12500);
    assert.equal(pesoOperativoKg(conPeso("12.5 t")), 12500);
    assert.equal(pesoOperativoKg(conPeso("20.100 kg")), 20100);
    assert.equal(pesoOperativoKg(conPeso("10.000 lb", "Peso operacional")), 4536);
    assert.equal(pesoOperativoKg(conPeso("900 kg", "Peso en funcionamiento")), 900);
    assert.equal(pesoOperativoKg(conPeso("5.25 Toneladas", "Peso de operación")), 5250);
  });
  it("null sin fila de peso o con un valor que no entiende", () => {
    assert.equal(pesoOperativoKg([{ etiqueta: "Potencia", valor: "100 hp" }]), null);
    assert.equal(pesoOperativoKg(conPeso("según configuración")), null);
  });
});

describe("nombres de ficheros y de la ficha", () => {
  it("nombre de la ficha: el título sin etiquetas ni espacios de más", () => {
    assert.equal(nombreDeFicha("Excavadora  Ejemplo&nbsp;X1"), "Excavadora Ejemplo X1");
  });
  it("foto con prefijo propio y AVIF → WebP", () => {
    const f = fotoDeFicha(
      "https://ejemplo.invalid/wp-content/uploads/2025/01/foto.avif",
      77,
      "Excavadora Ejemplo X1",
    );
    assert.equal(f?.fichero, "wp-ficha-77-excavadora-ejemplo-x1.webp");
    assert.equal(f?.convertir, true);
    assert.equal(fotoDeFicha("https://ejemplo.invalid/a.gif", 1, "X"), null);
  });
  it("PDF con prefijo propio; lo que no es PDF, null", () => {
    assert.equal(
      pdfDeFicha("https://ejemplo.invalid/wp-content/uploads/2025/02/Ficha-X1.pdf")?.fichero,
      "wp-ficha-2025-02-ficha-x1.pdf",
    );
    assert.equal(pdfDeFicha("https://ejemplo.invalid/ficha.docx"), null);
  });
  it("enlaces de un texto, sin repetir", () => {
    assert.deepEqual(
      enlacesDe('<a href="/a/">x</a> <a href="/a/">y</a> <a href="https://b.invalid">z</a>'),
      ["/a/", "https://b.invalid"],
    );
  });
});

describe("CORRECCIONES_WP", () => {
  it("cada corrección es de una ficha (ruta de maquinaria nueva con barra final) y dice por qué", () => {
    for (const [ruta, c] of Object.entries(CORRECCIONES_WP)) {
      assert.match(
        ruta,
        /^\/maquinaria-pesada\/maquinaria-pesada-nueva\/marcas\/[^/]+\/[^/]+\/[^/]+\/$/,
      );
      assert.ok(c.sinPdf || c.sinTituloSeo || c.sinDescripcionSeo, ruta);
    }
  });
});

describe("descripción para buscadores", () => {
  it("codigoClave: el primer trozo del código, plegado; sin código, la última palabra del nombre", () => {
    assert.equal(codigoClave("CX-130D Tier4", "x"), "CX130D");
    assert.equal(codigoClave("CX 130D Tier4", "x"), "CX130D");
    assert.equal(codigoClave("845C Tier 4", "x"), "845C");
    assert.equal(codigoClave(null, "Rodillo Ejemplo RX-9"), "RX9");
  });

  it("mencionaModelo: como palabra, junto o partido en dos; nunca como parte de otro", () => {
    assert.equal(mencionaModelo("La excavadora cx-130d de ejemplo", "CX130D"), true);
    assert.equal(mencionaModelo("El minicargador SR 175B de ejemplo", "SR175B"), true);
    assert.equal(mencionaModelo("La miniexcavadora VIO50-6A", "VIO506"), false);
    assert.equal(mencionaModelo("La excavadora ZX200LC-5G", "ZX1305B"), false);
  });

  it("primeraFrase: el primer párrafo con texto, sin títulos ni plantillas", () => {
    const html =
      '<h3>Un título</h3><p>[elementor-template id="1"]</p><p>La RX-9 compacta. Segunda frase.</p>';
    assert.equal(primeraFrase(html), "La RX-9 compacta.");
    assert.equal(primeraFrase("<h3>Solo título</h3>"), null);
  });

  it("descripcionGenerada: lleva el nombre y no pasa de 159 caracteres", () => {
    assert.equal(
      descripcionGenerada("Rodillo Ejemplo RX-9"),
      "Rodillo Ejemplo RX-9: ficha técnica, fotos y cotización en Partequipos, Colombia.",
    );
    assert.ok(descripcionGenerada("X".repeat(200)).length <= MAX_DESCRIPCION_GENERADA);
    assert.notEqual(descripcionGenerada("Modelo A1"), descripcionGenerada("Modelo B2"));
  });

  it("descripcionSeoDeFicha: WordPress si nombra el modelo; si no, la frase; si no, la generada", () => {
    const base = { nombre: "Rodillo Ejemplo RX-9", codigo: "RX-9" };
    assert.deepEqual(
      descripcionSeoDeFicha({ ...base, metaWp: "El RX-9 de ejemplo.", htmlDescripcion: "" }),
      { texto: "El RX-9 de ejemplo.", origen: "wordpress" },
    );
    assert.deepEqual(
      descripcionSeoDeFicha({
        ...base,
        metaWp: "La excavadora QZ-1 de otro modelo.",
        htmlDescripcion: "<p>El rodillo RX-9 compacta bien. Más.</p>",
      }),
      { texto: "El rodillo RX-9 compacta bien.", origen: "frase" },
    );
    assert.equal(
      descripcionSeoDeFicha({
        ...base,
        metaWp: "La excavadora QZ-1.",
        htmlDescripcion: "<p>Otro texto sin el modelo.</p>",
      }).origen,
      "generada",
    );
    // Una corrección que descarta la de WordPress, aunque nombre el modelo.
    assert.equal(
      descripcionSeoDeFicha({ ...base, metaWp: "El RX-9.", htmlDescripcion: "", descartarWp: true })
        .origen,
      "generada",
    );
  });
});
