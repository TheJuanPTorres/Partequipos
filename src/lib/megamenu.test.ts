import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SLUG_ADITAMENTOS,
  claveDeEnlace,
  construirMegamenu,
  logoDeMenu,
  panelMaquinaria,
  panelLubricantes,
  panelRepuestos,
  type DatosMegamenu,
  type GrupoMenu,
} from "./megamenu";

const DATOS: DatosMegamenu = {
  marcasMaquinaria: [
    { id: 1, nombre: "Yanmar", slug: "yanmar" },
    { id: 2, nombre: "Aditamentos", slug: SLUG_ADITAMENTOS },
    { id: 3, nombre: "Case Construction", slug: "case-construction" },
  ],
  tiposMaquinaria: [
    { id: 10, nombre: "Miniexcavadoras", slug: "miniexcavadoras", marca: 1 },
    { id: 11, nombre: "Retrocargadoras", slug: "retrocargadoras", marca: { id: 3 } },
    { id: 12, nombre: "Bulldozers", slug: "bulldozer", marca: 3 },
    { id: 13, nombre: "Aditamentos para excavadoras", slug: "excavadoras", marca: 2 },
    { id: 14, nombre: "Huérfano", slug: "huerfano", marca: null },
  ],
  categoriasNueva: [{ id: 20, nombre: "Excavadoras", slug: "excavadoras" }],
  categoriasUsada: [
    { id: 30, nombre: "Motoniveladoras", slug: "motoniveladoras" },
    { id: 31, nombre: "Bulldozers", slug: "bulldozer" },
    // Primer nivel (casilla «Agrupar en «Otros»» desmarcada), por su orden.
    { id: 33, nombre: "Aditamentos", slug: "aditamentos", enOtros: false, orden: 2 },
    { id: 32, nombre: "Excavadoras", slug: "excavadoras", enOtros: false, orden: 1 },
  ],
  marcasRepuestos: [
    { id: 40, nombre: "Caterpillar", slug: "repuestos-para-maquinaria-pesada-caterpillar" },
  ],
  tiposRepuestos: [
    {
      id: 50,
      nombre: "Excavadora",
      slug: "repuestos-para-maquinaria-pesada-excavadora-caterpillar",
      marca: 40,
    },
  ],
  // Todos los tipos de maquinaria nueva tienen equipos salvo el 14 (sin marca).
  equiposNuevos: [{ tipo: 10 }, { tipo: 10 }, { tipo: { id: 11 } }, { tipo: 12 }, { tipo: 13 }],
};

const titulos = (g: GrupoMenu[]) => g.map((x) => x.titulo);

