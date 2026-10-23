import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { CollectionConfig, Field } from "payload";

import { CAMPOS_MENU, type ColeccionDelMenu } from "../../lib/megamenuCampos";
import { cambiaElMenu } from "./megamenuHooks";

describe("megamenú: cuándo hay que revalidar el sitio", () => {
  const antes = { nombre: "Hitachi", slug: "hitachi", marca: 3, descripcion: "x" };
  const tipo = "tipos-maquinaria";

  it("al crear, siempre", () => {
    assert.equal(cambiaElMenu("create", antes, null, tipo), true);
  });

  it("si cambia el nombre, el slug o la marca", () => {
    assert.equal(cambiaElMenu("update", { ...antes, nombre: "HITACHI" }, antes, tipo), true);
    assert.equal(cambiaElMenu("update", { ...antes, slug: "hitachi-2" }, antes, tipo), true);
    assert.equal(cambiaElMenu("update", { ...antes, marca: 4 }, antes, tipo), true);
  });

  it("si se pone, se cambia o se quita el logo de una marca, o su tinta oscura", () => {
    const m = "marcas";
    const conLogo = { ...antes, logo: 7 };
    assert.equal(cambiaElMenu("update", conLogo, antes, m), true);
    assert.equal(cambiaElMenu("update", { ...antes, logo: 8 }, conLogo, m), true);
    assert.equal(cambiaElMenu("update", { ...antes, logo: null }, conLogo, m), true);
    assert.equal(cambiaElMenu("update", { ...antes, logo: { id: 7 } }, conLogo, m), false);
    assert.equal(cambiaElMenu("update", { ...antes, logoOscuroEnMenu: true }, antes, m), true);
  });

  it("la marca poblada y su id cuentan como la misma", () => {
    assert.equal(cambiaElMenu("update", { ...antes, marca: { id: 3 } }, antes, tipo), false);
  });

  it("editar otra cosa (la descripción) no revalida todo el sitio", () => {
    assert.equal(cambiaElMenu("update", { ...antes, descripcion: "otra" }, antes, tipo), false);
  });

  it("en las categorías técnicas, si cambia la foto o el orden (no el icono)", () => {
    const cat = {
      nombre: "Filtración",
      slug: "filtros",
      icono: "filtro",
      ordenMarca: 1,
      imagen: 5,
    };
    const ct = "categorias-tecnicas";
    assert.equal(cambiaElMenu("update", { ...cat, imagen: 6 }, cat, ct), true);
    assert.equal(cambiaElMenu("update", { ...cat, imagen: null }, cat, ct), true);
    assert.equal(cambiaElMenu("update", { ...cat, icono: "motor" }, cat, ct), false);
    assert.equal(cambiaElMenu("update", { ...cat, ordenMarca: 2 }, cat, ct), true);
    // La foto de un tipo no sale en el menú: no revalida todo el sitio.
    assert.equal(cambiaElMenu("update", { ...cat, imagen: 6 }, cat, "tipos-equipo"), false);
  });

  // Lo que se escapaba hasta el 2026-10-22 (el menú de las páginas que no son de nueva se quedaba viejo).
  it("la casilla «Tarjeta en el índice de tipos» y los subtipos de un tipo de nueva", () => {
    const t = { ...antes, pestanaIndiceNueva: false, subtipos: [11, 12] };
    assert.equal(cambiaElMenu("update", { ...t, pestanaIndiceNueva: true }, t, tipo), true);
    assert.equal(cambiaElMenu("update", { ...t, subtipos: [11] }, t, tipo), true);
    // Los mismos subtipos, poblados: no cambia nada.
    assert.equal(
      cambiaElMenu("update", { ...t, subtipos: [{ id: 11 }, { id: 12 }] }, t, tipo),
      false,
    );
  });

  it("los tipos que agrupa una categoría de nueva", () => {
    const c = { nombre: "Cargadores", slug: "cargadores", tiposIncluidos: [5, 6] };
    const cn = "categorias-maquinaria";
    assert.equal(cambiaElMenu("update", { ...c, tiposIncluidos: [5] }, c, cn), true);
    assert.equal(cambiaElMenu("update", { ...c, tiposIncluidos: [] }, c, cn), true);
    assert.equal(cambiaElMenu("update", { ...c, tiposIncluidos: [{ id: 5 }, 6] }, c, cn), false);
  });

  it("ocultar una marca de nueva o una categoría de usados, y el orden y «Otros» de usados y lubricantes", () => {
    assert.equal(
      cambiaElMenu(
        "update",
        { ...antes, mostrarEnWeb: false },
        { ...antes, mostrarEnWeb: true },
        "marcas-maquinaria",
      ),
      true,
    );
    const u = {
      nombre: "Excavadoras",
      slug: "excavadoras",
      enOtros: true,
      orden: 1,
      mostrarEnWeb: true,
    };
    const cu = "categorias-usada";
    assert.equal(cambiaElMenu("update", { ...u, mostrarEnWeb: false }, u, cu), true);
    assert.equal(cambiaElMenu("update", { ...u, enOtros: false }, u, cu), true);
    assert.equal(cambiaElMenu("update", { ...u, orden: 2 }, u, cu), true);
    const l = { nombre: "Grasas", slug: "grasas", marca: 1, enlaceMenu: null, orden: 1 };
    assert.equal(cambiaElMenu("update", { ...l, orden: 3 }, l, "categorias-lubricante"), true);
  });
});

