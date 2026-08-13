import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { PATRONES_SITEMAP, buildSitemapEntries } from "./sitemap";

process.env.NEXT_PUBLIC_SERVER_URL = "https://partequipos.com";

const AHORA = new Date("2026-07-28T00:00:00.000Z");

/**
 * Recorre `src/app/(site)` y devuelve la ruta pública de cada `page.tsx`.
 *
 * Los grupos de rutas —carpetas entre paréntesis— no aparecen en la URL, así que
 * se descartan. Los segmentos dinámicos (`[marca]`, `[...slug]`) se conservan
 * tal cual para comparar patrones, no URLs concretas.
 */
function rutasConstruidas(): string[] {
  const raizApp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app/(site)");

  const encontradas: string[] = [];

  const recorrer = (dir: string, segmentos: string[]) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entrada.isDirectory()) {
        const esGrupo = entrada.name.startsWith("(") && entrada.name.endsWith(")");
        recorrer(path.join(dir, entrada.name), esGrupo ? segmentos : [...segmentos, entrada.name]);
      } else if (entrada.name === "page.tsx") {
        encontradas.push(segmentos.length === 0 ? "/" : `/${segmentos.join("/")}`);
      }
    }
  };

  recorrer(raizApp, []);
  return encontradas.sort();
}

/**
 * Secciones sin datos. Se reutiliza en los casos que solo miran repuestos, para
 * que añadir una sección nueva no obligue a tocar cada prueba.
 */
const SIN_MAQUINARIA = {
  marcasMaquinaria: [],
  tiposMaquinaria: [],
  equiposNuevos: [],
  categoriasNueva: [],
  categoriasUsada: [],
  marcasLubricante: [],
  categoriasLubricante: [],
  articulos: [],
  categoriasBlog: [],
};

const datos = {
  paginas: [
    { slug: "inicio", updatedAt: "2026-07-28T10:00:00.000Z" },
    { slug: "nosotros", updatedAt: "2026-07-27T10:00:00.000Z" },
  ],
  marcas: [{ slug: "marca-a", updatedAt: "2026-07-20T10:00:00.000Z" }],
  tipos: [{ slug: "tipo-a", updatedAt: "2026-07-22T10:00:00.000Z", marcaSlug: "marca-a" }],
  modelos: [
    {
      slug: "modelo-a",
      updatedAt: "2026-07-25T10:00:00.000Z",
      marcaSlug: "marca-a",
      tipoSlug: "tipo-a",
    },
  ],
  ...SIN_MAQUINARIA,
};

const datosConMaquinaria = {
  ...datos,
  marcasMaquinaria: [{ slug: "marca-m", updatedAt: "2026-07-21T10:00:00.000Z" }],
  tiposMaquinaria: [
    { slug: "tipo-m", updatedAt: "2026-07-23T10:00:00.000Z", marcaSlug: "marca-m" },
  ],
  equiposNuevos: [
    {
      slug: "equipo-m",
      updatedAt: "2026-07-24T10:00:00.000Z",
      marcaSlug: "marca-m",
      tipoSlug: "tipo-m",
    },
  ],
  categoriasNueva: [{ slug: "categoria-n", updatedAt: "2026-07-19T10:00:00.000Z" }],
  categoriasUsada: [{ slug: "categoria-u", updatedAt: "2026-07-18T10:00:00.000Z" }],
};