describe("megamenú: maquinaria", () => {
  const panel = panelMaquinaria(DATOS);

  it("primero «Ver todo» a la sección, y después nueva, usada y aditamentos", () => {
    assert.deepEqual(panel.verTodo, {
      etiqueta: "Ver toda la maquinaria pesada",
      href: "/maquinaria-pesada/",
    });
    assert.deepEqual(titulos(panel.grupos), [
      "Maquinaria pesada nueva",
      "Maquinaria pesada usada",
      "Aditamentos para maquinaria pesada",
    ]);
  });

  it("nueva: por marca (sin aditamentos, en orden alfabético) y por tipo", () => {
    const nueva = panel.grupos[0]!;
    assert.equal(nueva.enlaces[0]?.href, "/maquinaria-pesada/maquinaria-pesada-nueva/");
    assert.deepEqual(titulos(nueva.grupos), ["Por marca", "Por tipo de máquina"]);
    const porMarca = nueva.grupos[0]!;
    assert.deepEqual(titulos(porMarca.grupos), ["Case Construction", "Yanmar"]);
    assert.deepEqual(porMarca.grupos[0]!.enlaces, [
      {
        etiqueta: "Ver todo Case Construction",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/",
      },
      {
        etiqueta: "Bulldozers",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/",
      },
      {
        etiqueta: "Retrocargadoras",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/",
      },
    ]);
    assert.deepEqual(nueva.grupos[1]!.enlaces, [
      { etiqueta: "Excavadoras", href: "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras/" },
    ]);
  });

  it("usada: como en WordPress, las de primer nivel por su orden y «Otros» al final", () => {
    const usada = panel.grupos[1]!;
    assert.equal(usada.grupos.length, 0);
    assert.deepEqual(
      usada.enlaces.map((e) => [e.etiqueta, e.href]),
      [
        ["Ver toda la maquinaria usada", "/maquinaria-pesada/maquinaria-pesada-usada/"],
        ["Excavadoras", "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/"],
        ["Aditamentos", "/maquinaria-pesada/maquinaria-pesada-usada/aditamentos/"],
        ["Otros", "/maquinaria-pesada/maquinaria-pesada-usada/otros/"],
      ],
    );
  });

  it("usada: sin unidades, la nota; «Otros» la lleva solo si ninguna agrupada tiene", () => {
    const notas = (equiposUsados: { categoria: number }[]) =>
      panelMaquinaria({ ...DATOS, equiposUsados }).grupos[1]!.enlaces.map((e) => [
        e.etiqueta,
        e.nota ?? null,
      ]);
    assert.deepEqual(notas([{ categoria: 31 }]), [
      ["Ver toda la maquinaria usada", null],
      ["Excavadoras", "Sin unidades por ahora"],
      ["Aditamentos", "Sin unidades por ahora"],
      ["Otros", null],
    ]);
    assert.deepEqual(notas([{ categoria: 32 }]).at(-1), ["Otros", "Sin unidades por ahora"]);
    // Sin el dato de las unidades, ninguna nota.
    assert.ok(panel.grupos[1]!.enlaces.every((e) => !e.nota));
  });

  it("usada: sin categorías agrupadas no hay «Otros»", () => {
    const soloPrimerNivel = DATOS.categoriasUsada.filter((c) => c.enOtros === false);
    const usada = panelMaquinaria({ ...DATOS, categoriasUsada: soloPrimerNivel }).grupos[1]!;
    assert.ok(usada.enlaces.every((e) => e.etiqueta !== "Otros"));
  });

  it("aditamentos: la «marca» del sitio, con sus tipos", () => {
    const aditamentos = panel.grupos[2]!;
    assert.deepEqual(aditamentos.enlaces, [
      {
        etiqueta: "Ver todo Aditamentos",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/",
      },
      {
        etiqueta: "Aditamentos para excavadoras",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/excavadoras/",
      },
    ]);
  });

  it("un tipo paraguas se enlaza si algún subtipo tiene equipos (#238)", () => {
    const enlaces = (d: DatosMegamenu) => JSON.stringify(panelMaquinaria(d));
    // Bulldozers (12) hace de paraguas de Retrocargadoras (11); él mismo no tiene equipos.
    const tipos = DATOS.tiposMaquinaria.map((t) => (t.id === 12 ? { ...t, subtipos: [11] } : t));
    const equipos = DATOS.equiposNuevos.filter((e) => e.tipo !== 12);
    assert.ok(
      !enlaces({ ...DATOS, equiposNuevos: equipos }).includes("/case-construction/bulldozer/"),
    );
    const con = enlaces({ ...DATOS, tiposMaquinaria: tipos, equiposNuevos: equipos });
    assert.ok(con.includes("/case-construction/bulldozer/"));
  });

  it("no enlaza a los tipos sin equipos, y vuelven solos con el primero (2026-10-18)", () => {
    const enlaces = (d: DatosMegamenu) =>
      JSON.stringify(panelMaquinaria(d)).match(
        /maquinaria-pesada-nueva\/marcas\/[a-z-]+\/[a-z-]+\//g,
      ) ?? [];
    const sinBulldozer = DATOS.equiposNuevos.filter((e) => e.tipo !== 12);
    assert.ok(enlaces(DATOS).some((h) => h.endsWith("/case-construction/bulldozer/")));
    const sin = enlaces({ ...DATOS, equiposNuevos: sinBulldozer });
    assert.ok(!sin.some((h) => h.endsWith("/case-construction/bulldozer/")));
    assert.ok(sin.some((h) => h.endsWith("/case-construction/retrocargadoras/")));
    const vuelve = enlaces({ ...DATOS, equiposNuevos: [...sinBulldozer, { tipo: { id: 12 } }] });
    assert.ok(vuelve.some((h) => h.endsWith("/case-construction/bulldozer/")));
    // «Ver todo <marca>» se queda aunque la marca no tenga ningún tipo con equipos.
    const sinNada = JSON.stringify(panelMaquinaria({ ...DATOS, equiposNuevos: [] }));
    assert.ok(sinNada.includes("Ver todo Yanmar"));
    assert.ok(!sinNada.includes("Miniexcavadoras"));
  });

  it("sin la marca de aditamentos, el acordeón no sale; sin categorías, tampoco «Por tipo»", () => {
    const p = panelMaquinaria({
      ...DATOS,
      marcasMaquinaria: DATOS.marcasMaquinaria.filter((m) => m.slug !== SLUG_ADITAMENTOS),
      categoriasNueva: [],
    });
    assert.deepEqual(titulos(p.grupos), ["Maquinaria pesada nueva", "Maquinaria pesada usada"]);
    assert.deepEqual(titulos(p.grupos[0]!.grupos), ["Por marca"]);
  });
});

