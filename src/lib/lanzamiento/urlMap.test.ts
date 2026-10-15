import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  bloquea,
  clasificar,
  normalizarRuta,
  parsearCsv,
  rutasAComprobar,
  unirRedirects,
  veredicto,
  type Esperado,
} from "./urlMap";

const conservada: Esperado = { tipo: "conservada" };
const redirect: Esperado = { hacia: "/contactanos/", tipo: "redirect" };

describe("normalizarRuta", () => {
  it("quita host y query y pone la barra final", () => {
    assert.equal(normalizarRuta("https://partequipos.com/gracias?x=1"), "/gracias/");
    assert.equal(normalizarRuta("/contactanos/"), "/contactanos/");
    assert.equal(normalizarRuta("https://partequipos.com/"), "/");
  });

  it("conserva el origen de una URL de otro sitio, salvo el dominio comprobado", () => {
    assert.equal(
      normalizarRuta("https://partequipos.buk.co/trabaja-con-nosotros"),
      "https://partequipos.buk.co/trabaja-con-nosotros/",
    );
    assert.equal(
      normalizarRuta(
        "https://partequipos.vercel.app/contactanos",
        "https://partequipos.vercel.app",
      ),
      "/contactanos/",
    );
    assert.equal(
      normalizarRuta("/lubricantes/lubricantes-eni#engranajes"),
      "/lubricantes/lubricantes-eni/",
    );
  });
});

describe("parsearCsv", () => {
  it("respeta comas y comillas dobles dentro de un campo", () => {
    const filas = parsearCsv('"a","b"\n"x, y","di ""hola"""\r\n');
    assert.deepEqual(filas, [{ a: "x, y", b: 'di "hola"' }]);
  });
});

describe("clasificar", () => {
  it("separa conservadas, redirects, pendientes y basura", () => {
    const mapa = clasificar(
      [
        "https://partequipos.com/",
        "https://partequipos.com/gracias/",
        "https://partequipos.com/openhouse/",
        "https://partequipos.com/inicio2025/",
      ],
      [{ desde: "/gracias/", hacia: "/contactanos/" }],
    );
    assert.deepEqual(mapa.get("/"), { tipo: "conservada" });
    assert.deepEqual(mapa.get("/gracias/"), { hacia: "/contactanos/", tipo: "redirect" });
    assert.deepEqual(mapa.get("/openhouse/"), { tipo: "pendiente" });
    assert.deepEqual(mapa.get("/inicio2025/"), { tipo: "basura" });
  });

  // 650 desde el 2026-10-06: las 648 del rastreo más 2 entradas del blog
  // publicadas después (docs/crawl-reporte.md, «Añadidas después del rastreo»).
  it("con los ficheros reales: 650 rutas, 10 redirects, 14 pendientes y 6 basura", () => {
    const raiz = process.cwd();
    const urls = parsearCsv(fs.readFileSync(path.join(raiz, "docs/url-map.csv"), "utf8")).map(
      (f) => f.url ?? "",
    );
    const redirects = parsearCsv(
      fs.readFileSync(path.join(raiz, "scripts/import/data/redirects.csv"), "utf8"),
    ).map((f) => ({ desde: f.desde ?? "", hacia: f.hacia ?? "" }));
    const mapa = clasificar(urls, redirects);
    const cuenta = (tipo: Esperado["tipo"]) =>
      [...mapa.values()].filter((e) => e.tipo === tipo).length;
    assert.equal(mapa.size, 650);
    assert.equal(cuenta("redirect"), 10);
    assert.equal(cuenta("pendiente"), 14);
    assert.equal(cuenta("basura"), 6);
    assert.equal(cuenta("conservada"), 620);
  });
});

describe("unirRedirects", () => {
  it("suma los de la base a los del fichero, sin duplicar los que coinciden", () => {
    const { conflictos, redirects } = unirRedirects(
      [{ desde: "/gracias/", hacia: "/contactanos/" }],
      [
        // En la base se guardan sin barra final.
        { desde: "/gracias", hacia: "/contactanos" },
        { desde: "/excavadoras", hacia: "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras" },
      ],
    );
    assert.deepEqual(conflictos, []);
    assert.equal(redirects.length, 2);
  });

  it("un destino distinto para el mismo origen es un conflicto", () => {
    const { conflictos } = unirRedirects(
      [{ desde: "/gracias/", hacia: "/contactanos/" }],
      [{ desde: "/gracias", hacia: "/" }],
    );
    assert.deepEqual(conflictos, [{ desde: "/gracias/", enBase: "/", enFichero: "/contactanos/" }]);
  });

  it("el ancla del destino no cuenta como diferencia", () => {
    const { conflictos } = unirRedirects(
      [
        {
          desde: "/lubricantes/lubricantes-eni/engranajes/",
          hacia: "/lubricantes/lubricantes-eni/",
        },
      ],
      [
        {
          desde: "/lubricantes/lubricantes-eni/engranajes",
          hacia: "/lubricantes/lubricantes-eni#engranajes",
        },
      ],
    );
    assert.deepEqual(conflictos, []);
  });
});

