import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type Contexto,
  analizarPagina,
  conBarra,
  enlacesInternos,
  enlacesRotos,
  extraerJsonLd,
  tipoJsonLdEsperado,
} from "./analizar";

const BASE = "https://partequipos.com/";

const ctx = (extra: Partial<Contexto> = {}): Contexto => ({
  base: BASE,
  enSitemap: new Set(["/prueba/"]),
  rutasVivas: new Set(["/prueba/", "/otra/"]),
  ...extra,
});

/** HTML mínimo que pasa todos los criterios; cada prueba rompe uno. */
function paginaValida(extra = ""): string {
  return `<!doctype html><html lang="es"><head>
    <title>Título de prueba</title>
    <meta name="description" content="Una descripción suficiente para la prueba."/>
    <link rel="canonical" href="${BASE}prueba/"/>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"}</script>
    </head><body><main><h1>Único</h1>${extra}</main></body></html>`;
}

const analizar = (html: string, ruta = "/prueba/", estado = 200) =>
  analizarPagina({ ruta, estado, html }, ctx());

const criterios = (html: string, ruta?: string) => analizar(html, ruta).map((x) => x.criterio);

describe("analizarPagina — página correcta", () => {
  it("no encuentra nada que reprochar", () => {
    assert.deepEqual(analizar(paginaValida()), []);
  });
});

describe("analizarPagina — h1", () => {
  it("detecta que no hay ninguno", () => {
    const html = paginaValida().replace("<h1>Único</h1>", "");
    assert.ok(criterios(html).includes("h1"));
  });

  it("detecta que hay más de uno", () => {
    const html = paginaValida("<h1>Segundo</h1>");
    const e = analizar(html).find((x) => x.criterio === "h1");
    assert.match(e?.detalle ?? "", /hay 2/);
  });
});

describe("analizarPagina — metadatos", () => {
  it("exige title", () => {
    assert.ok(
      criterios(paginaValida().replace("<title>Título de prueba</title>", "")).includes("title"),
    );
  });

  it("exige meta description", () => {
    const html = paginaValida().replace(/<meta name="description"[^>]*>/, "");
    assert.ok(criterios(html).includes("meta-description"));
  });

  it("exige canonical", () => {
    const html = paginaValida().replace(/<link rel="canonical"[^>]*>/, "");
    assert.ok(criterios(html).includes("canonical"));
  });

  it("detecta un canonical que apunta a otra URL", () => {
    const html = paginaValida().replace(`${BASE}prueba/`, `${BASE}otra-cosa/`);
    const e = analizar(html).find((x) => x.criterio === "canonical");
    assert.match(e?.detalle ?? "", /se esperaba/);
  });
});

describe("analizarPagina — JSON-LD", () => {
  it("detecta un bloque que no parsea", () => {
    const html = paginaValida().replace(
      '{"@context":"https://schema.org","@type":"BreadcrumbList"}',
      "{esto no es json}",
    );
    assert.ok(criterios(html).includes("json-ld"));
  });

  it("exige el tipo esperado para la ruta", () => {
    const html = paginaValida().replace('"BreadcrumbList"', '"WebSite"');
    const e = analizar(html).find((x) => x.criterio === "json-ld");
    assert.match(e?.detalle ?? "", /BreadcrumbList/);
  });

  it("acepta un array de bloques", () => {
    const { ok } = extraerJsonLd(
      '<script type="application/ld+json">[{"@type":"A"},{"@type":"B"}]</script>',
    );
    assert.equal(ok.length, 2);
  });
});

describe("tipoJsonLdEsperado", () => {
  it("Product en la ficha de repuesto", () => {
    assert.equal(tipoJsonLdEsperado("/repuestos-maquinaria-pesada-colombia/a/b/c/d/"), "Product");
  });

  it("Product en la ficha de equipo nuevo", () => {
    assert.equal(tipoJsonLdEsperado("/maquinaria-pesada/a/b/c/d/e/"), "Product");
  });

  it("la portada no exige ninguno", () => {
    assert.equal(tipoJsonLdEsperado("/"), null);
  });

  it("el resto exige BreadcrumbList", () => {
    assert.equal(tipoJsonLdEsperado("/noticias/"), "BreadcrumbList");
  });
});

