import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compararNumeros,
  consultaCanonica,
  consultaRecibida,
  cumple,
  depurar,
  enlaceCon,
  facetasConCuenta,
  filtrar,
  hayFiltros,
  leerSeleccion,
  metadataFiltrada,
  metadataSinIndexar,
  ordenar,
  otrosParametros,
  paginar,
  resolverListado,
  type Catalogo,
} from "./index";

type Item = { id: number; marca: string | null; anio: number | null; peso: number | null };

const CAT: Catalogo<Item> = {
  facetas: [
    {
      tipo: "lista",
      clave: "marca",
      etiqueta: "Marca",
      de: (i) => (i.marca ? { valor: i.marca.toLowerCase(), etiqueta: i.marca } : null),
    },
    {
      tipo: "lista",
      clave: "anio",
      etiqueta: "Año",
      ordenOpciones: "valor-desc",
      de: (i) => (i.anio ? { valor: String(i.anio), etiqueta: String(i.anio) } : null),
    },
    {
      tipo: "tramos",
      clave: "peso",
      etiqueta: "Peso",
      tramos: [
        { valor: "0-10", etiqueta: "Menos de 10 t", hasta: 10 },
        { valor: "10-mas", etiqueta: "10 t o más", desde: 10 },
      ],
      de: (i) => i.peso,
    },
  ],
  ordenes: [
    {
      valor: "recientes",
      etiqueta: "Recientes",
      comparar: (a, b) => compararNumeros(a.anio, b.anio, "desc") || a.id - b.id,
    },
    {
      valor: "ligeros",
      etiqueta: "Ligeros",
      comparar: (a, b) => compararNumeros(a.peso, b.peso, "asc") || a.id - b.id,
    },
  ],
};

const ITEMS: Item[] = [
  { id: 1, marca: "Hitachi", anio: 2019, peso: 20 },
  { id: 2, marca: "Hitachi", anio: 2015, peso: 5 },
  { id: 3, marca: "LiuGong", anio: 2019, peso: 10 },
  { id: 4, marca: "Case", anio: null, peso: null },
  { id: 5, marca: null, anio: 2021, peso: 9.99 },
];

describe("leerSeleccion", () => {
  it("lee listas, repeticiones y tramos; descarta lo mal formado", () => {
    const s = leerSeleccion(
      {
        marca: ["Hitachi", "liugong", "hitachi", "<x>", ""],
        peso: ["0-10", "99-100"],
        anio: "2019",
      },
      CAT,
    );
    assert.deepEqual(s.valores, { marca: ["hitachi", "liugong"], anio: ["2019"], peso: ["0-10"] });
    assert.equal(s.orden, "recientes");
  });

  it("un orden desconocido o repetido toma el primero que valga", () => {
    assert.equal(leerSeleccion({ orden: "inventado" }, CAT).orden, "recientes");
    assert.equal(leerSeleccion({ orden: ["ligeros", "recientes"] }, CAT).orden, "ligeros");
  });

  it("no acepta más de 20 valores por faceta", () => {
    const muchos = Array.from({ length: 50 }, (_, i) => `m${i}`);
    assert.equal(leerSeleccion({ marca: muchos }, CAT).valores.marca?.length, 20);
  });
});

describe("depurar", () => {
  it("quita los valores de lista que no tiene ningún registro, no los tramos", () => {
    const s = depurar(
      { valores: { marca: ["hitachi", "inventada"], peso: ["10-mas"] }, orden: "recientes" },
      CAT,
      ITEMS,
    );
    assert.deepEqual(s.valores, { marca: ["hitachi"], peso: ["10-mas"] });
    const vacia = depurar({ valores: { marca: ["inventada"] }, orden: "recientes" }, CAT, ITEMS);
    assert.deepEqual(vacia.valores, {});
  });
});

