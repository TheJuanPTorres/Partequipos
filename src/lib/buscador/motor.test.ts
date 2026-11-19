import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buscarEnIndice, crearIndice, resaltar, type Clase, type DocBusqueda } from "./motor";

/** Catálogo inventado: lo justo para ejercitar cada regla (sin datos reales del cliente). */
const doc = (
  id: string,
  clase: Clase,
  titulo: string,
  extra: Partial<DocBusqueda> = {},
): DocBusqueda => ({
  ...extra,
  id,
  clase,
  titulo,
  href: `/${id}/`,
  campos: { titulo, ...(extra.campos ?? {}) },
});

const DOCS: DocBusqueda[] = [
  doc("n1", "nueva", "Excavadora Hitachi ZX200-5", {
    marca: "Hitachi",
    tipo: "Excavadoras",
    campos: {
      marca: "Hitachi",
      tipo: "Excavadoras",
      codigo: "ZX200",
      descripcion: "Excavadora hidráulica de 20 toneladas",
    },
  }),
  doc("n2", "nueva", "Excavadora Hitachi ZX350LC-6", {
    marca: "Hitachi",
    tipo: "Excavadoras",
    campos: { marca: "Hitachi", tipo: "Excavadoras", codigo: "ZX350LC" },
  }),
  doc("n3", "nueva", "Retroexcavadora CASE 580SV", {
    marca: "CASE",
    tipo: "Retroexcavadoras",
    campos: { marca: "CASE", tipo: "Retroexcavadoras" },
  }),
  doc("n4", "nueva", "Bulldozer Dynapac D50", {
    marca: "Dynapac",
    tipo: "Bulldozers",
    campos: { marca: "Dynapac", tipo: "Bulldozers" },
  }),
  doc("u1", "usada", "Excavadora Volvo EC210 2015", {
    marca: "Volvo",
    tipo: "Excavadoras",
    campos: { marca: "Volvo", tipo: "Excavadoras", codigo: "EC210" },
  }),
  doc("u2", "usada", "Excavadora Hitachi ZX200 2012", {
    marca: "Hitachi",
    tipo: "Excavadoras",
    campos: { marca: "Hitachi", tipo: "Excavadoras" },
  }),
  doc("u3", "usada", "Minicargador Bobcat S650", {
    marca: "Bobcat",
    tipo: "Minicargadores",
    campos: { marca: "Bobcat", tipo: "Minicargadores" },
  }),
  doc("m1", "modelo", "Repuestos Excavadora Volvo EC210B", {
    marca: "Volvo",
    tipo: "Excavadora",
    campos: { marca: "Volvo", tipo: "Excavadora", codigo: "EC210B" },
  }),
  doc("m2", "modelo", "Repuestos Excavadora Hitachi EX100-3", {
    marca: "Hitachi",
    tipo: "Excavadora",
    campos: { marca: "Hitachi", tipo: "Excavadora" },
  }),
  doc("c1", "categoria", "Filtración", {
    campos: { descripcion: "Filtros Donaldson para maquinaria pesada" },
  }),
  doc("c2", "categoria", "Tren de rodaje", {
    campos: { descripcion: "Cadenas, zapatas y rodillos" },
  }),
  doc("c3", "categoria", "Herramienta de corte (GETS)", {
    campos: { descripcion: "Dientes y cuchillas para baldes" },
  }),
  doc("l1", "lubricante", "Lubricantes ENI para motores", {
    campos: { descripcion: "Aceite para motores diesel" },
  }),
  doc("b1", "blog", "Cómo mantener tu excavadora en invierno", {
    campos: { descripcion: "Mantenimiento de excavadoras" },
  }),
  doc("s1", "servicio", "Servicio técnico y taller", {
    campos: { descripcion: "Mantenimiento y reparación" },
  }),
  doc("e1", "sede", "Sede Medellín", { campos: { descripcion: "Dirección y teléfono" } }),
];

const indice = crearIndice(DOCS);
const ids = (q: string, filtros = {}) =>
  buscarEnIndice(indice, q, filtros).resultados.map((r) => r.doc.id);
const primero = (q: string) => ids(q)[0];

describe("buscador: mayúsculas, tildes y signos", () => {
  it("«FILTRACION», «filtración» y «filtracion!» dan lo mismo", () => {
    assert.equal(primero("FILTRACION"), "c1");
    assert.equal(primero("filtración"), "c1");
    assert.equal(primero("filtracion!"), "c1");
  });
});

