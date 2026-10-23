import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { aplanarHaciaOcultas, marcaVisible, redirectsDeMarcasOcultas } from "./visibilidad";

const NUEVA = "/maquinaria-pesada/maquinaria-pesada-nueva";

describe("marcas de nueva ocultas: los 301", () => {
  it("marca, tipos y fichas llevan al destino de su marca, con barra final", () => {
    const r = redirectsDeMarcasOcultas(
      [{ slug: "marca-x", destino: "compactadores" }],
      [
        { marcaSlug: "marca-x", tipoSlug: "rodillos" },
        { marcaSlug: "marca-x", tipoSlug: "rodillos", equipoSlug: "rodillo-1" },
      ],
    );
    const hacia = `${NUEVA}/compactadores/`;
    assert.deepEqual(r, [
      { desde: `${NUEVA}/marcas/marca-x/`, hacia, tipo: "301" },
      { desde: `${NUEVA}/marcas/marca-x/rodillos/`, hacia, tipo: "301" },
      { desde: `${NUEVA}/marcas/marca-x/rodillos/rodillo-1/`, hacia, tipo: "301" },
    ]);
  });

  it("sin destino, al índice de maquinaria nueva", () => {
    const [r] = redirectsDeMarcasOcultas([{ slug: "marca-x", destino: null }], []);
    assert.equal(r?.hacia, `${NUEVA}/`);
  });

  it("no duplica una ruta que ya tiene redirect en la colección, ni hijos de otra marca", () => {
    const r = redirectsDeMarcasOcultas(
      [{ slug: "marca-x", destino: null }],
      [{ marcaSlug: "otra", tipoSlug: "t" }],
      [{ desde: `${NUEVA}/marcas/marca-x`, hacia: "/", tipo: "301" }],
    );
    assert.deepEqual(r, []);
  });

  it("un redirect guardado que apunta a una página oculta va directo al destino", () => {
    const ocultos = [
      { desde: `${NUEVA}/marcas/marca-x/`, hacia: `${NUEVA}/compactadores/`, tipo: "301" },
    ];
    const r = aplanarHaciaOcultas(
      [
        { desde: "/viejo-1", hacia: `${NUEVA}/marcas/marca-x`, tipo: "301" },
        { desde: "/viejo-2", hacia: "/otra/", tipo: "301" },
      ],
      ocultos,
    );
    assert.equal(r[0]?.hacia, `${NUEVA}/compactadores/`);
    assert.equal(r[1]?.hacia, "/otra/");
  });

  it("solo una marca con la casilla DESMARCADA se oculta", () => {
    assert.equal(marcaVisible({ mostrarEnWeb: false }), false);
    assert.equal(marcaVisible({ mostrarEnWeb: true }), true);
    assert.equal(marcaVisible({ mostrarEnWeb: null }), true);
    assert.equal(marcaVisible({}), true);
    assert.equal(marcaVisible(7), true);
  });
});

/*
 * GUARDARRAÍL: toda lectura PÚBLICA de marcas, tipos o equipos de nueva filtra
 * las marcas ocultas. Busca cada `collection: "<colección>"` en el código del
 * sitio (fuera de las colecciones del panel, sus ganchos y el mapa de
 * redirects, que lee las ocultas a propósito) y exige el filtro en esa misma
 * llamada (`find`, `count` o `findByID`). No ve un nombre de colección en una
 * variable: escríbelo literal. Una consulta nueva sin él sacaría a Ammann en la web.
 */
const RAIZ = path.resolve(process.cwd(), "src");
const COLECCIONES = ["marcas-maquinaria", "tipos-maquinaria", "equipos-nuevos"];
const FILTRO = /\b(MARCA_VISIBLE|DE_MARCA_VISIBLE|conMarcaVisible|conEquipoVisible)\b/;
const EXCLUIDOS = [
  path.join("src", "collections"),
  path.join("src", "app", "(payload)"),
  path.join("src", "app", "(site)", "api", "redirects-map"),
  path.join("src", "migrations"),
];

function ficheros(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ficheros(p);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });
}

/**
 * El texto de la llamada que contiene `pos` (`find`, `count` o `findByID`),
 * desde su nombre hasta el paréntesis que la cierra.
 */
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
      const re = new RegExp(`collection: "${c}"`, "g");
      for (const m of texto.matchAll(re)) {
        if (!FILTRO.test(llamada(texto, m.index ?? 0))) {
          const linea = texto.slice(0, m.index).split("\n").length;
          fallos.push(`${ruta}:${linea} (${c})`);
        }
      }
    }
  }
  return fallos;
}

describe("guardarraíl: las lecturas públicas de nueva filtran las marcas ocultas", () => {
  it("ninguna consulta del sitio se olvida del filtro", () => {
    const archivos = ficheros(RAIZ)
      .map((p) => path.relative(process.cwd(), p))
      .filter((r) => !EXCLUIDOS.some((x) => r.startsWith(x)))
      .map((ruta) => ({ ruta, texto: fs.readFileSync(ruta, "utf8") }));
    assert.ok(archivos.length > 50, "no encontró el código del sitio");
    assert.deepEqual(lecturasSinFiltro(archivos), []);
  });

  it("y falla cuando una se lo olvida (comprobación del guardián)", () => {
    const malo = `await payload.find({\n  collection: "equipos-nuevos",\n  depth: 1,\n});`;
    const bueno = `await payload.find({\n  collection: "equipos-nuevos",\n  where: conMarcaVisible({ tipo: { equals: 1 } }),\n});`;
    assert.deepEqual(lecturasSinFiltro([{ ruta: "x.ts", texto: malo }]), [
      "x.ts:2 (equipos-nuevos)",
    ]);
    assert.deepEqual(lecturasSinFiltro([{ ruta: "y.ts", texto: bueno }]), []);
    const cuenta = `await payload.count({
  collection: "marcas-maquinaria",
});`;
    assert.deepEqual(lecturasSinFiltro([{ ruta: "z.ts", texto: cuenta }]), [
      "z.ts:2 (marcas-maquinaria)",
    ]);
  });
});
