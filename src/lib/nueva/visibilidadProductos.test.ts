import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { cambiaLaVisibilidad } from "../../collections/hooks/visibilidadProducto";
import { agruparProductos } from "../lubricantes/marca";
import { insigniaDe } from "../panel/insignias";
import { productoVisible } from "./visibilidad";

/*
 * «MOSTRAR EN LA WEB» de los PRODUCTOS (2026-10-23). GUARDARRAÍL: toda lectura
 * PÚBLICA de equipos nuevos, equipos usados o modelos de repuestos filtra los
 * ocultos. Busca cada `collection: "<colección>"` en el código del sitio (fuera
 * del panel, los ganchos y el mapa de redirects) y exige el filtro en esa misma
 * llamada. Las que traen el oculto A PROPÓSITO (la ficha, que lo redirige a su
 * página padre) lo declaran con el comentario `producto-oculto-ok`. Escribe el
 * nombre de la colección literal.
 */
const RAIZ = path.resolve(process.cwd(), "src");
const COLECCIONES = ["equipos-nuevos", "equipos-usados", "modelos-repuesto"];
const FILTRO = /\b(PRODUCTO_VISIBLE|conEquipoVisible|conProductoVisible)\b|producto-oculto-ok/;
const EXCLUIDOS = [
  path.join("src", "collections"),
  path.join("src", "app", "(payload)"),
  path.join("src", "app", "(site)", "api", "redirects-map"),
  path.join("src", "components", "admin"),
  path.join("src", "lib", "panel"),
  path.join("src", "migrations"),
];

function ficheros(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ficheros(p);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });
}

/** El texto de la llamada (`find`, `count` o `findByID`) que contiene `pos`. */
function llamada(texto: string, pos: number): string {
  const inicio = Math.max(
    ...[".find(", ".count(", ".findByID("].map((f) => texto.lastIndexOf(f, pos)),
  );
  let nivel = 0;
  for (let i = texto.indexOf("(", inicio); i < texto.length; i++) {
    if (texto[i] === "(") nivel++;
    else if (texto[i] === ")" && --nivel === 0) return texto.slice(inicio, i + 1);
  }
  return texto.slice(inicio);
}

function lecturasSinFiltro(archivos: { ruta: string; texto: string }[]): string[] {
  const fallos: string[] = [];
  for (const { ruta, texto } of archivos) {
    for (const c of COLECCIONES) {
      for (const m of texto.matchAll(new RegExp(`collection: "${c}"`, "g"))) {
        if (!FILTRO.test(llamada(texto, m.index ?? 0))) {
          fallos.push(`${ruta}:${texto.slice(0, m.index).split("\n").length} (${c})`);
        }
      }
    }
  }
  return fallos;
}

describe("guardarraíl: las lecturas públicas de productos filtran los ocultos", () => {
  it("ninguna consulta del sitio se olvida del filtro", () => {
    const archivos = ficheros(RAIZ)
      .map((p) => path.relative(process.cwd(), p))
      .filter((r) => !EXCLUIDOS.some((x) => r.startsWith(x)))
      .map((ruta) => ({ ruta, texto: fs.readFileSync(ruta, "utf8") }));
    assert.ok(archivos.length > 50, "no encontró el código del sitio");
    assert.deepEqual(lecturasSinFiltro(archivos), []);
  });

  it("y falla cuando una se lo olvida (comprobación del guardián)", () => {
    const malo = `await payload.find({\n  collection: "modelos-repuesto",\n  depth: 1,\n});`;
    const bueno = `await payload.find({\n  collection: "modelos-repuesto",\n  where: conProductoVisible({ tipo: { equals: 1 } }),\n});`;
    const adrede = `await payload.find({\n  collection: "equipos-usados",\n  // producto-oculto-ok\n  where: {},\n});`;
    assert.deepEqual(lecturasSinFiltro([{ ruta: "x.ts", texto: malo }]), [
      "x.ts:2 (modelos-repuesto)",
    ]);
    assert.deepEqual(lecturasSinFiltro([{ ruta: "y.ts", texto: bueno }]), []);
    assert.deepEqual(lecturasSinFiltro([{ ruta: "z.ts", texto: adrede }]), []);
  });
});

describe("productos ocultos: la casilla", () => {
  it("solo un producto con la casilla DESMARCADA se oculta", () => {
    assert.equal(productoVisible({ mostrarEnWeb: false }), false);
    assert.equal(productoVisible({ mostrarEnWeb: true }), true);
    assert.equal(productoVisible({ mostrarEnWeb: null }), true);
    assert.equal(productoVisible({}), true);
    assert.equal(productoVisible(undefined), true);
  });

  it("la caché solo se vacía cuando la casilla CAMBIA", () => {
    assert.equal(cambiaLaVisibilidad({ mostrarEnWeb: false }, { mostrarEnWeb: true }), true);
    assert.equal(cambiaLaVisibilidad({ mostrarEnWeb: true }, { mostrarEnWeb: false }), true);
    // Un registro antiguo sin valor equivale a visible.
    assert.equal(cambiaLaVisibilidad({ mostrarEnWeb: true }, {}), false);
    assert.equal(cambiaLaVisibilidad({ mostrarEnWeb: false }, null), false);
    assert.equal(cambiaLaVisibilidad({ mostrarEnWeb: true }, { mostrarEnWeb: true }), false);
  });

  it("la columna «Visible» dice Oculto solo si está desmarcada, con texto", () => {
    assert.equal(insigniaDe("visible", false)?.texto, "Oculto");
    assert.equal(insigniaDe("visible", true)?.texto, "Visible");
    assert.equal(insigniaDe("visible", null)?.texto, "Visible");
  });

  it("un producto de lubricante oculto no sale en su línea", () => {
    const grupos = agruparProductos([
      { nombre: "Uno", id: "a" },
      { nombre: "Dos", id: "b", mostrarEnWeb: false },
      { nombre: "Tres", id: "c", mostrarEnWeb: true },
    ]);
    assert.deepEqual(
      grupos.flatMap((g) => g.productos.map((p) => p.nombre)),
      ["Uno", "Tres"],
    );
  });
});
