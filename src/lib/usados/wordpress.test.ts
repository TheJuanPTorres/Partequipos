import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  fechaDeWordPress,
  altDeFoto,
  anioDeUnidad,
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
  altSinSerial,
  mencionaSerial,
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

  it("año: la taxonomía y, si falta, el de la descripción", () => {
    assert.deepEqual(anioDeUnidad("2016", "año 2019"), { valor: 2016, origen: "campo" });
    assert.deepEqual(anioDeUnidad(null, "<p>HITACHI ZX330 , año 2003 , con</p>"), {
      valor: 2003,
      origen: "descripcion",
    });
    assert.deepEqual(anioDeUnidad(null, "sin año"), { valor: null, origen: "sin dato" });
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

  it("se lleva también el «con» o el «, y» que lo enlazaban", () => {
    assert.equal(
      quitarSerial("ZX330 , año 2003 , con serial X9876. Equipo", SERIAL),
      "ZX330, año 2003. Equipo",
    );
    assert.equal(
      quitarSerial("ZX30U-5A, año 2015 , y serial X 9876 . Equipo", SERIAL),
      "ZX30U-5A, año 2015. Equipo",
    );
    // Un «con» que no presenta el serial se queda.
    assert.equal(quitarSerial("con 900 horas y serial X9876.", SERIAL), "con 900 horas.");
  });

  it("quita también un «serial <código>» que no es el del campo (parte del serial u otro)", () => {
    // Seriales INVENTADOS. El campo dice X9876; la descripción cita otro código.
    assert.equal(
      quitarSerial("2020, con 9.000 horas y serial B 54321. Equipo revisado", SERIAL),
      "2020, con 9.000 horas. Equipo revisado",
    );
    assert.equal(quitarSerial("horas y serial A1234. Listo", SERIAL), "horas. Listo");
    assert.equal(quitarSerial("Motor revisado, S/N 55555.", SERIAL), "Motor revisado.");
    assert.equal(quitarSerial("número de serie 4321 y cabina", SERIAL), "y cabina");
    // Sin serial en el campo, también.
    assert.equal(quitarSerial("horas y serial A1234. Listo", ""), "horas. Listo");
  });

  it("quita «SN <código>» y sus variantes aunque el código no sea el del campo (2026-10-17)", () => {
    // Seriales INVENTADOS. El campo dice X9876; el texto cita otro código.
    const base = "Maquinaria pesada usada excavadora Hitachi ZX200-6";
    for (const sn of [
      "SN Q4321",
      "SN: Q4321",
      "SN:Q4321",
      "SN. Q4321",
      "S.N. Q4321",
      "S.N.Q4321",
      "S N Q4321",
      "SNQ4321",
      "sn q4321",
      "S/N Q4321",
      "SN Q 4321",
      "SN #Q4321",
    ]) {
      assert.equal(quitarSerial(`${base} ${sn}, foto 1 de 6`, SERIAL), `${base}, foto 1 de 6`, sn);
      assert.equal(mencionaSerial(`${base} ${sn}`), true, sn);
    }
    // Pegado al modelo con guion, como en los ficheros de WordPress.
    assert.equal(
      quitarSerial("Hitachi ZX200-6-SN Q4321, foto 2 de 3", ""),
      "Hitachi ZX200-6, foto 2 de 3",
    );
    // Sin serial en el campo, también.
    assert.equal(quitarSerial(`${base} SN Q4321, foto 1 de 6`, ""), `${base}, foto 1 de 6`);
  });

  it("altSinSerial: limpia un texto ya guardado y nunca lo deja vacío", () => {
    // Seriales INVENTADOS.
    const lista = ["Q4321", "X9876"];
    const base = "Maquinaria pesada usada excavadora Hitachi ZX490LCH-5A";
    assert.equal(altSinSerial(`${base} SN Q4321, foto 1 de 6`, lista), `${base}, foto 1 de 6`);
    // Un serial de la lista sin presentación también se va.
    assert.equal(altSinSerial(`${base} X9876, foto 2 de 6`, lista), `${base}, foto 2 de 6`);
    // Uno que no está en la lista pero va presentado con «SN», también.
    assert.equal(altSinSerial(`${base} S.N. B77777`, lista), base);
    // Sin nada que quitar, igual.
    assert.equal(altSinSerial(`${base}, foto 3 de 6`, lista), `${base}, foto 3 de 6`);
    // Si solo quedaría el serial o algo flojo: null, nunca vacío.
    assert.equal(altSinSerial("SN Q4321", lista), null);
    assert.equal(altSinSerial("Foto SN Q4321", lista), null);
    // Metido en otra palabra: no se puede cortar con seguridad.
    assert.equal(altSinSerial(`${base} abcQ4321def`, lista), null);
  });

  it("«SN» sin código, o el principio de una palabra, se queda", () => {
    for (const t of [
      "Snorkel S3219",
      "Plataforma Snorkel TB42",
      "snack bar",
      "placa SN sin leer",
      "SN y motor",
      // «SN» de un modelo de Case, con datos detrás.
      "Retroexcavadora Case 580 SN 4x4",
      "Retroexcavadora Case 580 SN 2015",
      "Case 580 SN WT",
      // Sufijos aleatorios de un fichero (inventados).
      "wp-ficha-case-580-sn-ficha-tecnica-partequipos-4cdVxvPVkzDlq3P71RHw.pdf",
      "wp-eni-oso-46-partequipos-sNhu3NMEAw7CK123UJyB.jpg",
    ]) {
      assert.equal(mencionaSerial(t), false, t);
      assert.equal(quitarSerial(t, SERIAL), t, t);
    }
  });

  it("no toca «serial» sin código ni la «serie» de un modelo", () => {
    assert.equal(quitarSerial("placa de serial y motor", SERIAL), "placa de serial y motor");
    assert.equal(quitarSerial("de la serie ZX", SERIAL), "de la serie ZX");
    assert.equal(mencionaSerial("placa de serial y motor"), false);
    assert.equal(mencionaSerial("serial X 98765"), true);
  });

  it("una descripción sin serial queda igual", () => {
    assert.equal(
      descripcionSinSerial("<p>Equipo con 900 horas.</p>", SERIAL),
      "Equipo con 900 horas",
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
    // Metido dentro de otra palabra: no hay forma segura de cortarlo.
    assert.equal(descripcionSinSerial("<p>código abcx9876def</p>", SERIAL), null);
    // «snx9876» sí se quita desde el 2026-10-17 («SN» pegado al código).
    assert.equal(descripcionSinSerial("<p>código snx9876</p>", SERIAL), "código");
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

describe("fecha de publicación de WordPress", () => {
  it("pasa la fecha GMT a ISO en UTC", () => {
    assert.equal(fechaDeWordPress("2025-12-16 17:34:51"), "2025-12-16T17:34:51.000Z");
    assert.equal(fechaDeWordPress(" 2026-10-05 14:11:43 "), "2026-10-05T14:11:43.000Z");
  });

  it("sin fecha válida, null (borradores, vacío, imposible)", () => {
    assert.equal(fechaDeWordPress("0000-00-00 00:00:00"), null);
    assert.equal(fechaDeWordPress(""), null);
    assert.equal(fechaDeWordPress(undefined), null);
    assert.equal(fechaDeWordPress("2025-02-31 10:00:00"), null);
    assert.equal(fechaDeWordPress("ayer"), null);
  });
});
