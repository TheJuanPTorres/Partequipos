import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { APARTADOS_POR_DEFECTO, type Desplegable } from "./apartados";
import {
  FUENTES,
  FUENTE_DE_TIPO_608,
  apartadosQueSalen,
  arbolDe608,
  claveDeDireccion,
  esDesplegable,
  esquemaDelMenu,
  etiquetaDeApartado,
  etiquetaDeFilaBarra,
  filasDesdeCampos,
  validarApartadosDelArbol,
  validarBarra,
  type ApartadoArbol,
  type FilaBarra,
} from "./arbol";

const DESPLEGABLES: Desplegable[] = ["maquinaria", "repuestos", "lubricantes"];

describe("árbol del menú principal (tanda 25, tarea 2)", () => {
  it("salen, en su orden: listas con fuente, enlaces fijos completos y grupos con enlaces", () => {
    const filas: ApartadoArbol[] = [
      { tipo: "lista", fuente: "repuestos-marcas", nombre: " Marcas " },
      { tipo: "lista", fuente: "categorias-tecnicas", nombre: "" },
      { tipo: "enlace", nombre: "Tienda", enlace: " https://example.com/ " },
      {
        tipo: "grupo",
        nombre: "Servicios",
        enlaces: [
          { etiqueta: "Taller", enlace: "/servicio-tecnico/#taller" },
          { etiqueta: "Oculto", enlace: "/x/", mostrar: false },
          { etiqueta: "Sin destino", enlace: " " },
          { etiqueta: "", enlace: "/y/" },
        ],
      },
    ];
    assert.deepEqual(apartadosQueSalen(filas), [
      { tipo: "lista", fuente: "repuestos-marcas", nombre: "Marcas" },
      // Sin nombre, el de su fuente.
      { tipo: "lista", fuente: "categorias-tecnicas", nombre: "Repuestos por categoría técnica" },
      { tipo: "enlace", nombre: "Tienda", enlace: "https://example.com/" },
      {
        tipo: "grupo",
        nombre: "Servicios",
        enlaces: [{ etiqueta: "Taller", enlace: "/servicio-tecnico/#taller" }],
      },
    ]);
  });

  it("no salen: ocultos, lista sin fuente o repetida, enlace incompleto, grupo vacío, tipo raro", () => {
    const filas: ApartadoArbol[] = [
      { tipo: "lista", fuente: "usada", nombre: "Usada", mostrar: false },
      { tipo: "lista", fuente: null, nombre: "Sin fuente" },
      { tipo: "lista", fuente: "inventada", nombre: "Fuente que no existe" },
      { tipo: "lista", fuente: "nueva", nombre: "Nueva" },
      { tipo: "lista", fuente: "nueva", nombre: "Nueva otra vez" },
      { tipo: "enlace", nombre: "", enlace: "/x/" },
      { tipo: "enlace", nombre: "Sin destino", enlace: "" },
      { tipo: "grupo", nombre: "Vacío", enlaces: [] },
      { tipo: "grupo", nombre: "", enlaces: [{ etiqueta: "A", enlace: "/a/" }] },
      { tipo: "otro", nombre: "X" },
      { tipo: null, nombre: "Sin tipo" },
    ];
    assert.deepEqual(apartadosQueSalen(filas), [
      { tipo: "lista", fuente: "nueva", nombre: "Nueva" },
    ]);
    assert.deepEqual(apartadosQueSalen(null), []);
    // Una lista oculta no «gasta» su fuente: la visible de después sale.
    assert.equal(
      apartadosQueSalen([
        { tipo: "lista", fuente: "usada", nombre: "A", mostrar: false },
        { tipo: "lista", fuente: "usada", nombre: "B" },
      ]).length,
      1,
    );
  });

  it("EL MENÚ DE SIEMPRE como árbol: cada apartado de la tanda 24, con su fuente y en su orden", () => {
    const fuentes = new Set<string>(FUENTES.map((f) => f.value));
    for (const d of DESPLEGABLES) {
      const arbol = arbolDe608(null, d);
      assert.equal(arbol.length, APARTADOS_POR_DEFECTO[d].length, d);
      arbol.forEach((a, i) => {
        const de608 = APARTADOS_POR_DEFECTO[d][i]!;
        assert.equal(a.nombre, de608.nombre);
        if (de608.tipo === "enlace") {
          assert.equal(a.tipo, "enlace");
          assert.equal(a.enlace, de608.enlace);
        } else {
          assert.equal(a.tipo, "lista");
          assert.equal(a.fuente, FUENTE_DE_TIPO_608[d][de608.tipo]);
          assert.ok(fuentes.has(a.fuente!), `${d}: ${a.fuente}`);
          // El nombre por defecto de la fuente es el del menú de siempre.
          assert.equal(FUENTES.find((f) => f.value === a.fuente)?.nombre, de608.nombre);
        }
      });
      assert.equal(validarApartadosDelArbol(arbol), true);
      // Lo que sale del árbol de siempre es todo.
      assert.equal(apartadosQueSalen(arbol).length, arbol.length);
    }
    // Las filas de la tanda 24 del panel mandan sobre el de siempre (ocultas y renombradas).
    assert.deepEqual(
      arbolDe608(
        [
          { tipo: "categorias", nombre: "Por categoría" },
          { tipo: "marcas", nombre: "Por marca", mostrar: false },
        ],
        "repuestos",
      ),
      [{ mostrar: true, nombre: "Por categoría", tipo: "lista", fuente: "categorias-tecnicas" }],
    );
  });

  it("el panel no deja guardar una fuente dos veces ni dos apartados con el mismo nombre", () => {
    assert.match(
      String(
        validarApartadosDelArbol([
          { tipo: "lista", fuente: "usada", nombre: "A" },
          { tipo: "enlace", nombre: "B", enlace: "/b/" },
          { tipo: "lista", fuente: "usada", nombre: "C" },
        ]),
      ),
      /está dos veces/,
    );
    assert.match(
      String(
        validarApartadosDelArbol([
          { tipo: "grupo", nombre: "Servicios" },
          { tipo: "enlace", nombre: " servicios ", enlace: "/b/" },
        ]),
      ),
      /se llaman/,
    );
    assert.equal(
      validarApartadosDelArbol([
        { tipo: "enlace", nombre: "A", enlace: "/a/" },
        { tipo: "enlace", nombre: "B", enlace: "/a/" },
      ]),
      true,
    );
    assert.equal(validarApartadosDelArbol(null), true);
  });

  it("la barra: un desplegable lleva a una ruta del sitio y no comparte dirección", () => {
    const ok: FilaBarra[] = [
      { etiqueta: "Maquinaria", enlace: "/maquinaria-pesada/", tipo: "desplegable" },
      { etiqueta: "Blog", enlace: "/noticias/", tipo: "enlace" },
      { etiqueta: "Tienda", enlace: "https://tienda.example.com/", tipo: "enlace" },
    ];
    assert.equal(validarBarra(ok), true);
    assert.match(
      String(
        validarBarra([
          { etiqueta: "Fuera", enlace: "https://x.example.com/", tipo: "desplegable" },
        ]),
      ),
      /ruta de este sitio/,
    );
    assert.match(
      String(validarBarra([{ etiqueta: "Vacío", enlace: "", tipo: "desplegable" }])),
      /ruta de este sitio/,
    );
    assert.match(
      String(
        validarBarra([
          ...ok,
          { etiqueta: "Otra", enlace: "/maquinaria-pesada?x=1", tipo: "enlace" },
        ]),
      ),
      /misma dirección/,
    );
    // Oculta, no cuenta: se puede preparar un desplegable antes de tener su destino.
    assert.equal(
      validarBarra([...ok, { etiqueta: "Luego", enlace: "", tipo: "desplegable", mostrar: false }]),
      true,
    );
    // Dos enlaces simples sí pueden compartir destino (la portada).
    assert.equal(
      validarBarra([
        { etiqueta: "Inicio", enlace: "/", tipo: "enlace" },
        { etiqueta: "Portada", enlace: "/", tipo: "enlace" },
      ]),
      true,
    );
  });

  it("qué fila abre un panel, y la clave de su dirección", () => {
    assert.equal(esDesplegable({ etiqueta: "A", enlace: "/a/", tipo: "desplegable" }), true);
    assert.equal(esDesplegable({ etiqueta: "A", enlace: "/a/", tipo: "enlace" }), false);
    assert.equal(esDesplegable({ etiqueta: "A", enlace: "/a/" }), false);
    assert.equal(
      esDesplegable({ etiqueta: "A", enlace: "/a/", tipo: "desplegable", mostrar: false }),
      false,
    );
    assert.equal(esDesplegable({ etiqueta: "", enlace: "/a/", tipo: "desplegable" }), false);
    assert.equal(
      esDesplegable({ etiqueta: "A", enlace: "https://a.example.com/", tipo: "desplegable" }),
      false,
    );
    assert.equal(claveDeDireccion(" /maquinaria-pesada?x=1#y "), "/maquinaria-pesada/");
    assert.equal(claveDeDireccion("/a/"), "/a/");
    assert.equal(claveDeDireccion(null), "");
  });

  it("las etiquetas de fila dicen qué es cada cosa aunque esté plegada", () => {
    assert.deepEqual(
      etiquetaDeFilaBarra(
        { etiqueta: "Repuestos", enlace: "/r/", tipo: "desplegable", apartados: [{}, {}, {}, {}] },
        2,
      ),
      { titulo: "Repuestos", detalle: "desplegable · 4 apartados", oculto: false },
    );
    assert.deepEqual(etiquetaDeFilaBarra({ enlace: "/blog/", mostrar: false }, 5), {
      titulo: "Enlace 05 (sin texto)",
      detalle: "enlace · /blog/",
      oculto: true,
    });
    assert.equal(
      etiquetaDeApartado({ nombre: "Por marca", tipo: "lista", fuente: "repuestos-marcas" }, 1)
        .detalle,
      "lista automática · Marcas de repuestos, con sus tipos",
    );
    assert.equal(
      etiquetaDeApartado({ nombre: "Servicios", tipo: "grupo", enlaces: [{}] }, 1).detalle,
      "grupo · 1 enlace",
    );
  });

  it("el formulario plano del panel vuelve a ser el árbol, y el esquema dice qué sale", () => {
    const filas = filasDesdeCampos({
      "enlaces.0.etiqueta": "Servicio técnico",
      "enlaces.0.enlace": "/servicio-tecnico/",
      "enlaces.0.tipo": "desplegable",
      "enlaces.0.mostrar": true,
      "enlaces.0.apartados": 2,
      "enlaces.0.apartados.0.nombre": "Servicios",
      "enlaces.0.apartados.0.tipo": "grupo",
      "enlaces.0.apartados.0.enlaces": 2,
      "enlaces.0.apartados.0.enlaces.0.etiqueta": "Taller",
      "enlaces.0.apartados.0.enlaces.0.enlace": "/servicio-tecnico/#taller",
      "enlaces.0.apartados.0.enlaces.1.etiqueta": "Siniestros",
      "enlaces.0.apartados.0.enlaces.1.enlace": "",
      "enlaces.0.apartados.1.nombre": "Usada",
      "enlaces.0.apartados.1.tipo": "lista",
      "enlaces.0.apartados.1.fuente": "usada",
      "enlaces.0.apartados.1.mostrar": false,
      "enlaces.1.etiqueta": "Blog",
      "enlaces.1.enlace": "/noticias/",
      "enlaces.1.tipo": "enlace",
      botonTexto: "Contáctanos",
    });
    assert.equal(filas.length, 2);
    assert.equal(filas[0]?.apartados?.[0]?.enlaces?.[1]?.etiqueta, "Siniestros");
    const esquema = esquemaDelMenu(filas).map(
      (l) => `${l.nivel}${l.sale ? "+" : "-"} ${l.texto}${l.motivo ? ` (${l.motivo})` : ""}`,
    );
    assert.deepEqual(esquema, [
      "1+ Servicio técnico",
      "2+ Servicios",
      "3+ Taller",
      "3- Siniestros (incompleto)",
      "2- Usada (oculto)",
      "1+ Blog",
    ]);
    assert.deepEqual(esquemaDelMenu(null), []);
  });
  it("LA MIGRACIÓN COPIA EL MENÚ DE HOY: mismas fuentes que la tanda 24 y, sin filas, el de siempre", () => {
    // La migración no puede importar nada de `src/` (CLAUDE.md §3.5): se compara su SQL.
    const sql = readFileSync("src/migrations/20261126_154909_menu_arbol.ts", "utf8");
    // 1. Cada tipo automático de la tanda 24 pasa a su fuente (los `CASE … WHEN … THEN …`).
    const casos = [
      ...sql.matchAll(/\(CASE a\."tipo"::text ((?:WHEN '[a-z-]+' THEN '[a-z-]+' ?)+)END\)/g),
    ];
    assert.equal(casos.length, DESPLEGABLES.length);
    DESPLEGABLES.forEach((d, i) => {
      const pares = Object.fromEntries(
        [...casos[i]![1]!.matchAll(/WHEN '([a-z-]+)' THEN '([a-z-]+)'/g)].map((m) => [m[1], m[2]]),
      );
      assert.deepEqual(pares, FUENTE_DE_TIPO_608[d], d);
    });
    // 2. Con la lista de la tanda 24 vacía, siembra el menú de siempre (los `VALUES`), que es
    //    lo que pinta el código sin apartados (`arbolDe608(null, …)`).
    const filas = [
      ...sql.matchAll(
        /\((\d), '([^']+)', '(lista|enlace)', (?:'([a-z-]+)'|NULL), (?:'([^']+)'|NULL)\)/g,
      ),
    ].map((m) => ({ orden: Number(m[1]), nombre: m[2], tipo: m[3], fuente: m[4], enlace: m[5] }));
    const grupos: (typeof filas)[] = [];
    for (const f of filas) {
      if (f.orden === 1) grupos.push([]);
      grupos.at(-1)!.push(f);
    }
    assert.equal(grupos.length, DESPLEGABLES.length);
    DESPLEGABLES.forEach((d, i) => {
      assert.deepEqual(
        grupos[i]!.map(({ orden, ...resto }) => {
          void orden;
          return resto;
        }),
        arbolDe608(null, d).map((a) => ({
          nombre: a.nombre,
          tipo: a.tipo,
          fuente: a.fuente ?? undefined,
          enlace: a.enlace ?? undefined,
        })),
        d,
      );
      assert.deepEqual(
        grupos[i]!.map((f) => f.orden),
        grupos[i]!.map((_, n) => n + 1),
      );
    });
    // 3. Las tres direcciones de siempre, y la siembra solo si la lista de la tanda 24 está vacía.
    for (const direccion of [
      "'/maquinaria-pesada/'",
      "'/repuestos-maquinaria-pesada-colombia/'",
      "'/lubricantes/'",
    ]) {
      assert.ok(sql.includes(`= ${direccion}`), direccion);
    }
    assert.equal(sql.match(/AND NOT EXISTS \(SELECT 1 FROM "cabecera_menu_/g)?.length, 3);
    // No borra nada de la tanda 24.
    assert.ok(!/DROP TABLE "cabecera_menu_|DROP COLUMN "politica_/.test(sql));
  });
});