describe("analizarPagina — imágenes y accesibilidad", () => {
  it("detecta una imagen sin alt", () => {
    assert.ok(criterios(paginaValida('<img src="/x.png" width="1" height="1">')).includes("alt"));
  });

  it("acepta alt vacío: es la forma de marcar una imagen decorativa", () => {
    const c = criterios(paginaValida('<img src="/x.png" alt="" width="1" height="1">'));
    assert.equal(c.includes("alt"), false);
  });

  it("avisa si falta width/height", () => {
    assert.ok(criterios(paginaValida('<img src="/x.png" alt="x">')).includes("dimensiones"));
  });

  it("exige lang en el html", () => {
    assert.ok(criterios(paginaValida().replace('<html lang="es">', "<html>")).includes("lang"));
  });

  it("exige un landmark main", () => {
    const html = paginaValida().replace("<main>", "<div>").replace("</main>", "</div>");
    assert.ok(criterios(html).includes("landmark"));
  });

  it("avisa de un salto de nivel de encabezado", () => {
    assert.ok(criterios(paginaValida("<h3>Salto</h3>")).includes("encabezados"));
  });

  it("no avisa cuando los niveles bajan de forma ordenada", () => {
    const c = criterios(paginaValida("<h2>Dos</h2><h3>Tres</h3><h2>Otro dos</h2>"));
    assert.equal(c.includes("encabezados"), false);
  });
});

describe("analizarPagina — estado y sitemap", () => {
  it("con estado distinto de 200 solo reporta eso", () => {
    const r = analizarPagina({ ruta: "/x/", estado: 404, html: "" }, ctx());
    assert.deepEqual(
      r.map((x) => x.criterio),
      ["http"],
    );
  });

  it("avisa si una URL viva no está en el sitemap", () => {
    const r = analizarPagina({ ruta: "/fuera/", estado: 200, html: paginaValida() }, ctx());
    assert.ok(r.some((x) => x.criterio === "sitemap"));
  });
});

describe("enlaces internos", () => {
  it("recoge relativos y absolutos del propio dominio", () => {
    const html = `<a href="/a/">a</a><a href="${BASE}b/">b</a>`;
    assert.deepEqual(enlacesInternos(html, BASE).sort(), ["/a/", "/b/"]);
  });

  it("ignora externos, anclas, mailto y tel", () => {
    const html = `<a href="https://otro.com/x">x</a><a href="#y">y</a>
                  <a href="mailto:a@b.c">m</a><a href="tel:+57">t</a>`;
    assert.deepEqual(enlacesInternos(html, BASE), []);
  });

  it("normaliza la barra final", () => {
    assert.deepEqual(enlacesInternos('<a href="/sin-barra">x</a>', BASE), ["/sin-barra/"]);
  });

  it("detecta un enlace a una ruta que no responde", () => {
    const r = enlacesRotos(
      { ruta: "/prueba/", estado: 200, html: '<a href="/inventada/">x</a>' },
      ctx(),
    );
    assert.equal(r.length, 1);
    assert.match(r[0]?.detalle ?? "", /\/inventada\//);
  });

  it("no marca como roto un enlace a una ruta viva", () => {
    const r = enlacesRotos(
      { ruta: "/prueba/", estado: 200, html: '<a href="/otra/">x</a>' },
      ctx(),
    );
    assert.deepEqual(r, []);
  });
});

describe("conBarra", () => {
  it("normaliza los casos habituales", () => {
    assert.equal(conBarra(""), "/");
    assert.equal(conBarra("/"), "/");
    assert.equal(conBarra("/a"), "/a/");
    assert.equal(conBarra("/a/"), "/a/");
    assert.equal(conBarra("/a?b=1"), "/a/");
    assert.equal(conBarra("/a#x"), "/a/");
  });
});
