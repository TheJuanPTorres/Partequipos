import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  altDeFoto,
  categoriaDeUnidad,
  contieneSerial,
  descripcionSinSerial,
  limpiarReferencia,
  nombreCompuesto,
  nombreDeFicheroUsado,
  nombreDeMarca,
  normalizarAnio,
  normalizarHoras,
  normalizarPeso,
  quitarSerial,
} from "./wordpress";

// Seriales INVENTADOS: el repositorio es público y los reales no se publican.
const SERIAL = "X9876";

describe("normalización de los campos de WordPress", () => {
  it("peso con coma o con punto", () => {
    assert.equal(normalizarPeso("7,5"), 7.5);
    assert.equal(normalizarPeso("7.5"), 7.5);
    assert.equal(normalizarPeso(" 35 "), 35);
    assert.equal(normalizarPeso(""), null);
    assert.equal(normalizarPeso("n/a"), null);
  });

  it("horas: entero, punto de miles, PENDIENTE y respaldo en la descripción", () => {
    assert.deepEqual(normalizarHoras("6313", ""), { valor: 6313, origen: "campo" });
    assert.deepEqual(normalizarHoras(" 4.219 ", ""), { valor: 4219, origen: "campo" });
    assert.deepEqual(normalizarHoras("PENDIENTE", "con 900 horas"), {
      valor: null,
      origen: "pendiente",
    });
    assert.deepEqual(normalizarHoras("4.92", "<p>2021, 4.926 horas, serial X1.</p>"), {
      valor: 4926,
      origen: "descripcion",
    });
    assert.deepEqual(normalizarHoras("4.92", "sin cifra"), { valor: null, origen: "sin dato" });
  });

  it("año válido o vacío", () => {
    assert.equal(normalizarAnio("2016"), 2016);
    assert.equal(normalizarAnio(""), null);
    assert.equal(normalizarAnio(null), null);
    assert.equal(normalizarAnio("16"), null);
  });

  it("marca y referencia", () => {
    assert.equal(nombreDeMarca("HITACHI"), "Hitachi");
    assert.equal(nombreDeMarca("LIUGONG"), "LiuGong");
    assert.equal(nombreDeMarca(""), null);
    assert.equal(limpiarReferencia("HITACHI ZX40U-5 ", "Hitachi"), "ZX40U-5");
    assert.equal(limpiarReferencia(" ZX135US-5B ", "Hitachi"), "ZX135US-5B");
  });

  it("categoría: la de WordPress, o deducida del peso si no tiene", () => {
    assert.deepEqual(categoriaDeUnidad("EXCAVADORAS", 35), {
      slug: "excavadoras",
      tipo: "Excavadora",
      deducida: false,
    });
    assert.deepEqual(categoriaDeUnidad("MINIEXCAVADORA", 1.7), {
      slug: "miniexcavadoras",
      tipo: "Miniexcavadora",
      deducida: false,
    });
    assert.equal(categoriaDeUnidad(null, 35)?.slug, "excavadoras");
    assert.equal(categoriaDeUnidad(null, 35)?.deducida, true);
    assert.equal(categoriaDeUnidad(null, 3)?.slug, "miniexcavadoras");
    assert.equal(categoriaDeUnidad(null, null), null);
    // Una categoría desconocida no se adivina.
    assert.equal(categoriaDeUnidad("CARGADORES", 10), null);
  });

  it("nombre compuesto: tipo, marca, modelo y año, sin huecos", () => {
    assert.equal(
      nombreCompuesto("Excavadora", "Hitachi", "ZX350H-5B", 2016),
      "Excavadora Hitachi ZX350H-5B 2016",
    );
    assert.equal(
      nombreCompuesto("Excavadora", "Hitachi", "ZX350LC-6N", null),
      "Excavadora Hitachi ZX350LC-6N",
    );
  });
});

