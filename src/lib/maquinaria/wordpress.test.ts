import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
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
