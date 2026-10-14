import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  altDeRepuesto,
  codigoDeModelo,
  descripcionSeo,
  esBorradorCopia,
  fotoDeRepuesto,
  fotosGenericas,
  nivelDePagina,
  nombreDeModelo,
  nombreDeTipo,
  pareceDatoDeContacto,
  textoDePagina,
  tituloPorDefectoModelo,
  tituloSeo,
} from "./wordpress";

// Ejemplos INVENTADOS (CLAUDE.md §9): marcas reales del catálogo público, modelos y textos de prueba.

describe("nivel de cada página del catálogo", () => {
  it("marca, tipo, modelo y el nivel de más sin ruta", () => {
    assert.equal(nivelDePagina(["m"]), "marca");
    assert.equal(nivelDePagina(["m", "t"]), "tipo");
    assert.equal(nivelDePagina(["m", "t", "x"]), "modelo");
    assert.equal(nivelDePagina(["m", "t", "x", "y"]), "sinRuta");
  });
  it("fuera del catálogo: raíz, índice de marcas y categorías", () => {
    assert.equal(nivelDePagina(null), null);
    assert.equal(nivelDePagina([]), null);
  });
  it("los borradores «-copy» se reconocen", () => {
    assert.equal(esBorradorCopia("repuestos-excavadora-marca-x100-copy"), true);
    assert.equal(esBorradorCopia("repuestos-excavadora-marca-x100"), false);
  });
});

describe("nombre y código del modelo", () => {
  it("el nombre es el título sin «Repuestos (para)», con la escritura del cliente", () => {
    assert.equal(
      nombreDeModelo("Repuestos Excavadora HITACHI ZX999-9"),
      "Excavadora HITACHI ZX999-9",
    );
    assert.equal(nombreDeModelo("Repuestos para Bulldozer KOMATSU D99"), "Bulldozer KOMATSU D99");
    assert.equal(nombreDeModelo("Repuestos Retro &amp; más 1"), "Retro & más 1");
    assert.equal(
      nombreDeModelo("Repuestos Para Maquinaria Pesada Excavadora CASE"),
      "Excavadora CASE",
    );
  });
  it("el título por defecto del sitio nuevo vuelve a ser el título de WordPress", () => {
    const t = "Repuestos Excavadora HITACHI ZX999-9";
    assert.equal(tituloPorDefectoModelo(nombreDeModelo(t)), t);
  });
  it("código: lo que sigue a la marca, sin mirar mayúsculas", () => {
    assert.deepEqual(codigoDeModelo("Excavadora HITACHI ZX999-9", "Hitachi", "x"), {
      valor: "ZX999-9",
      origen: "titulo",
    });
  });
  it("código con marca de dos palabras, entera o por su primera palabra", () => {
    assert.equal(
      codigoDeModelo("Excavadora CASE CONSTRUCTION CX999", "Case Construction", "x").valor,
      "CX999",
    );
    assert.equal(codigoDeModelo("Excavadora CASE CX999", "Case Construction", "x").valor, "CX999");
    // La página de tipo colocada como modelo: la marca entera, sin código detrás.
    assert.deepEqual(codigoDeModelo("Excavadora CASE CONSTRUCTION", "Case Construction", "x"), {
      valor: null,
      origen: "ninguno",
    });
    assert.equal(codigoDeModelo("Grúa LINK-BELT 999X", "Link Belt", "x").valor, "999X");
  });
  it("sin la marca en el nombre, el código sale del slug", () => {
    assert.deepEqual(
      codigoDeModelo("Excavadora 999", "Komatsu", "repuestos-excavadora-komatsu-pc999-9"),
      { valor: "PC999-9", origen: "slug" },
    );
    assert.deepEqual(codigoDeModelo("Excavadora 999", "Komatsu", "otro"), {
      valor: null,
      origen: "ninguno",
    });
  });
});

describe("nombre del tipo", () => {
  it("sin el prefijo ni la marca del final", () => {
    assert.equal(
      nombreDeTipo("Repuestos para maquinaria pesada Miniexcavadora BOBCAT", "Bobcat"),
      "Miniexcavadora",
    );
    assert.equal(
      nombreDeTipo(
        "Repuestos para maquinaria pesada Bulldozer CASE CONSTRUCTION",
        "Case Construction",
      ),
      "Bulldozer",
    );
    assert.equal(
      nombreDeTipo("Repuestos para maquinaria pesada grúa LINK-BELT", "Link Belt"),
      "Grúa",
    );
    assert.equal(nombreDeTipo("Repuestos para Excavadora CASE", "Case Construction"), "Excavadora");
    assert.equal(nombreDeTipo("Repuestos para maquinaria pesada", "X"), null);
  });
});