describe("clasificar con los redirects de la base", () => {
  // El fallo de antes: un 301 creado por un importador (no está en
  // redirects.csv) sobre una URL de url-map se esperaba «conservada» y su 301
  // salía como «redirect-inesperado», que bloquea.
  const urls = ["https://partequipos.com/repuestos-viejo/", "https://partequipos.com/nosotros/"];
  const base = [
    { desde: "/repuestos-viejo", hacia: "/repuestos-nuevo" },
    { desde: "/solo-en-la-base", hacia: "/contactanos" },
  ];
  const saltos = [{ estado: 301, location: "/repuestos-nuevo/" }, { estado: 200 }];

  it("sin la base, ese 301 bloquea (el comportamiento que se corrige)", () => {
    const mapa = clasificar(urls, []);
    const esperado = mapa.get("/repuestos-viejo/");
    assert.ok(esperado);
    assert.equal(veredicto("/repuestos-viejo/", esperado, saltos), "redirect-inesperado");
    assert.equal(bloquea(esperado, "redirect-inesperado"), true);
  });

  it("con la base, el mismo 301 es ok", () => {
    const { redirects } = unirRedirects([], base);
    const mapa = clasificar(rutasAComprobar(urls, redirects), redirects);
    const esperado = mapa.get("/repuestos-viejo/");
    assert.ok(esperado);
    assert.equal(veredicto("/repuestos-viejo/", esperado, saltos), "ok");
  });

  it("los redirects que solo están en la base también se recorren", () => {
    const { redirects } = unirRedirects([], base);
    const mapa = clasificar(rutasAComprobar(urls, redirects), redirects);
    assert.deepEqual(mapa.get("/solo-en-la-base/"), { hacia: "/contactanos/", tipo: "redirect" });
    assert.equal(mapa.size, 3);
  });

  it("y siguen fallando si su destino da 404", () => {
    const { redirects } = unirRedirects([], base);
    const mapa = clasificar(rutasAComprobar(urls, redirects), redirects);
    const esperado = mapa.get("/solo-en-la-base/");
    assert.ok(esperado);
    const v = veredicto("/solo-en-la-base/", esperado, [
      { estado: 301, location: "/contactanos/" },
      { estado: 404 },
    ]);
    assert.equal(v, "no-encontrada");
    assert.equal(bloquea(esperado, v), true);
  });
});

describe("redirect a otro sitio", () => {
  const esperado: Esperado = {
    hacia: normalizarRuta("https://partequipos.buk.co/trabaja-con-nosotros"),
    tipo: "redirect",
  };

  it("ok si llega a ese sitio y da 200", () => {
    const v = veredicto("/nosotros/trabaja-con-nosotros/", esperado, [
      { estado: 301, location: "https://partequipos.buk.co/trabaja-con-nosotros" },
      { estado: 200 },
    ]);
    assert.equal(v, "ok");
  });

  it("destino equivocado si va a una ruta propia que se llama igual", () => {
    const v = veredicto("/nosotros/trabaja-con-nosotros/", esperado, [
      { estado: 301, location: "/trabaja-con-nosotros/" },
      { estado: 200 },
    ]);
    assert.equal(v, "destino-equivocado");
  });
});

describe("veredicto", () => {
  it("conservada en 200 directo: ok", () => {
    assert.equal(veredicto("/", conservada, [{ estado: 200 }]), "ok");
  });

  it("conservada que solo añade la barra final con 308: ok", () => {
    assert.equal(
      veredicto("/nosotros", conservada, [
        { estado: 308, location: "/nosotros/" },
        { estado: 200 },
      ]),
      "ok",
    );
  });

  it("redirect cargado: 301 a su destino y 200", () => {
    // `location` absoluta con el dominio que se comprueba.
    assert.equal(
      veredicto(
        "/gracias/",
        redirect,
        [{ estado: 301, location: "https://nuevo.example/contactanos/" }, { estado: 200 }],
        undefined,
        "https://nuevo.example",
      ),
      "ok",
    );
  });

  // Las comprobaciones de que FALLA cuando debe.
  it("conservada en 404: no-encontrada, y bloquea", () => {
    const v = veredicto("/x/", conservada, [{ estado: 404 }]);
    assert.equal(v, "no-encontrada");
    assert.equal(bloquea(conservada, v), true);
  });

  it("un 302 en la cadena: redirect-temporal", () => {
    assert.equal(
      veredicto("/gracias/", redirect, [
        { estado: 302, location: "/contactanos/" },
        { estado: 200 },
      ]),
      "redirect-temporal",
    );
  });

  it("redirect que llega a otro destino: destino-equivocado", () => {
    assert.equal(
      veredicto("/gracias/", redirect, [{ estado: 301, location: "/" }, { estado: 200 }]),
      "destino-equivocado",
    );
  });

  it("redirect cargado que responde 200 sin saltar: sin-redirect", () => {
    assert.equal(veredicto("/gracias/", redirect, [{ estado: 200 }]), "sin-redirect");
  });

  it("conservada que redirige a otra ruta: redirect-inesperado", () => {
    assert.equal(
      veredicto("/a/", conservada, [{ estado: 301, location: "/b/" }, { estado: 200 }]),
      "redirect-inesperado",
    );
  });

  it("bucle entre dos rutas", () => {
    assert.equal(
      veredicto("/a/", conservada, [
        { estado: 301, location: "/b/" },
        { estado: 301, location: "/a/" },
      ]),
      "bucle",
    );
  });

  it("cadena cortada sin llegar a una respuesta final: demasiados-saltos", () => {
    assert.equal(
      veredicto("/a/", conservada, [
        { estado: 301, location: "/b/" },
        { estado: 301, location: "/c/" },
      ]),
      "demasiados-saltos",
    );
  });

  it("500 y fallo de red", () => {
    assert.equal(veredicto("/", conservada, [{ estado: 500 }]), "error-servidor");
    assert.equal(veredicto("/", conservada, [], "ECONNRESET"), "error-red");
  });

  it("pendientes y basura en 404 no bloquean", () => {
    assert.equal(bloquea({ tipo: "pendiente" }, "no-encontrada"), false);
    assert.equal(bloquea({ tipo: "basura" }, "no-encontrada"), false);
  });
});