describe("el número de serie no se publica", () => {
  it("lo quita con lo que lo presenta, junto o separado", () => {
    assert.equal(
      quitarSerial("año 2016, 6313 horas y serial X9876 . Equipo", SERIAL),
      "año 2016, 6313 horas. Equipo",
    );
    assert.equal(
      quitarSerial("1.894 horas reales, serial X 9876 . Equipo", SERIAL),
      "1.894 horas reales. Equipo",
    );
    assert.equal(
      quitarSerial("EXCAVADORA HITACHI ZX200-6 SN X9876", SERIAL),
      "EXCAVADORA HITACHI ZX200-6",
    );
    assert.equal(
      quitarSerial("EXCAVADORA HITACHI ZX200-6 x9876", SERIAL),
      "EXCAVADORA HITACHI ZX200-6",
    );
    assert.equal(
      quitarSerial("Hitachi ZX200-6-SN X9876-001 (1)", SERIAL),
      "Hitachi ZX200-6-001 (1)",
    );
  });

  it("no toca un número que solo empieza igual", () => {
    assert.equal(quitarSerial("referencia X98765", SERIAL), "referencia X98765");
  });

  it("detecta el serial aunque vaya pegado o con espacios", () => {
    assert.ok(contieneSerial("snx9876", SERIAL));
    assert.ok(contieneSerial("X 98 76", SERIAL));
    assert.ok(!contieneSerial("ZX200-6", SERIAL));
    assert.ok(!contieneSerial("lo que sea", ""));
  });

  it("descripción en texto plano, con el emoji y sin el serial", () => {
    const html =
      "<strong>Partequipos Usados Premium: excavadoras.\n\nHITACHI ZX330-6, año 2020 , con 4.219 horas y serial X 9876. Equipo revisado.</strong>" +
      '<strong><img class="emoji" alt="📞" src="https://s.w.org/images/core/emoji/17.0.2/svg/1f4de.svg"> 317 670 7071 — Cotiza.</strong>&nbsp;';
    const d = descripcionSinSerial(html, SERIAL);
    assert.ok(d);
    assert.ok(!contieneSerial(d, SERIAL), d);
    assert.match(d, /con 4\.219 horas\. Equipo revisado\./);
    assert.match(d, /📞 317 670 7071/);
    assert.doesNotMatch(d, /<|&nbsp;/);
  });

  it("si el serial no se puede quitar, no hay descripción", () => {
    assert.equal(descripcionSinSerial("<p>código snx9876</p>", SERIAL), null);
  });

  it("texto alternativo sin serial ni numeración, con el número de foto", () => {
    assert.equal(
      altDeFoto(
        "Maquinaria pesada usada excavadora Hitachi ZX200-6 SN X9876 (1)",
        SERIAL,
        "N",
        1,
        12,
      ),
      "Maquinaria pesada usada excavadora Hitachi ZX200-6, foto 1 de 12",
    );
    assert.equal(
      altDeFoto("Hitachi ZX200-6-SN X9876-001 (1)", SERIAL, "N", 2, 3),
      "Hitachi ZX200-6, foto 2 de 3",
    );
    // «-6» es el modelo: no se confunde con un número de foto.
    assert.equal(
      altDeFoto("EXCAVADORA HITACHI ZX200-6", SERIAL, "N", 1, 1),
      "EXCAVADORA HITACHI ZX200-6",
    );
  });

  it("sin texto alternativo útil, el nombre de la unidad", () => {
    const nombre = "Excavadora Hitachi ZX200-6 2019";
    assert.equal(altDeFoto("", SERIAL, nombre, 3, 5), `${nombre}, foto 3 de 5`);
    assert.equal(altDeFoto("X9876", SERIAL, nombre, 1, 1), nombre);
  });

  it("nombre del fichero: sin serial, con el id del adjunto y solo fotos", () => {
    assert.equal(
      nombreDeFicheroUsado(
        "https://partequipos.com/wp-content/uploads/2026/08/Excavadora-HITACHI-ZX225USR-6-SN-X9876-5.JPEG",
        48211,
        "Excavadora Hitachi ZX225USR-6 2018",
      ),
      "wp-usado-48211-excavadora-hitachi-zx225usr-6-2018.jpg",
    );
    assert.equal(nombreDeFicheroUsado("https://x/uploads/fotos.zip", 1, "N"), null);
  });
});