describe("consultaCanonica y consultaRecibida", () => {
  it("ordena facetas como el catálogo y valores alfabéticos (tramos, como se definen)", () => {
    const s = {
      valores: { peso: ["10-mas", "0-10"], marca: ["liugong", "hitachi"] },
      orden: "recientes",
    };
    assert.equal(consultaCanonica(s, CAT), "marca=hitachi&marca=liugong&peso=0-10&peso=10-mas");
  });

  it("el orden por defecto no se escribe; otro, al final", () => {
    assert.equal(consultaCanonica({ valores: {}, orden: "recientes" }, CAT), "");
    assert.equal(consultaCanonica({ valores: {}, orden: "ligeros" }, CAT), "orden=ligeros");
  });

  it("lo que envía un formulario GET ya en orden es canónico; otra forma, no", () => {
    const recibida = { marca: ["hitachi", "liugong"], peso: "0-10", utm_source: "x" };
    const s = depurar(leerSeleccion(recibida, CAT), CAT, ITEMS);
    assert.equal(consultaRecibida(recibida, CAT), consultaCanonica(s, CAT));
    const desordenada = { peso: "0-10", marca: "hitachi" };
    const s2 = depurar(leerSeleccion(desordenada, CAT), CAT, ITEMS);
    assert.notEqual(consultaRecibida(desordenada, CAT), consultaCanonica(s2, CAT));
    const mayus = { marca: "Hitachi" };
    assert.notEqual(
      consultaRecibida(mayus, CAT),
      consultaCanonica(depurar(leerSeleccion(mayus, CAT), CAT, ITEMS), CAT),
    );
  });

  it("conserva los parámetros desconocidos aparte", () => {
    assert.equal(otrosParametros({ marca: "hitachi", utm_source: "a b" }, CAT), "utm_source=a+b");
  });

  it("hayFiltros: valores u orden no por defecto", () => {
    assert.equal(hayFiltros({ valores: {}, orden: "recientes" }, CAT), false);
    assert.equal(hayFiltros({ valores: {}, orden: "ligeros" }, CAT), true);
    assert.equal(hayFiltros({ valores: { anio: ["2019"] }, orden: "recientes" }, CAT), true);
  });
});

describe("cumple y filtrar", () => {
  it("los tramos incluyen el «desde» y excluyen el «hasta»", () => {
    const peso = CAT.facetas[2]!;
    assert.equal(cumple({ ...ITEMS[0]!, peso: 10 }, peso, ["0-10"]), false);
    assert.equal(cumple({ ...ITEMS[0]!, peso: 10 }, peso, ["10-mas"]), true);
    assert.equal(cumple({ ...ITEMS[0]!, peso: 9.99 }, peso, ["0-10"]), true);
  });

  it("sin el dato no se cumple ningún filtro de esa faceta, pero sí sin filtro", () => {
    const peso = CAT.facetas[2]!;
    assert.equal(cumple(ITEMS[3]!, peso, ["0-10", "10-mas"]), false);
    assert.equal(cumple(ITEMS[3]!, peso, []), true);
  });

  it("dentro de una faceta, O; entre facetas, Y", () => {
    const s = { valores: { marca: ["hitachi", "liugong"], anio: ["2019"] }, orden: "recientes" };
    assert.deepEqual(
      filtrar(ITEMS, CAT, s).map((i) => i.id),
      [1, 3],
    );
  });
});

describe("facetasConCuenta", () => {
  it("cada faceta cuenta con los demás filtros, no con el suyo", () => {
    const s = { valores: { marca: ["hitachi"] }, orden: "recientes" };
    const [marca, anio, peso] = facetasConCuenta(ITEMS, CAT, s);
    // Marca: sin su propio filtro, todas las marcas con su recuento.
    assert.deepEqual(
      marca!.opciones.map((o) => [o.valor, o.cuenta, o.activa]),
      [
        ["case", 1, false],
        ["hitachi", 2, true],
        ["liugong", 1, false],
      ],
    );
    // Año: solo las Hitachi (2019 y 2015), los años de mayor a menor.
    assert.deepEqual(
      anio!.opciones.map((o) => [o.valor, o.cuenta]),
      [
        ["2019", 1],
        ["2015", 1],
      ],
    );
    assert.deepEqual(
      peso!.opciones.map((o) => [o.valor, o.cuenta]),
      [
        ["0-10", 1],
        ["10-mas", 1],
      ],
    );
  });

  it("una opción elegida que se queda en 0 sigue saliendo, para poder quitarla", () => {
    const s = { valores: { marca: ["case"], anio: ["2019"] }, orden: "recientes" };
    const marca = facetasConCuenta(ITEMS, CAT, s)[0]!;
    const caseOp = marca.opciones.find((o) => o.valor === "case")!;
    assert.deepEqual([caseOp.cuenta, caseOp.activa, caseOp.etiqueta], [0, true, "Case"]);
  });

  it("no pinta una faceta sin opciones", () => {
    const sinAnio = ITEMS.map((i) => ({ ...i, anio: null }));
    const claves = facetasConCuenta(sinAnio, CAT, { valores: {}, orden: "recientes" }).map(
      (f) => f.clave,
    );
    assert.deepEqual(claves, ["marca", "peso"]);
  });
});