describe("megamenú: repuestos", () => {
  it("sin categorías ni política, solo «Repuestos por marca»: las marcas con sus tipos", () => {
    const p = panelRepuestos(DATOS);
    assert.equal(p.verTodo.href, "/repuestos-maquinaria-pesada-colombia/");
    assert.deepEqual(titulos(p.grupos), ["Repuestos por marca"]);
    const cat = p.grupos[0]!.grupos[0]!;
    assert.equal(cat.titulo, "Caterpillar");
    assert.deepEqual(
      cat.enlaces.map((e) => e.href),
      [
        "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-caterpillar/",
        "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-caterpillar/repuestos-para-maquinaria-pesada-excavadora-caterpillar/",
      ],
    );
  });

  it("una marca nueva del catálogo aparece sola, sin tocar el código", () => {
    const p = panelRepuestos({
      ...DATOS,
      marcasRepuestos: [
        ...DATOS.marcasRepuestos,
        { id: 41, nombre: "Bobcat", slug: "repuestos-para-maquinaria-pesada-bobcat" },
      ],
    });
    assert.deepEqual(titulos(p.grupos[0]!.grupos), ["Bobcat", "Caterpillar"]);
  });
});

describe("megamenú: repuestos por categoría técnica y política de garantías (2026-10-20)", () => {
  const conTodo: DatosMegamenu = {
    ...DATOS,
    categoriasTecnicas: [
      {
        id: 1,
        nombre: "Tren de rodaje",
        slug: "tren-de-rodaje-para-maquinaria-pesada",
        icono: "rodaje",
        ordenMarca: 2,
      },
      {
        id: 2,
        nombre: "Filtración",
        slug: "filtros-para-maquinaria-pesada",
        icono: "filtro",
        ordenMarca: 1,
      },
      { id: 3, nombre: "Accesorios", slug: "accesorios", icono: null, ordenMarca: null },
      { id: 4, nombre: "Sin página", slug: "", icono: "motor", ordenMarca: null },
    ],
    politicaRepuestos: {
      mostrar: true,
      texto: "Política de garantías y repuestos",
      enlace: "/politica-de-garantia-de-repuestos/",
    },
  };

  it("el apartado de categorías: «Ver todas» y una por categoría, en su orden, con su icono", () => {
    const p = panelRepuestos(conTodo);
    assert.deepEqual(titulos(p.grupos), ["Repuestos por marca", "Repuestos por categoría técnica"]);
    const g = p.grupos[1]!;
    assert.deepEqual(
      g.enlaces.map((e) => [e.etiqueta, e.icono ?? null]),
      [
        ["Ver todas las categorías", null],
        ["Filtración", "filtro"],
        ["Tren de rodaje", "rodaje"],
        ["Accesorios", null],
      ],
    );
    assert.equal(
      g.enlaces[0]!.href,
      "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/",
    );
    assert.equal(
      g.enlaces[1]!.href,
      "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtros-para-maquinaria-pesada/",
    );
  });

  it("la política, al final, como enlace suelto; desmarcada o sin texto o enlace, no sale", () => {
    assert.deepEqual(panelRepuestos(conTodo).finales, [
      {
        etiqueta: "Política de garantías y repuestos",
        href: "/politica-de-garantia-de-repuestos/",
      },
    ]);
    const sin = (politicaRepuestos: DatosMegamenu["politicaRepuestos"]) =>
      panelRepuestos({ ...conTodo, politicaRepuestos }).finales;
    assert.equal(sin({ ...conTodo.politicaRepuestos, mostrar: false }), undefined);
    assert.equal(sin({ ...conTodo.politicaRepuestos, texto: " " }), undefined);
    assert.equal(sin(null), undefined);
  });

  it("sin ninguna categoría con página, el apartado no sale", () => {
    const p = panelRepuestos({
      ...conTodo,
      categoriasTecnicas: [{ id: 4, nombre: "X", slug: "", icono: null, ordenMarca: null }],
    });
    assert.deepEqual(titulos(p.grupos), ["Repuestos por marca"]);
  });
});

