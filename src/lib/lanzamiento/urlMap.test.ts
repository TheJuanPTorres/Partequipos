import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  bloquea,
  clasificar,
  normalizarRuta,
  parsearCsv,
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

  it("con los ficheros reales: 648 rutas, 10 redirects, 14 pendientes y 6 basura", () => {
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
    assert.equal(mapa.size, 648);
    assert.equal(cuenta("redirect"), 10);
    assert.equal(cuenta("pendiente"), 14);
    assert.equal(cuenta("basura"), 6);
    assert.equal(cuenta("conservada"), 618);
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
    assert.equal(
      veredicto("/gracias/", redirect, [
        { estado: 301, location: "https://nuevo.example/contactanos/" },
        { estado: 200 },
      ]),
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