describe("ordenar y paginar", () => {
  it("los que no tienen el dato van al final en los dos sentidos; el id desempata", () => {
    assert.deepEqual(
      ordenar(ITEMS, CAT, { valores: {}, orden: "recientes" }).map((i) => i.id),
      [5, 1, 3, 2, 4],
    );
    assert.deepEqual(
      ordenar(ITEMS, CAT, { valores: {}, orden: "ligeros" }).map((i) => i.id),
      [2, 5, 3, 1, 4],
    );
  });

  it("no toca la lista recibida", () => {
    const copia = [...ITEMS];
    ordenar(ITEMS, CAT, { valores: {}, orden: "ligeros" });
    assert.deepEqual(ITEMS, copia);
  });

  it("pagina y nunca da menos de 1 página", () => {
    assert.deepEqual(paginar([1, 2, 3, 4, 5], 2, 2), { elementos: [3, 4], total: 5, paginas: 3 });
    assert.deepEqual(paginar([], 1, 24), { elementos: [], total: 0, paginas: 1 });
  });
});

describe("enlaceCon", () => {
  const base = "/listado/";
  const s = { valores: { marca: ["hitachi"] }, orden: "ligeros" };
  it("alterna, quita, cambia el orden y limpia, siempre a la página 1 y en forma canónica", () => {
    assert.equal(
      enlaceCon(base, CAT, s, { alternar: { clave: "marca", valor: "case" } }),
      "/listado/?marca=case&marca=hitachi&orden=ligeros",
    );
    assert.equal(
      enlaceCon(base, CAT, s, { alternar: { clave: "marca", valor: "hitachi" } }),
      "/listado/?orden=ligeros",
    );
    assert.equal(
      enlaceCon(base, CAT, s, { quitar: { clave: "marca", valor: "hitachi" } }),
      "/listado/?orden=ligeros",
    );
    assert.equal(enlaceCon(base, CAT, s, { orden: "recientes" }), "/listado/?marca=hitachi");
    assert.equal(enlaceCon(base, CAT, s, { limpiar: true }), "/listado/?orden=ligeros");
  });
});

describe("metadata", () => {
  const base = { title: "T", alternates: { canonical: "https://x/a/pagina/2/" } };
  it("filtrada: canónica sin filtros y noindex, follow si el sitio es indexable", () => {
    const m = metadataFiltrada(base, "https://x/a/", true);
    assert.equal(m.alternates?.canonical, "https://x/a/");
    assert.deepEqual(m.robots, { index: false, follow: true });
  });
  it("con el sitio cerrado no pone robots (no pisa el nofollow del layout)", () => {
    assert.equal(metadataFiltrada(base, "https://x/a/", false).robots, undefined);
    assert.equal(metadataSinIndexar(base, false).robots, undefined);
    assert.deepEqual(metadataSinIndexar(base, true).robots, { index: false, follow: true });
  });
});

describe("resolverListado", () => {
  const comun = { items: ITEMS, catalogo: CAT, porPagina: 2, ruta: "/l/" };
  it("sin filtros: la página pedida, con las facetas y sin filtrar", () => {
    const r = resolverListado({ ...comun, parametros: {}, pagina: 1 });
    assert.equal(r.tipo, "listado");
    if (r.tipo !== "listado") return;
    assert.deepEqual(
      r.elementos.map((i) => i.id),
      [5, 1],
    );
    assert.deepEqual(
      [r.total, r.totalSinFiltros, r.paginas, r.filtrado, r.consulta],
      [5, 5, 3, false, ""],
    );
  });

  it("con filtros canónicos: filtra y lo marca", () => {
    const r = resolverListado({ ...comun, parametros: { marca: "hitachi" }, pagina: 1 });
    assert.equal(r.tipo, "listado");
    if (r.tipo !== "listado") return;
    assert.deepEqual(
      r.elementos.map((i) => i.id),
      [1, 2],
    );
    assert.deepEqual(
      [r.total, r.totalSinFiltros, r.filtrado, r.consulta],
      [2, 5, true, "marca=hitachi"],
    );
  });

  it("forma no canónica, valor inexistente o mayúsculas: redirige y conserva lo desconocido", () => {
    assert.deepEqual(resolverListado({ ...comun, parametros: { marca: "Hitachi" }, pagina: 1 }), {
      tipo: "redirigir",
      destino: "/l/?marca=hitachi",
    });
    assert.deepEqual(
      resolverListado({ ...comun, parametros: { marca: "inventada", utm_source: "x" }, pagina: 1 }),
      { tipo: "redirigir", destino: "/l/?utm_source=x" },
    );
    assert.deepEqual(resolverListado({ ...comun, parametros: { orden: "recientes" }, pagina: 1 }), {
      tipo: "redirigir",
      destino: "/l/",
    });
  });

  it("lo que envía el formulario del panel (años de mayor a menor) ya es canónico", () => {
    const r = resolverListado({ ...comun, parametros: { anio: ["2019", "2015"] }, pagina: 1 });
    assert.equal(r.tipo, "listado");
  });

  it("una página que no existe con esa selección: no-existe", () => {
    assert.deepEqual(resolverListado({ ...comun, parametros: { marca: "hitachi" }, pagina: 2 }), {
      tipo: "no-existe",
    });
  });
});
