import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolverListado } from "../filtros";
import {
  buscarEnArticulos,
  CATALOGO_BLOG,
  extracto,
  leerBusqueda,
  minutosDeLectura,
  normalizar,
  POR_PAGINA_BLOG,
  type ArticuloLista,
} from "./indice";
import {
  articulosRelacionados,
  categoriaRelacionada,
  entradillaRepiteCuerpo,
  textoEnlaceRelacionada,
} from "./relacionada";
import { idsUnicos, slugDeTitulo, titulosDeLexical } from "./titulos";

/** Aserciones con la forma de siempre, sobre `node:assert`. */
function expect<T>(real: T) {
  const base = {
    toBe: (esperado: unknown) => assert.equal(real, esperado),
    toEqual: (esperado: unknown) => assert.deepEqual(real, esperado),
    toHaveLength: (n: number) => assert.equal((real as { length: number }).length, n),
    toContain: (x: unknown) => assert.ok((real as unknown[]).includes(x)),
    toBeNull: () => assert.equal(real, null),
    toMatch: (re: RegExp) => assert.match(String(real), re),
    toBeLessThanOrEqual: (n: number) => assert.ok((real as number) <= n),
  };
  return {
    ...base,
    not: {
      toContain: (x: unknown) => assert.ok(!(real as unknown[]).includes(x)),
      toMatch: (re: RegExp) => assert.doesNotMatch(String(real), re),
    },
  };
}

function articulo(n: number, extra: Partial<ArticuloLista> = {}): ArticuloLista {
  const titulo = extra.titulo ?? `Artículo ${n}`;
  return {
    id: n,
    slug: `articulo-${n}`,
    titulo,
    fecha: `2026-09-${String(10 + (n % 15)).padStart(2, "0")}T00:00:00.000Z`,
    extracto: "",
    imagen: null,
    categoria: { slug: "noticias", nombre: "Noticias" },
    indice: normalizar(titulo),
    minutos: 3,
    ...extra,
  };
}

describe("extracto", () => {
  it("deja intacto un texto corto", () => {
    expect(extracto("Un texto breve.", 100)).toBe("Un texto breve.");
  });

  it("corta en una palabra, sin pasar de ~100 y con puntos suspensivos", () => {
    const largo =
      "Los motores de giro de una excavadora fallan por desgaste de los rodamientos y por la falta de lubricación adecuada";
    const e = extracto(largo, 100);
    expect(e.endsWith("…")).toBe(true);
    expect(e.length).toBeLessThanOrEqual(101);
    expect(largo.startsWith(e.slice(0, -1))).toBe(true);
    // No deja una palabra a medias.
    expect(largo.slice(e.length - 1, e.length)).toBe(" ");
  });

  it("quita los signos sueltos antes de los puntos suspensivos", () => {
    const e = extracto(
      "Una frase corta, y otra frase que sigue, y que sigue, y que sigue mucho más allá del límite",
      30,
    );
    expect(e).not.toMatch(/[,;:] ?…$/);
  });
});

describe("extracto de texto sin espacios entre párrafos", () => {
  it("restituye el espacio tras el punto y respeta las siglas", () => {
    expect(extracto("La máquina avisa.Primero cambia el sonido.Después vibra.")).toBe(
      "La máquina avisa. Primero cambia el sonido. Después vibra.",
    );
    expect(extracto("Partequipos S.A.S. atiende en Colombia")).toBe(
      "Partequipos S.A.S. atiende en Colombia",
    );
  });
});

describe("minutosDeLectura", () => {
  it("al menos un minuto, 200 palabras por minuto", () => {
    expect(minutosDeLectura("")).toBe(1);
    expect(minutosDeLectura("palabra ".repeat(600))).toBe(3);
  });
});