describe("megamenú: lubricantes (2026-10-20)", () => {
  const conLubricantes: DatosMegamenu = {
    ...DATOS,
    marcasLubricante: [{ id: 1, nombre: "Eni", slug: "lubricantes-eni" }],
    categoriasLubricante: [
      { id: 4, nombre: "Motos & Scooter", slug: "motos-scooter", marca: 1 },
      { id: 1, nombre: "Auto liviano", slug: "auto-liviano", marca: { id: 1 } },
      {
        id: 3,
        nombre: "Engranajes",
        slug: "engranajes",
        marca: 1,
        enlaceMenu: "/lubricantes/lubricantes-eni/engranajes/",
      },
      { id: 9, nombre: "De otra marca", slug: "otra", marca: 2 },
    ],
  };

  it("«Ver todos» a la general y, por marca, su página y sus categorías a su ancla o a su enlace", () => {
    const p = panelLubricantes(conLubricantes)!;
    assert.deepEqual(p.verTodo, { etiqueta: "Ver todos los lubricantes", href: "/lubricantes/" });
    assert.deepEqual(titulos(p.grupos), ["Lubricantes Eni"]);
    assert.deepEqual(
      p.grupos[0]!.enlaces.map((e) => [e.etiqueta, e.href]),
      [
        ["Ver todo Lubricantes Eni", "/lubricantes/lubricantes-eni/"],
        ["Auto liviano", "/lubricantes/lubricantes-eni/#auto-liviano"],
        ["Engranajes", "/lubricantes/lubricantes-eni/engranajes/"],
        ["Motos & Scooter", "/lubricantes/lubricantes-eni/#motos-scooter"],
      ],
    );
  });

  it("abre con el enlace de la cabecera a la general o a la página de la marca; sin marcas, no hay panel", () => {
    const m = construirMegamenu(conLubricantes);
    assert.ok(m["/lubricantes/"]);
    assert.ok(m["/lubricantes/lubricantes-eni/"]);
    assert.equal(panelLubricantes(DATOS), null);
    assert.equal(construirMegamenu(DATOS)["/lubricantes/"], undefined);
  });
});

describe("megamenú: qué enlace de la cabecera abre qué panel", () => {
  it("por su ruta, con o sin barra final", () => {
    const m = construirMegamenu(DATOS);
    assert.ok(m[claveDeEnlace("/maquinaria-pesada")]);
    assert.ok(m[claveDeEnlace("/maquinaria-pesada/")]);
    assert.ok(m[claveDeEnlace("/repuestos-maquinaria-pesada-colombia/")]);
    assert.equal(m[claveDeEnlace("/lubricantes/lubricantes-eni/")], undefined);
    assert.equal(m[claveDeEnlace("/servicio-tecnico/")], undefined);
  });
});

