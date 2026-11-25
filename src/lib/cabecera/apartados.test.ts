import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  APARTADOS_POR_DEFECTO,
  TIPOS_APARTADO,
  apartadosVisibles,
  validarApartados,
  type Desplegable,
} from "./apartados";

const DESPLEGABLES: Desplegable[] = ["maquinaria", "repuestos", "lubricantes"];
const LETRA: Record<Desplegable, string> = { maquinaria: "a", repuestos: "b", lubricantes: "c" };

describe("apartados del menú principal (tanda 24, tarea 1)", () => {
  it("el menú de siempre usa solo tipos de su desplegable, y cada automático una vez", () => {
    for (const d of DESPLEGABLES) {
      const validos = new Set<string>(TIPOS_APARTADO[d].map((t) => t.value));
      for (const a of APARTADOS_POR_DEFECTO[d]) assert.ok(validos.has(a.tipo!), `${d}: ${a.tipo}`);
      assert.equal(validarApartados(APARTADOS_POR_DEFECTO[d], d), true);
      // Lista vacía o sin dato: el de siempre.
      assert.equal(apartadosVisibles([], d).length, APARTADOS_POR_DEFECTO[d].length);
      assert.equal(apartadosVisibles(null, d).length, APARTADOS_POR_DEFECTO[d].length);
    }
  });

  it("LA MIGRACIÓN SIEMBRA EL MENÚ DE SIEMPRE: los mismos nombres y tipos, en el mismo orden", () => {
    // La migración no puede importar esta lista (CLAUDE.md §3.5): se compara su SQL con ella. Si
    // alguien cambia `APARTADOS_POR_DEFECTO`, una base sembrada y una sin sembrar pintarían distinto.
    const sql = readFileSync("src/migrations/20261125_213752_menu_apartados.ts", "utf8");
    const filas = [...sql.matchAll(/\((\d), '6926213752([abc])0+\d', '([^']+)', '([a-z-]+)'\)/g)];
    for (const d of DESPLEGABLES) {
      const sembradas = filas
        .filter((m) => m[2] === LETRA[d])
        .map((m) => ({ orden: Number(m[1]), nombre: m[3], tipo: m[4] }));
      const esperadas = APARTADOS_POR_DEFECTO[d]
        .map((a, i) => ({ orden: i + 1, nombre: a.nombre, tipo: a.tipo }))
        // La política de garantías se siembra aparte, desde sus columnas de `cabecera`.
        .filter((a) => a.tipo !== "enlace");
      assert.deepEqual(sembradas, esperadas, d);
    }
    const politica = APARTADOS_POR_DEFECTO.repuestos.at(-1)!;
    assert.equal(politica.tipo, "enlace");
    assert.ok(sql.includes(`'${politica.nombre}')`), "el texto de respaldo de la política");
    assert.ok(sql.includes(`'${politica.enlace}')`), "el enlace de respaldo de la política");
  });

  it("un automático sin nombre lleva el de siempre; un enlace fijo sin nombre o sin destino no sale", () => {
    assert.deepEqual(
      apartadosVisibles(
        [
          { tipo: "marcas", nombre: "  " },
          { tipo: "enlace", nombre: "Tienda", enlace: " https://example.com/ " },
          { tipo: "enlace", nombre: "", enlace: "/x/" },
          { tipo: "enlace", nombre: "Sin destino", enlace: " " },
        ],
        "repuestos",
      ),
      [
        { tipo: "marcas", nombre: "Repuestos por marca", enlace: "" },
        { tipo: "enlace", nombre: "Tienda", enlace: "https://example.com/" },
      ],
    );
  });

  it("el panel no deja guardar una lista automática dos veces; los enlaces fijos sí se repiten", () => {
    const repetida = [
      { tipo: "marcas", nombre: "A" },
      { tipo: "enlace", nombre: "B", enlace: "/b/" },
      { tipo: "enlace", nombre: "C", enlace: "/c/" },
      { tipo: "marcas", nombre: "D" },
    ];
    assert.match(String(validarApartados(repetida, "repuestos")), /dos veces/);
    assert.equal(validarApartados(repetida.slice(0, 3), "repuestos"), true);
    assert.equal(validarApartados(null, "repuestos"), true);
    // Dos apartados con el mismo nombre (aunque cambien mayúsculas o espacios), tampoco.
    const mismoNombre = [
      { tipo: "marcas", nombre: "Marcas" },
      { tipo: "enlace", nombre: " marcas ", enlace: "/b/" },
    ];
    assert.match(String(validarApartados(mismoNombre, "repuestos")), /se llaman/);
  });
});