describe("búsqueda", () => {
  const todos = [
    articulo(1, { titulo: "Motor de giro de excavadora" }),
    articulo(2, { titulo: "Fuga de aceite hidráulico" }),
  ];

  it("ignora mayúsculas y tildes, y pide todas las palabras", () => {
    expect(buscarEnArticulos(todos, "HIDRÁULICO").map((a) => a.id)).toEqual([2]);
    expect(buscarEnArticulos(todos, "motor excavadora").map((a) => a.id)).toEqual([1]);
    expect(buscarEnArticulos(todos, "motor aceite")).toEqual([]);
  });

  it("sin búsqueda devuelve todo", () => {
    expect(buscarEnArticulos(todos, "  ")).toHaveLength(2);
  });

  it("recorta y limita lo que se busca", () => {
    expect(leerBusqueda("  hola   mundo ")).toBe("hola mundo");
    expect(leerBusqueda("x".repeat(500))).toHaveLength(60);
    expect(leerBusqueda(["a", "b"])).toBe("a");
    expect(leerBusqueda(undefined)).toBe("");
  });
});

describe("listado del blog con el módulo común de filtros", () => {
  const todos = Array.from({ length: 23 }, (_, i) =>
    articulo(i + 1, i % 2 ? { categoria: { slug: "guias", nombre: "Guías" } } : {}),
  );
  const resolver = (parametros: Record<string, string | string[]>, pagina = 1) =>
    resolverListado({
      items: todos,
      parametros,
      catalogo: CATALOGO_BLOG,
      pagina,
      porPagina: POR_PAGINA_BLOG,
      ruta: "/noticias/",
    });

  it("pagina de 9 en 9", () => {
    const r = resolver({});
    expect(r.tipo).toBe("listado");
    if (r.tipo === "listado") {
      expect(r.elementos).toHaveLength(9);
      expect(r.paginas).toBe(3);
      expect(r.filtrado).toBe(false);
    }
  });

  it("la página que no existe es 404", () => {
    expect(resolver({}, 4).tipo).toBe("no-existe");
  });

  it("filtra por categoría y lo marca como filtrado", () => {
    const r = resolver({ categoria: "guias" });
    expect(r.tipo).toBe("listado");
    if (r.tipo === "listado") {
      expect(r.total).toBe(11);
      expect(r.filtrado).toBe(true);
      expect(r.consulta).toBe("categoria=guias");
    }
  });

  it("una categoría inexistente se quita con una redirección a la forma canónica", () => {
    const r = resolver({ categoria: "no-existe" });
    expect(r).toEqual({ tipo: "redirigir", destino: "/noticias/" });
  });

  it("ordena lo más reciente primero y desempata por id", () => {
    const r = resolver({});
    if (r.tipo !== "listado") throw new Error("listado");
    const fechas = r.elementos.map((a) => a.fecha);
    expect([...fechas].sort().reverse()).toEqual(fechas);
  });
});

describe("categoría del sitio relacionada", () => {
  const candidatas = [
    { nombre: "Llantas y Rines", href: "/r/llantas/", tipo: "repuestos" as const },
    { nombre: "Componentes Hidráulicos", href: "/r/hidraulicos/", tipo: "repuestos" as const },
    { nombre: "Tren de Rodaje", href: "/r/rodaje/", tipo: "repuestos" as const },
    { nombre: "Excavadoras", href: "/u/excavadoras/", tipo: "usada" as const },
  ];

  it("casa por una palabra distintiva del nombre", () => {
    expect(
      categoriaRelacionada(
        "¿Qué significa una protuberancia en una llanta de maquinaria pesada?",
        candidatas,
      )?.href,
    ).toBe("/r/llantas/");
    expect(categoriaRelacionada("Fuga de aceite: repuestos hidráulicos", candidatas)?.href).toBe(
      "/r/hidraulicos/",
    );
  });

  it("gana la que aparece antes en el título", () => {
    expect(
      categoriaRelacionada("Tornamesa de excavadora y su tren de rodaje", candidatas)?.href,
    ).toBe("/u/excavadoras/");
  });

  it("no inventa nada si no hay relación, ni casa por palabras genéricas", () => {
    expect(
      categoriaRelacionada("Partequipos, distribuidor oficial de Handok", candidatas),
    ).toBeNull();
    expect(
      categoriaRelacionada("Repuestos de maquinaria pesada", [
        { nombre: "Repuestos Motor Diesel", href: "/x/", tipo: "repuestos" },
      ]),
    ).toBeNull();
  });

  it("el texto del enlace dice qué es", () => {
    expect(textoEnlaceRelacionada(candidatas[0]!)).toBe("Ver repuestos de Llantas y Rines");
    expect(textoEnlaceRelacionada(candidatas[3]!)).toBe("Ver excavadoras usadas");
  });
});