describe("texto de la página", () => {
  it("un párrafo por línea en blanco, sin etiquetas ni entidades", () => {
    assert.equal(
      textoDePagina("<p>Mantén tu&nbsp;<b>Equipo X</b> a punto.</p><p>Segundo   párrafo.</p>"),
      "Mantén tu Equipo X a punto.\n\nSegundo párrafo.",
    );
    assert.equal(textoDePagina("<p> </p>"), null);
  });
  it("detecta datos de contacto inventados", () => {
    assert.equal(pareceDatoDeContacto("Escríbenos a ventas@ejemplo.test"), true);
    assert.equal(pareceDatoDeContacto("Llama al +57 300 000 0000"), true);
    assert.equal(pareceDatoDeContacto("Habla por WhatsApp"), true);
    assert.equal(pareceDatoDeContacto("Excavadora ZX999-9 de 2015"), false);
  });
});

describe("SEO desde el título que hoy publica WordPress", () => {
  it("sin el sufijo de marca; vacío si es el título por defecto", () => {
    assert.equal(
      tituloSeo("Repuestos Excavadora X 1 - Partequipos", "Repuestos Excavadora X 1"),
      null,
    );
    assert.equal(tituloSeo("Repuestos excavadora x 1", "Repuestos Excavadora X 1"), null);
    assert.equal(
      tituloSeo("Repuestos para Excavador X 1 | Partequipos", "Repuestos Excavadora X 1"),
      "Repuestos para Excavador X 1",
    );
    assert.equal(tituloSeo("", "Repuestos X"), null);
    assert.equal(tituloSeo(undefined, "Repuestos X"), null);
  });
  it("la descripción viva, en texto plano", () => {
    assert.equal(descripcionSeo("Explora &amp; cotiza"), "Explora & cotiza");
    assert.equal(descripcionSeo(""), null);
  });
});

describe("fotos", () => {
  it("las que salen en muchas páginas son genéricas", () => {
    const paginas = [
      { fotos: [{ idWp: 1 }, { idWp: 1 }] },
      { fotos: [{ idWp: 1 }] },
      { fotos: [{ idWp: 1 }, { idWp: 2 }] },
      { fotos: [{ idWp: 3 }] },
    ];
    assert.deepEqual([...fotosGenericas(paginas, 3)], [1]);
    assert.deepEqual([...fotosGenericas(paginas, 4)], []);
  });
  it("nombre determinista por adjunto; AVIF pasa a WebP", () => {
    assert.deepEqual(
      fotoDeRepuesto("https://ejemplo.test/a/Foto.AVIF", 7, "Excavadora Ñandú X-1"),
      {
        fichero: "wp-repuesto-7-excavadora-nandu-x-1.webp",
        mimetype: "image/webp",
        convertir: true,
        formatoWp: "avif",
      },
    );
    assert.equal(
      fotoDeRepuesto("https://ejemplo.test/a.jpeg", 7, "X")?.fichero,
      "wp-repuesto-7-x.jpg",
    );
    assert.equal(fotoDeRepuesto("https://ejemplo.test/a.jpg", 7, "X")?.convertir, false);
    assert.equal(fotoDeRepuesto("https://ejemplo.test/a.gif", 7, "X"), null);
    assert.equal(fotoDeRepuesto("https://ejemplo.test/a.svg", 7, "X"), null);
  });
  it("texto alternativo: el de WordPress limpio o, si queda flojo, el nombre", () => {
    assert.equal(
      altDeRepuesto("Excavadora amarilla en obra (1)", "N"),
      "Excavadora amarilla en obra",
    );
    assert.equal(altDeRepuesto("Excavadora amarilla-01", "N"), "Excavadora amarilla");
    assert.equal(altDeRepuesto("", "Excavadora X 1"), "Excavadora X 1");
    assert.equal(altDeRepuesto("foto", "Excavadora X 1"), "Excavadora X 1");
    assert.equal(altDeRepuesto("zx-1", "Excavadora X 1"), "Excavadora X 1");
    assert.equal(
      altDeRepuesto("excavadora-x1", "Excavadora X 1", "excavadora-x1.jpg"),
      "Excavadora X 1",
    );
  });
});