describe("megamenú: logos de marca (petición del cliente, 2026-10-06)", () => {
  const LOGO = {
    url: "https://x.public.blob.vercel-storage.com/logo.png",
    width: 400,
    height: 100,
  };

  it("el logo se pinta a 24 px de alto con su proporción; sin logo o sin medidas, nada", () => {
    assert.deepEqual(logoDeMenu(LOGO), { url: LOGO.url, width: 96, height: 24 });
    assert.equal(logoDeMenu(null), undefined);
    assert.equal(logoDeMenu(7), undefined); // sin poblar
    assert.equal(logoDeMenu({ url: LOGO.url, width: null, height: 100 }), undefined);
    assert.equal(logoDeMenu({ url: null, width: 400, height: 100 }), undefined);
  });

  it("las marcas con logo lo llevan; las que no, solo el nombre; Aditamentos, nunca", () => {
    const datos: DatosMegamenu = {
      ...DATOS,
      marcasMaquinaria: [
        { id: 1, nombre: "Yanmar", slug: "yanmar", logo: LOGO },
        { id: 2, nombre: "Aditamentos", slug: SLUG_ADITAMENTOS, logo: LOGO },
        { id: 3, nombre: "Case Construction", slug: "case-construction", logo: null },
      ],
      marcasRepuestos: [{ ...DATOS.marcasRepuestos[0]!, logo: LOGO }],
    };
    const maquinaria = panelMaquinaria(datos);
    const porMarca = maquinaria.grupos[0]!.grupos.find((g) => g.titulo === "Por marca")!;
    const yanmar = porMarca.grupos.find((g) => g.titulo === "Yanmar")!;
    const caseC = porMarca.grupos.find((g) => g.titulo === "Case Construction")!;
    assert.equal(yanmar.logo?.height, 24);
    assert.equal("logo" in caseC, false);
    const aditamentos = maquinaria.grupos.find((g) => g.titulo.startsWith("Aditamentos"))!;
    assert.equal(aditamentos.logo, undefined);
    const caterpillar = panelRepuestos(datos).grupos[0]!.grupos[0]!;
    assert.equal(caterpillar.logo?.url, LOGO.url);
  });

  it("en oscuro solo si la marca lo pide; si no, con sus colores (2026-10-17)", () => {
    assert.equal(logoDeMenu(LOGO)?.oscuro, undefined);
    assert.equal(logoDeMenu(LOGO, false)?.oscuro, undefined);
    assert.equal(logoDeMenu(LOGO, null)?.oscuro, undefined);
    assert.equal(logoDeMenu(LOGO, true)?.oscuro, true);
    assert.equal(logoDeMenu(null, true), undefined);
    const datos: DatosMegamenu = {
      ...DATOS,
      marcasRepuestos: [{ ...DATOS.marcasRepuestos[0]!, logo: LOGO, logoOscuroEnMenu: true }],
    };
    assert.equal(panelRepuestos(datos).grupos[0]!.grupos[0]!.logo?.oscuro, true);
  });

  it("una marca de nueva que también es de repuestos lleva el logo de repuestos (2026-10-20)", () => {
    const REP = {
      url: "https://x.public.blob.vercel-storage.com/rep.png",
      width: 419,
      height: 100,
    };
    const datos: DatosMegamenu = {
      ...DATOS,
      marcasMaquinaria: [
        { id: 1, nombre: "Hitachi", slug: "hitachi", logo: LOGO },
        { id: 2, nombre: "Dynapac", slug: "dynapac", logo: LOGO },
      ],
      marcasRepuestos: [
        { id: 9, nombre: "Hitachi", slug: "rep-hitachi", logo: REP, logoOscuroEnMenu: true },
      ],
    };
    const porMarca = panelMaquinaria(datos).grupos[0]!.grupos.find(
      (g) => g.titulo === "Por marca",
    )!;
    const hitachi = porMarca.grupos.find((g) => g.titulo === "Hitachi")!;
    const dynapac = porMarca.grupos.find((g) => g.titulo === "Dynapac")!;
    assert.equal(hitachi.logo?.url, REP.url);
    assert.equal(hitachi.logo?.oscuro, true);
    assert.equal(dynapac.logo?.url, LOGO.url);
  });
});