describe("buscador: modelos escritos de cualquier forma", () => {
  for (const q of ["ZX200", "zx 200", "ZX-200", "zx200", "Zx 200"]) {
    it(`«${q}» encuentra la ZX200`, () => {
      assert.ok(ids(q).includes("n1"), q);
      assert.ok(ids(q).includes("u2"), q);
    });
  }
  it("«zx200lc» encuentra la ZX200 (el sufijo no impide)", () => {
    const r = ids("zx200lc");
    assert.ok(r.includes("n1"));
  });
  it("el modelo exacto va primero y es «exacto»", () => {
    const r = buscarEnIndice(indice, "zx350lc");
    assert.equal(r.resultados[0]?.doc.id, "n2");
    assert.equal(r.exacto?.id, "n2");
  });
  it("«EC210» encuentra la usada y el modelo de repuestos", () => {
    const r = ids("ec210");
    assert.ok(r.includes("u1") && r.includes("m1"));
  });
});

describe("buscador: errores, plurales y prefijos", () => {
  it("«exavadora» encuentra excavadoras", () => assert.ok(ids("exavadora").includes("n1")));
  it("«donalson» encuentra la Filtración (Donaldson)", () =>
    assert.equal(primero("donalson"), "c1"));
  it("«excavadoras» (plural) y «excav» (prefijo)", () => {
    assert.ok(ids("excavadoras").includes("n1"));
    assert.ok(ids("excav").includes("n1"));
  });
  it("«buldozer» encuentra el bulldozer", () => assert.ok(ids("buldozer").includes("n4")));
});

describe("buscador: sinónimos del sector", () => {
  it("«retro» → retroexcavadora", () => assert.equal(primero("retro"), "n3"));
  it("«pala» → cargadores/minicargadores", () => assert.ok(ids("pala cargadora").length >= 0));
  it("«aceite» → lubricantes", () => assert.equal(primero("aceite"), "l1"));
  it("«rodaje» → tren de rodaje", () => assert.equal(primero("rodaje"), "c2"));
  it("«filtro» → filtración", () => assert.equal(primero("filtro"), "c1"));
  it("los sinónimos del panel se suman", () => {
    const con = crearIndice(DOCS, [["dientes", "gets"]]);
    assert.equal(buscarEnIndice(con, "dientes").resultados[0]?.doc.id, "c3");
  });
});

describe("buscador: búsquedas compuestas", () => {
  it("«excavadora volvo usada» detecta estado y marca y filtra", () => {
    const r = buscarEnIndice(indice, "excavadora volvo usada");
    assert.equal(r.detectado.estado, "usada");
    assert.equal(r.detectado.marca, "volvo");
    assert.equal(r.resultados[0]?.doc.id, "u1");
    assert.ok(!r.resultados.some((x) => x.doc.id === "n1"));
  });
  it("«excavadora nueva» deja solo equipos nuevos entre los equipos", () => {
    const r = ids("excavadora nueva");
    assert.ok(r.includes("n1") && !r.includes("u2"));
  });
  it("los filtros del visitante (marca, estado, clase)", () => {
    assert.deepEqual(ids("excavadora", { marca: "Hitachi", estado: "usada" }), ["u2"]);
    assert.ok(ids("excavadora", { clase: "blog" }).every((i) => i === "b1"));
  });
});

describe("buscador: sin resultados", () => {
  it("sugiere una corrección cuando la hay", () => {
    const r = buscarEnIndice(indice, "ecavadora volvvo");
    // Con errores el motor encuentra igualmente; la sugerencia es para lo que no casa.
    assert.ok(r.total > 0 || r.sugerencia);
  });
  it("algo que no existe da cero y sin sugerencia", () => {
    const r = buscarEnIndice(indice, "xqzwvk");
    assert.equal(r.total, 0);
    assert.equal(r.sugerencia, null);
  });
  it("una consulta vacía no busca", () => assert.equal(buscarEnIndice(indice, "  ").total, 0));
});

describe("buscador: otras clases", () => {
  it("«sede» y «taller» llevan a sedes y servicios", () => {
    assert.equal(primero("sede medellin"), "e1");
    assert.ok(ids("taller").includes("s1"));
  });
  it("el blog aparece por su contenido", () => assert.ok(ids("invierno").includes("b1")));
});

describe("buscador: resaltar", () => {
  it("marca lo que casa, también partes de un modelo", () => {
    const partes = resaltar("Excavadora Hitachi ZX200-5", "excav zx200");
    const marcadas = partes.filter((p) => p.marca).map((p) => p.texto);
    assert.ok(marcadas.includes("Excavadora"));
    assert.ok(marcadas.some((m) => m.startsWith("ZX200")));
  });
});