describe("títulos del artículo", () => {
  const cuerpo = {
    root: {
      children: [
        { type: "heading", tag: "h2", children: [{ text: "¿Qué es una fuga?" }] },
        { type: "paragraph", children: [{ text: "Texto" }] },
        { type: "heading", tag: "h3", children: [{ text: "Síntomas" }, { text: " comunes" }] },
        { type: "heading", tag: "h2", children: [{ text: "¿Qué es una fuga?" }] },
        { type: "heading", tag: "h4", children: [{ text: "Se ignora" }] },
        { type: "heading", tag: "h2", children: [{ text: "   " }] },
      ],
    },
  };

  it("lista los h2 y h3 en orden, con ids únicos", () => {
    expect(titulosDeLexical(cuerpo)).toEqual([
      { id: "que-es-una-fuga", texto: "¿Qué es una fuga?", nivel: 2 },
      { id: "sintomas-comunes", texto: "Síntomas comunes", nivel: 3 },
      { id: "que-es-una-fuga-2", texto: "¿Qué es una fuga?", nivel: 2 },
    ]);
  });

  it("el id no queda vacío ni acaba en guion", () => {
    expect(slugDeTitulo("¡¡¡")).toBe("seccion");
    expect(slugDeTitulo("a".repeat(59) + " b")).not.toMatch(/-$/);
    expect(idsUnicos(["A", "A", "A"])).toEqual(["a", "a-2", "a-3"]);
  });

  it("un cuerpo vacío no tiene títulos", () => {
    expect(titulosDeLexical(null)).toEqual([]);
  });
});

describe("artículos relacionados", () => {
  const mk = (id: number, titulo: string, fecha: string) =>
    ({ id, titulo, fecha, categoria: { slug: "noticias" } }) as const;
  const todos = [
    mk(1, "Motor de giro de excavadora: síntomas de falla", "2026-09-01"),
    mk(2, "Tornamesa de excavadora: síntomas de falla", "2026-09-02"),
    mk(3, "Lubricantes ENI para maquinaria", "2026-09-30"),
    mk(4, "Handok Hydraulic en Colombia", "2026-09-29"),
    mk(5, "Fuga de aceite en excavadora", "2026-09-05"),
  ];

  it("primero los que se parecen, nunca el propio", () => {
    const r = articulosRelacionados(todos[0]!, todos, 3).map((a) => a.id);
    expect(r).not.toContain(1);
    expect(r.slice(0, 2)).toEqual([2, 5]);
    expect(r).toHaveLength(3);
  });

  it("sin parecido, los más recientes", () => {
    const r = articulosRelacionados(mk(9, "Zzzzzz yyyyyy", "2026-01-01"), todos, 2).map(
      (a) => a.id,
    );
    expect(r).toEqual([3, 4]);
  });
});

describe("entradillaRepiteCuerpo", () => {
  it("detecta la entradilla igual al primer párrafo o contenida en él", () => {
    assert.equal(entradillaRepiteCuerpo("Una llanta, con bulto.", "Una llanta con bulto"), true);
    assert.equal(
      entradillaRepiteCuerpo("Una llanta con bulto", "Una llanta con bulto y otras cosas más."),
      true,
    );
    assert.equal(
      entradillaRepiteCuerpo("Una llanta con bulto y algo más largo", "Una llanta con bulto"),
      true,
    );
  });
  it("no la oculta si es distinta o está vacía", () => {
    assert.equal(entradillaRepiteCuerpo("Resumen propio", "Otro texto del cuerpo"), false);
    assert.equal(entradillaRepiteCuerpo("", "Texto"), false);
  });
  it("el enlace de nueva dice «nuevas»", () => {
    assert.equal(
      textoEnlaceRelacionada({ nombre: "Excavadoras", href: "/x/", tipo: "nueva" }),
      "Ver excavadoras nuevas",
    );
  });
});