/* -------------------------------------------------------------------------- */
/* Guardarraíl: la lista de campos del menú, las colecciones y la consulta     */
/* -------------------------------------------------------------------------- */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const leer = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

/** Los nombres de campo de una colección, también los de pestañas, filas y plegables. */
function nombresDeCampos(campos: Field[]): Set<string> {
  const nombres = new Set<string>();
  const recorrer = (lista: Field[]) => {
    for (const c of lista) {
      if ("name" in c && typeof c.name === "string") nombres.add(c.name);
      // Los grupos con nombre guardan sus hijos dentro: el menú no lee ninguno.
      if ("fields" in c && Array.isArray(c.fields) && !("name" in c && c.type === "group"))
        recorrer(c.fields);
      if ("tabs" in c && Array.isArray(c.tabs))
        for (const p of c.tabs) if (!("name" in p && p.name)) recorrer(p.fields);
    }
  };
  recorrer(campos);
  return nombres;
}

async function coleccionesPorSlug(): Promise<Map<string, CollectionConfig>> {
  const dir = path.join(raiz, "src", "collections");
  const mapa = new Map<string, CollectionConfig>();
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".ts") && !x.endsWith(".test.ts"))) {
    const modulo: Record<string, unknown> = await import(pathToFileURL(path.join(dir, f)).href);
    for (const e of Object.values(modulo))
      if (e && typeof e === "object" && "slug" in e && "fields" in e)
        mapa.set((e as CollectionConfig).slug, e as CollectionConfig);
  }
  return mapa;
}

describe("megamenú: la lista de campos (CAMPOS_MENU) no se separa de nada", () => {
  const colecciones = Object.keys(CAMPOS_MENU) as ColeccionDelMenu[];

  it("cada campo de la lista existe en su colección", async () => {
    const porSlug = await coleccionesPorSlug();
    for (const slug of colecciones) {
      const col = porSlug.get(slug);
      assert.ok(col, `no existe la colección «${slug}»`);
      const nombres = nombresDeCampos(col.fields);
      for (const campo of CAMPOS_MENU[slug])
        assert.ok(nombres.has(campo), `«${slug}» no tiene el campo «${campo}»`);
    }
  });

  it("las colecciones con el gancho del menú son exactamente las de la lista", () => {
    const dir = path.join(raiz, "src", "collections");
    const conGancho = readdirSync(dir)
      .filter((f) => f.endsWith(".ts"))
      .flatMap((f) => [
        ...readFileSync(path.join(dir, f), "utf8").matchAll(/revalidarMegamenu\("([a-z-]+)"\)/g),
      ])
      .map((m) => m[1])
      .sort();
    assert.deepEqual(conGancho, [...colecciones].sort());
  });

  it("la consulta del menú pide cada colección de la lista con su `selectDelMenu`, sin `select` a mano", () => {
    const fuente = leer("src/lib/queries/getMegamenu.ts");
    for (const slug of colecciones)
      assert.ok(
        fuente.includes(`selectDelMenu("${slug}")`),
        `getMegamenu no usa selectDelMenu("${slug}")`,
      );
    // Los `select` escritos a mano que quedan son de lo que no está en la lista (equipos y el
    // global de la cabecera, que se refrescan por su cuenta): ninguno de las colecciones de arriba.
    // Cada trozo va de un `collection: "…"` al siguiente.
    const trozos = fuente.split(/(?=collection: ")/).slice(1);
    assert.ok(trozos.length >= colecciones.length);
    for (const resto of trozos) {
      const trozo = resto.split("payload.")[0] ?? ""; // sin la consulta siguiente (el global)
      const slug = /^collection: "([a-z-]+)"/.exec(trozo)?.[1] as ColeccionDelMenu;
      if (colecciones.includes(slug))
        assert.ok(!/select: \{/.test(trozo), `«${slug}» lleva un select a mano`);
    }
  });

  it("el guardarraíl falla cuando debe: un campo inventado no existe en su colección", async () => {
    const col = (await coleccionesPorSlug()).get("tipos-maquinaria");
    assert.ok(col);
    assert.equal(nombresDeCampos(col.fields).has("campoQueNoExiste"), false);
    assert.equal(nombresDeCampos(col.fields).has("pestanaIndiceNueva"), true);
  });
});
