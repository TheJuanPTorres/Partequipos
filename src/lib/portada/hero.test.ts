import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { diapositivasDeHero, sizesFondoHero } from "./hero";

const media = (id: number, extra: object = {}) =>
  ({
    id,
    alt: `alt ${id}`,
    url: `https://x/${id}.jpg`,
    width: 800,
    height: 600,
    ...extra,
  }) as never;

describe("diapositivas del hero", () => {
  it("convierte una diapositiva completa", () => {
    const [d] = diapositivasDeHero({
      diapositivas: [
        {
          titulo: " Potencia Hitachi ",
          parrafo: "Texto",
          imagenFondo: media(1, { focalX: 20, focalY: 30 }),
          imagenFrontal: media(2),
          enlace: "/maquinaria-pesada/",
          enlaceNombre: "Ver maquinaria Hitachi",
        },
      ],
    });
    assert.equal(d?.titulo, "Potencia Hitachi");
    assert.equal(d?.fondo.alt, "", "el fondo es decorativo");
    assert.equal(d?.fondo.posicion, "20% 30%");
    assert.equal(d?.frontal?.alt, "alt 2");
    assert.deepEqual(d?.enlace, { href: "/maquinaria-pesada/", nombre: "Ver maquinaria Hitachi" });
  });

  describe("solo la imagen de fondo (casillas «Mostrar …», 2026-10-15)", () => {
    const completa = {
      titulo: "Potencia Hitachi",
      tituloArriba: "Potencia",
      tituloAbajo: "Hitachi",
      textoCircular: "Partequipos",
      parrafo: "Texto",
      imagenFondo: media(1),
      imagenFrontal: media(2),
      enlace: "/maquinaria-pesada/",
      enlaceNombre: "Ver maquinaria Hitachi",
    };

    it("sin las casillas (filas de antes de la migración, null): todo se pinta, como siempre", () => {
      const [d] = diapositivasDeHero({ diapositivas: [{ ...completa }] });
      assert.equal(d?.tituloVisible, true);
      assert.deepEqual(d?.tituloPartido, { arriba: "Potencia", abajo: "Hitachi" });
      assert.equal(d?.textoCircular, "Partequipos");
      assert.equal(d?.parrafo, "Texto");
      assert.ok(d?.enlace);
      const [n] = diapositivasDeHero({
        diapositivas: [
          {
            ...completa,
            mostrarTitulo: null,
            mostrarTextoCircular: null,
            mostrarDescripcion: null,
          },
        ],
      });
      assert.equal(n?.tituloVisible, true, "null no oculta nada");
      assert.ok(n?.textoCircular && n.parrafo && n.enlace);
    });

    it("las tres desmarcadas: queda el fondo (y la máquina); el título, solo para lectores", () => {
      const [d] = diapositivasDeHero({
        diapositivas: [
          {
            ...completa,
            mostrarTitulo: false,
            mostrarTextoCircular: false,
            mostrarDescripcion: false,
          },
        ],
      });
      assert.equal(d?.titulo, "Potencia Hitachi", "el título no se borra: nombra la diapositiva");
      assert.equal(d?.tituloVisible, false);
      assert.equal(d?.tituloPartido, null, "sin título visible no hay título partido");
      assert.equal(d?.textoCircular, null);
      assert.equal(d?.parrafo, null);
      assert.equal(d?.enlace, null, "el «+» es parte del recuadro");
      assert.equal(d?.frontal?.url, "https://x/2.jpg", "la máquina sigue");
      assert.equal(d?.fondo.url, "https://x/1.jpg");
    });

    it("cada casilla quita solo su pieza", () => {
      const una = (extra: object) =>
        diapositivasDeHero({ diapositivas: [{ ...completa, ...extra }] })[0]!;
      const sinCirculo = una({ mostrarTextoCircular: false });
      assert.equal(sinCirculo.textoCircular, null);
      assert.ok(sinCirculo.tituloVisible && sinCirculo.parrafo && sinCirculo.enlace);
      const sinRecuadro = una({ mostrarDescripcion: false });
      assert.equal(sinRecuadro.parrafo, null);
      assert.equal(sinRecuadro.enlace, null);
      assert.ok(sinRecuadro.tituloVisible && sinRecuadro.textoCircular);
      const sinTitulo = una({ mostrarTitulo: false });
      assert.equal(sinTitulo.tituloVisible, false);
      assert.ok(sinTitulo.textoCircular && sinTitulo.parrafo && sinTitulo.enlace);
    });
  });

  it("el recorte para móvil es opcional y decorativo", () => {
    const [sin] = diapositivasDeHero({ diapositivas: [{ titulo: "X", imagenFondo: media(1) }] });
    assert.equal(sin?.fondoMovil, null, "sin recorte: el móvil usa el fondo de escritorio");
    const [con] = diapositivasDeHero({
      diapositivas: [
        {
          titulo: "X",
          imagenFondo: media(1),
          imagenFondoMovil: media(3, { focalX: 60, focalY: 40 }),
        },
      ],
    });
    assert.equal(con?.fondoMovil?.url, "https://x/3.jpg");
    assert.equal(con?.fondoMovil?.alt, "", "decorativo, como el fondo");
    assert.equal(con?.fondoMovil?.posicion, "60% 40%");
    const [roto] = diapositivasDeHero({
      diapositivas: [{ titulo: "X", imagenFondo: media(1), imagenFondoMovil: 9 }],
    });
    assert.equal(roto?.fondoMovil, null, "imagen borrada (llega el id): como si no hubiera");
  });

  it("título en varias líneas: se pintan las líneas y se lee en una", () => {
    const [d] = diapositivasDeHero({
      diapositivas: [{ titulo: " Línea uno \n\n  Línea   dos ", imagenFondo: media(1) }],
    });
    assert.deepEqual(d?.tituloLineas, ["Línea uno", "Línea dos"]);
    assert.equal(d?.titulo, "Línea uno Línea dos");
  });

  it("título partido en escritorio: los dos trozos o ninguno", () => {
    const base = { titulo: "Uno. Dos. Tres.", imagenFondo: media(1) };
    const [con] = diapositivasDeHero({
      diapositivas: [{ ...base, tituloArriba: " Uno. Dos ", tituloAbajo: "Tres." }],
    });
    assert.deepEqual(con?.tituloPartido, { arriba: "Uno. Dos", abajo: "Tres." });
    const [solo] = diapositivasDeHero({ diapositivas: [{ ...base, tituloArriba: "Uno." }] });
    assert.equal(solo?.tituloPartido, null, "con un solo trozo, el título entero");
  });

  it("máquina debajo por defecto; texto circular opcional", () => {
    const [d] = diapositivasDeHero({ diapositivas: [{ titulo: "X", imagenFondo: media(1) }] });
    assert.equal(d?.posicionMaquina, "debajo");
    assert.equal(d?.textoCircular, null);
    const [s] = diapositivasDeHero({
      diapositivas: [
        {
          titulo: "X",
          imagenFondo: media(1),
          posicionMaquina: "sobre",
          textoCircular: " Uno. Dos. ",
        },
      ],
    });
    assert.equal(s?.posicionMaquina, "sobre");
    assert.equal(s?.textoCircular, "Uno. Dos.");
  });

  it("descarta la diapositiva sin fondo utilizable (p. ej. imagen borrada: llega el id)", () => {
    assert.deepEqual(diapositivasDeHero({ diapositivas: [{ titulo: "X", imagenFondo: 7 }] }), []);
  });

  it("sin nombre accesible o con destino inválido, no hay enlace", () => {
    const [a] = diapositivasDeHero({
      diapositivas: [{ titulo: "X", imagenFondo: media(1), enlace: "/a/" }],
    });
    const [b] = diapositivasDeHero({
      diapositivas: [
        { titulo: "X", imagenFondo: media(1), enlace: "javascript:alert(1)", enlaceNombre: "n" },
      ],
    });
    assert.equal(a?.enlace, null);
    assert.equal(b?.enlace, null);
  });

  it("sin hero, ninguna diapositiva", () => {
    assert.deepEqual(diapositivasDeHero(undefined), []);
    assert.deepEqual(diapositivasDeHero({ diapositivas: null }), []);
  });
});

describe("sizes del fondo del hero", () => {
  it("Fondo.jpg (2048×1360): el alto manda por debajo de 1,30:1", () => {
    assert.equal(sizesFondoHero(2048, 1360), "(max-aspect-ratio: 130/100) 130vh, 100vw");
  });

  it("una foto más panorámica necesita más ancho en vertical", () => {
    assert.equal(sizesFondoHero(1920, 800), "(max-aspect-ratio: 207/100) 207vh, 100vw");
  });

  it("sin dimensiones, 100vw como antes", () => {
    assert.equal(sizesFondoHero(0, 800), "100vw");
    assert.equal(sizesFondoHero(Number.NaN, 800), "100vw");
  });
});