describe("buildSitemapEntries", () => {
  it("incluye portada, índices y una entrada por entidad", () => {
    const e = buildSitemapEntries(datos, AHORA);
    // 1 portada + 2 índices de repuestos + 4 índices de maquinaria
    // + 1 índice de blog + 1 institucional + 1 marca + 1 tipo + 1 modelo
    assert.equal(e.length, 12);
  });

  it("emite solo URLs absolutas", () => {
    for (const entrada of buildSitemapEntries(datos, AHORA)) {
      assert.match(entrada.url, /^https:\/\/partequipos\.com\//);
    }
  });

  it("construye la jerarquía completa en la URL del modelo", () => {
    const e = buildSitemapEntries(datos, AHORA);
    const modelo = e.find((x) => x.url.endsWith("/modelo-a/"));

    assert.ok(modelo);
    assert.ok(modelo.url.includes("/marca-a/tipo-a/modelo-a/"));
  });

  it("toma lastModified del updatedAt real de cada entidad", () => {
    const e = buildSitemapEntries(datos, AHORA);

    const marca = e.find((x) => x.url.endsWith("/marca-a/"));
    assert.equal(marca?.lastModified.toISOString(), "2026-07-20T10:00:00.000Z");

    const modelo = e.find((x) => x.url.endsWith("/modelo-a/"));
    assert.equal(modelo?.lastModified.toISOString(), "2026-07-25T10:00:00.000Z");
  });

  it("los índices usan la fecha más reciente de lo que listan", () => {
    const e = buildSitemapEntries(
      {
        ...datos,
        marcas: [
          { slug: "m1", updatedAt: "2026-07-01T00:00:00.000Z" },
          { slug: "m2", updatedAt: "2026-07-26T00:00:00.000Z" },
        ],
      },
      AHORA,
    );

    // e[0] es la portada; los índices de catálogo van detrás.
    const indice = e.find((x) => x.url.endsWith("/repuestos-maquinaria-pesada-colombia/"));
    assert.equal(indice?.lastModified.toISOString(), "2026-07-26T00:00:00.000Z");
  });

  it("cae a la fecha actual si updatedAt falta o es inválido", () => {
    const e = buildSitemapEntries(
      {
        marcas: [{ slug: "m", updatedAt: null }],
        tipos: [],
        modelos: [],
        paginas: [],
        ...SIN_MAQUINARIA,
      },
      AHORA,
    );
    const marca = e.find((x) => x.url.endsWith("/m/"));
    assert.equal(marca?.lastModified.getTime(), AHORA.getTime());

    const invalida = buildSitemapEntries(
      {
        marcas: [{ slug: "m", updatedAt: "no-es-fecha" }],
        tipos: [],
        modelos: [],
        paginas: [],
        ...SIN_MAQUINARIA,
      },
      AHORA,
    );
    assert.equal(
      invalida.find((x) => x.url.endsWith("/m/"))?.lastModified.getTime(),
      AHORA.getTime(),
    );
  });

  it("con base vacía devuelve solo los índices, sin romperse", () => {
    const e = buildSitemapEntries(
      { marcas: [], tipos: [], modelos: [], paginas: [], ...SIN_MAQUINARIA },
      AHORA,
    );

    // Sin documento de portada no se lista `/`: quedan los 2 índices de
    // repuestos, los 4 de maquinaria y el del blog, que son rutas estáticas y
    // existen aunque no haya contenido.
    assert.equal(e.length, 7);
    assert.equal(e[0]?.lastModified.getTime(), AHORA.getTime());
    for (const entrada of e) assert.match(entrada.url, /^https:\/\//);
  });

  it("no genera URLs duplicadas", () => {
    const e = buildSitemapEntries(datos, AHORA);
    assert.equal(new Set(e.map((x) => x.url)).size, e.length);
  });

  it("da más prioridad a los índices que a las fichas", () => {
    const e = buildSitemapEntries(datos, AHORA);
    const indice = e.find((x) => x.url.endsWith("/repuestos-maquinaria-pesada-colombia/"));
    const modelo = e.find((x) => x.url.endsWith("/modelo-a/"));

    assert.ok(indice && modelo);
    assert.ok(indice.priority > modelo.priority);
  });
});

describe("cobertura del sitemap frente a las rutas construidas", () => {
  it("no hay ninguna ruta pública fuera de PATRONES_SITEMAP", () => {
    const construidas = rutasConstruidas();
    const cubiertas = new Set<string>(PATRONES_SITEMAP);
    const sinCubrir = construidas.filter((r) => !cubiertas.has(r));

    assert.deepEqual(
      sinCubrir,
      [],
      `Rutas construidas que NO están en el sitemap:\n  ${sinCubrir.join("\n  ")}\n\n` +
        "Añádelas a PATRONES_SITEMAP y emite sus URLs en buildSitemapEntries " +
        "(src/lib/seo/sitemap.ts).",
    );
  });

  it("no se declaran patrones que ya no existen en la aplicación", () => {
    const construidas = new Set(rutasConstruidas());
    const sobrantes = PATRONES_SITEMAP.filter((p) => !construidas.has(p));

    assert.deepEqual(
      sobrantes,
      [],
      `Patrones declarados sin ruta que los respalde:\n  ${sobrantes.join("\n  ")}`,
    );
  });

  it("detecta una ruta nueva sin declarar (comprobación del propio guardián)", () => {
    // Sección inventada a propósito: si algún día existe, hay que cambiarla aquí.
    const inventada = "/seccion-inventada-para-la-prueba";
    const construidas = [...rutasConstruidas(), inventada];
    const cubiertas = new Set<string>(PATRONES_SITEMAP);

    assert.deepEqual(
      construidas.filter((r) => !cubiertas.has(r)),
      [inventada],
    );
  });
});

describe("maquinaria en el sitemap", () => {
  it("emite los cuatro índices más una URL por entidad", () => {
    const urls = buildSitemapEntries(datosConMaquinaria, AHORA).map((x) => x.url);
    const base = "https://partequipos.com/maquinaria-pesada";

    for (const esperada of [
      `${base}/`,
      `${base}/maquinaria-pesada-nueva/`,
      `${base}/maquinaria-pesada-nueva/marcas/`,
      `${base}/maquinaria-pesada-nueva/categoria-n/`,
      `${base}/maquinaria-pesada-nueva/marcas/marca-m/`,
      `${base}/maquinaria-pesada-nueva/marcas/marca-m/tipo-m/`,
      `${base}/maquinaria-pesada-nueva/marcas/marca-m/tipo-m/equipo-m/`,
      `${base}/maquinaria-pesada-usada/`,
      `${base}/maquinaria-pesada-usada/categoria-u/`,
    ]) {
      assert.ok(urls.includes(esperada), `falta ${esperada}`);
    }
  });

  it("no colisiona con las URLs de repuestos ni duplica", () => {
    const e = buildSitemapEntries(datosConMaquinaria, AHORA);
    assert.equal(new Set(e.map((x) => x.url)).size, e.length);
  });

  it("toma lastModified del updatedAt real del equipo", () => {
    const e = buildSitemapEntries(datosConMaquinaria, AHORA);
    const equipo = e.find((x) => x.url.endsWith("/equipo-m/"));
    assert.equal(equipo?.lastModified.toISOString(), "2026-07-24T10:00:00.000Z");
  });
});

describe("lubricantes en el sitemap", () => {
  const datosConLubricantes = {
    ...datos,
    marcasLubricante: [{ slug: "lubricantes-eni", updatedAt: "2026-07-17T10:00:00.000Z" }],
    categoriasLubricante: [
      {
        slug: "auto-liviano",
        updatedAt: "2026-07-16T10:00:00.000Z",
        marcaSlug: "lubricantes-eni",
      },
    ],
  };

  it("emite la marca y su categoría", () => {
    const urls = buildSitemapEntries(datosConLubricantes, AHORA).map((x) => x.url);

    assert.ok(urls.includes("https://partequipos.com/lubricantes/lubricantes-eni/"));
    assert.ok(
      urls.includes("https://partequipos.com/lubricantes/lubricantes-eni/auto-liviano/"),
      "falta la categoría",
    );
  });

  it("NO emite un índice en /lubricantes/, que no existe en el sitio", () => {
    const urls = buildSitemapEntries(datosConLubricantes, AHORA).map((x) => x.url);
    assert.equal(urls.includes("https://partequipos.com/lubricantes/"), false);
  });

  it("omite la categoría si su marca no se pudo resolver", () => {
    // `categoriasLubricante` exige `marcaSlug`; sin marca la ruta del sitemap
    // saldría rota, así que la fuente (sitemap.ts) filtra antes de llegar aquí.
    const urls = buildSitemapEntries(
      { ...datosConLubricantes, categoriasLubricante: [] },
      AHORA,
    ).map((x) => x.url);

    assert.equal(
      urls.some((u) => u.includes("/auto-liviano/")),
      false,
    );
  });

  it("toma lastModified del updatedAt real", () => {
    const e = buildSitemapEntries(datosConLubricantes, AHORA);
    assert.equal(
      e.find((x) => x.url.endsWith("/lubricantes-eni/"))?.lastModified.toISOString(),
      "2026-07-17T10:00:00.000Z",
    );
  });
});

describe("blog en el sitemap", () => {
  const datosConBlog = {
    ...datos,
    articulos: [
      { slug: "usas-la-grasa-correcta", updatedAt: "2026-07-15T10:00:00.000Z" },
      {
        // Slug largo heredado: se respeta tal cual, no se acorta.
        slug: "variables-que-afectan-la-vida-util-del-tren-de-rodaje-en-excavadoras-y-bulldozer-en-la-maquinaria-pesada-en-colombia",
        updatedAt: "2026-07-14T10:00:00.000Z",
      },
    ],
    categoriasBlog: [{ slug: "noticias", updatedAt: "2026-07-13T10:00:00.000Z" }],
  };

  it("emite los artículos en la RAÍZ, sin prefijo de sección", () => {
    const urls = buildSitemapEntries(datosConBlog, AHORA).map((x) => x.url);

    assert.ok(urls.includes("https://partequipos.com/usas-la-grasa-correcta/"));
    // Ni /blog/ ni /noticias/ delante: los artículos cuelgan de la raíz.
    assert.equal(
      urls.some((u) => u.includes("/noticias/usas-la-grasa-correcta")),
      false,
    );
  });

  it("respeta los slugs largos heredados", () => {
    const urls = buildSitemapEntries(datosConBlog, AHORA).map((x) => x.url);
    assert.ok(
      urls.includes(
        "https://partequipos.com/variables-que-afectan-la-vida-util-del-tren-de-rodaje-en-excavadoras-y-bulldozer-en-la-maquinaria-pesada-en-colombia/",
      ),
    );
  });

  it("emite el índice y el archivo de categoría", () => {
    const urls = buildSitemapEntries(datosConBlog, AHORA).map((x) => x.url);
    assert.ok(urls.includes("https://partequipos.com/noticias/"));
    assert.ok(urls.includes("https://partequipos.com/category/noticias/"));
  });

  it("NO emite /blog-partequipos/: su destino está pendiente de decisión", () => {
    const urls = buildSitemapEntries(datosConBlog, AHORA).map((x) => x.url);
    assert.equal(
      urls.some((u) => u.includes("blog-partequipos")),
      false,
    );
  });

  it("el índice toma la fecha del artículo más reciente", () => {
    const e = buildSitemapEntries(datosConBlog, AHORA);
    assert.equal(
      e.find((x) => x.url === "https://partequipos.com/noticias/")?.lastModified.toISOString(),
      "2026-07-15T10:00:00.000Z",
    );
  });

  it("no colisiona con las páginas institucionales ni duplica", () => {
    const e = buildSitemapEntries(datosConBlog, AHORA);
    assert.equal(new Set(e.map((x) => x.url)).size, e.length);
  });
});

describe("páginas institucionales en el sitemap", () => {
  it("incluye la portada en / y las institucionales por su slug", () => {
    const e = buildSitemapEntries(datos, AHORA);
    const urls = e.map((x) => x.url);

    assert.ok(urls.includes("https://partequipos.com/"), "falta la portada");
    assert.ok(urls.includes("https://partequipos.com/nosotros/"), "falta /nosotros/");
    assert.equal(
      urls.some((u) => u.includes("/inicio")),
      false,
      "el slug 'inicio' no debe aparecer como URL propia",
    );
  });

  it("toma lastModified del updatedAt real de cada página", () => {
    const e = buildSitemapEntries(datos, AHORA);

    assert.equal(
      e.find((x) => x.url === "https://partequipos.com/")?.lastModified.toISOString(),
      "2026-07-28T10:00:00.000Z",
    );
    assert.equal(
      e.find((x) => x.url === "https://partequipos.com/nosotros/")?.lastModified.toISOString(),
      "2026-07-27T10:00:00.000Z",
    );
  });

  it("omite la portada si no existe su documento (la ruta daría 404)", () => {
    const e = buildSitemapEntries({ ...datos, paginas: [] }, AHORA);
    assert.equal(
      e.some((x) => x.url === "https://partequipos.com/"),
      false,
    );
  });
});
