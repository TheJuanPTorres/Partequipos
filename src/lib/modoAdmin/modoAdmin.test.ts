import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { hrefDe, mapaDePortada, mapaDeUsada, puedeEditar, respuestaDelMapa } from "./mapa";
import { responderMapa, type Busquedas } from "./responder";
import { clasificarRuta, rutaValida } from "./ruta";

const ADMIN = { rol: "administrador", email: "admin@ejemplo.test" };
const EDITOR = { rol: "editor", email: "editor@ejemplo.test" };
const TODO = {
  collections: {
    paginas: { update: true },
    "equipos-usados": { update: { permission: true } },
    sedes: { update: true },
    testimonios: { update: true },
    "preguntas-frecuentes": { update: true },
  },
};

function busquedas(ids: { portada?: number | null; usada?: number | null } = {}) {
  const llamadas: string[] = [];
  const b: Busquedas = {
    idDePortada: async () => {
      llamadas.push("portada");
      return ids.portada === undefined ? 7 : ids.portada;
    },
    idDeUsada: async (slug) => {
      llamadas.push(`usada:${slug}`);
      return ids.usada === undefined ? 27 : ids.usada;
    },
    borradorDeUsada: (id) => `/vista-previa/equipos-usados/${id}/`,
  };
  return { b, llamadas };
}

describe("modo administración: la ruta", () => {
  it("acepta rutas del sitio y les pone la barra final", () => {
    assert.equal(rutaValida("/"), "/");
    assert.equal(rutaValida("/nosotros"), "/nosotros/");
    assert.equal(rutaValida("/a-b/c-1/"), "/a-b/c-1/");
  });

  it("rechaza URL, saltos de carpeta, codificados, mayúsculas, query y rutas largas", () => {
    for (const mala of [
      null,
      undefined,
      42,
      "",
      "nosotros/",
      "//otro-sitio.test/",
      "https://otro-sitio.test/",
      "/../admin/",
      "/a/../b/",
      "/a/./b/",
      "/a//b/",
      "/%2e%2e/admin/",
      "/a\\b/",
      "/Nosotros/",
      "/a b/",
      "/a/?x=1",
      "/a/#b",
      "/a_b/",
      "/-a/",
      `/${"a".repeat(200)}/`,
    ]) {
      assert.equal(rutaValida(mala), null, String(mala));
    }
  });

  it("clasifica la portada y la ficha de una usada; lo demás es «otra»", () => {
    assert.deepEqual(clasificarRuta("/"), { tipo: "portada" });
    assert.deepEqual(
      clasificarRuta(
        "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/excavadora-ejemplo-2019/",
      ),
      { tipo: "usada", categoria: "excavadoras", slug: "excavadora-ejemplo-2019" },
    );
    for (const otra of [
      "/nosotros/",
      "/maquinaria-pesada/maquinaria-pesada-usada/",
      "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/",
      "/maquinaria-pesada/maquinaria-pesada-usada/marcas/hitachi/",
      "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/pagina/",
      "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/pagina/2/",
      "/admin/collections/users/",
    ]) {
      assert.deepEqual(clasificarRuta(otra), { tipo: "otra" }, otra);
    }
  });
});

describe("modo administración: la respuesta del endpoint", () => {
  it("sin sesión, o con un usuario sin rol de personal, 401 y sin consultar nada", async () => {
    for (const usuario of [null, undefined, {}, { rol: "cliente" }, { email: "x@ejemplo.test" }]) {
      const { b, llamadas } = busquedas();
      const r = await responderMapa({ usuario, permisos: TODO, ruta: "/", busquedas: b });
      assert.equal(r.status, 401);
      assert.deepEqual(llamadas, []);
      assert.deepEqual(Object.keys(r.cuerpo), ["error"]);
    }
  });

  it("con sesión y una ruta inválida, 400 y sin consultar nada", async () => {
    const { b, llamadas } = busquedas();
    const r = await responderMapa({
      usuario: ADMIN,
      permisos: TODO,
      ruta: "/../admin/",
      busquedas: b,
    });
    assert.equal(r.status, 400);
    assert.deepEqual(llamadas, []);
  });

  it("una ruta válida que no se conoce: mapa vacío, sin consultar la base", async () => {
    const { b, llamadas } = busquedas();
    const r = await responderMapa({
      usuario: ADMIN,
      permisos: TODO,
      ruta: "/nosotros/",
      busquedas: b,
    });
    assert.equal(r.status, 200);
    assert.deepEqual(llamadas, []);
    assert.deepEqual(r.cuerpo, { pagina: null, borrador: null, bloques: [], usuario: ADMIN.email });
  });

  it("la portada: la página y sus bloques, con enlaces al panel", async () => {
    const { b } = busquedas({ portada: 7 });
    const r = await responderMapa({ usuario: ADMIN, permisos: TODO, ruta: "/", busquedas: b });
    assert.equal(r.status, 200);
    if (r.status !== 200) return;
    assert.deepEqual(r.cuerpo.pagina, {
      etiqueta: "la portada",
      href: "/admin/collections/paginas/7",
    });
    assert.equal(r.cuerpo.bloques.length, 10);
    assert.ok(
      r.cuerpo.bloques.some((x) => x.href === "/admin/collections/paginas/7?campo=seccionUsada"),
    );
    assert.ok(r.cuerpo.bloques.some((x) => x.href === "/admin/collections/sedes"));
  });

  it("una usada: su ficha, su pestaña y su borrador", async () => {
    const { b, llamadas } = busquedas({ usada: 27 });
    const r = await responderMapa({
      usuario: EDITOR,
      permisos: TODO,
      ruta: "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/excavadora-ejemplo-2019",
      busquedas: b,
    });
    assert.deepEqual(llamadas, ["usada:excavadora-ejemplo-2019"]);
    assert.equal(r.status, 200);
    if (r.status !== 200) return;
    assert.equal(r.cuerpo.pagina?.href, "/admin/collections/equipos-usados/27");
    assert.equal(r.cuerpo.borrador, "/vista-previa/equipos-usados/27/");
    assert.ok(
      r.cuerpo.bloques.every((x) => x.href.startsWith("/admin/collections/equipos-usados/27?")),
    );
  });

  it("un documento que ese usuario no puede LEER no da ningún bloque", async () => {
    const { b } = busquedas({ portada: null, usada: null });
    for (const ruta of ["/", "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/x/"]) {
      const r = await responderMapa({ usuario: EDITOR, permisos: TODO, ruta, busquedas: b });
      assert.deepEqual(r.cuerpo, {
        pagina: null,
        borrador: null,
        bloques: [],
        usuario: EDITOR.email,
      });
    }
  });

  it("un Editor solo ve los botones de lo que puede EDITAR", async () => {
    // Puede editar las sedes y las preguntas; la página «inicio» y los testimonios, no.
    const permisos = {
      collections: {
        paginas: { read: true },
        sedes: { update: true },
        testimonios: { update: false },
        "preguntas-frecuentes": { update: { permission: true } },
        "equipos-usados": { update: { permission: false } },
      },
    };
    const { b } = busquedas();
    const portada = await responderMapa({ usuario: EDITOR, permisos, ruta: "/", busquedas: b });
    assert.equal(portada.status, 200);
    if (portada.status !== 200) return;
    assert.equal(portada.cuerpo.pagina, null);
    assert.deepEqual(
      portada.cuerpo.bloques.map((x) => x.href),
      ["/admin/collections/sedes", "/admin/collections/preguntas-frecuentes"],
    );
    const usada = await responderMapa({
      usuario: EDITOR,
      permisos,
      ruta: "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/x/",
      busquedas: b,
    });
    assert.deepEqual(usada.cuerpo, {
      pagina: null,
      borrador: null,
      bloques: [],
      usuario: EDITOR.email,
    });
  });

  it("sin permisos (o con un filtro en lugar de un sí), no se puede editar", () => {
    const destino = { coleccion: "paginas", id: 1 };
    for (const permisos of [
      null,
      undefined,
      {},
      { collections: {} },
      { collections: { paginas: {} } },
      { collections: { paginas: { update: false } } },
      { collections: { paginas: { update: { permission: false } } } },
      { collections: { paginas: { update: { where: {} } } } },
      // La forma real de un permiso con filtro en Payload 3.89.
      { collections: { paginas: { update: { permission: true, where: { id: { equals: 1 } } } } } },
      { collections: { paginas: { update: "true" } } },
      { globals: { paginas: { update: true } } },
    ]) {
      assert.equal(puedeEditar(permisos, destino), false, JSON.stringify(permisos));
    }
    assert.equal(puedeEditar({ globals: { pie: { update: true } } }, { global: "pie" }), true);
  });

  it("la respuesta solo lleva selector, etiqueta y enlace: ningún campo del documento", () => {
    const r = respuestaDelMapa(mapaDeUsada(27, "/vista-previa/equipos-usados/27/"), TODO);
    assert.deepEqual(Object.keys(r).sort(), ["bloques", "borrador", "pagina"]);
    for (const bloque of r.bloques) {
      assert.deepEqual(Object.keys(bloque).sort(), ["etiqueta", "href", "selector"]);
      assert.match(bloque.href, /^\/admin\/collections\/equipos-usados\/27\?/);
    }
    for (const bloque of respuestaDelMapa(mapaDePortada(7), TODO).bloques) {
      assert.match(bloque.href, /^\/admin\/collections\/[a-z-]+(\/7\?campo=[A-Za-z]+)?$/);
    }
  });

  it("un destino raro no da enlace", () => {
    assert.equal(hrefDe({ lista: "../users" }), null);
    assert.equal(hrefDe({ coleccion: "paginas", id: "1/../../x" }), null);
  });
});

describe("modo administración: nada llega a un visitante", () => {
  const raiz = path.resolve(import.meta.dirname, "../../..");
  const leer = (relativa: string) => readFileSync(path.join(raiz, relativa), "utf8");

  function ficheros(carpeta: string): string[] {
    return readdirSync(carpeta).flatMap((nombre) => {
      const ruta = path.join(carpeta, nombre);
      if (statSync(ruta).isDirectory()) return ficheros(ruta);
      return /\.(ts|tsx|mjs)$/.test(nombre) ? [ruta] : [];
    });
  }

  it("el módulo solo se alcanza por el import dinámico del cargador", () => {
    const cargador = leer("src/components/modoAdmin/CargadorModoAdmin.tsx");
    // El cargador no importa el módulo de forma estática: solo `import("./ModoAdmin")`.
    assert.match(cargador, /import\("\.\/ModoAdmin"\)/);
    assert.doesNotMatch(cargador, /^import .*from "\.\/(?!$)/m);
    assert.doesNotMatch(cargador, /from "@\/lib\/modoAdmin\/(?!pista")/);

    // Fuera de su carpeta, lo único que se importa del modo administración es el cargador.
    const carpeta = path.join(raiz, "src", "components", "modoAdmin");
    for (const fichero of ficheros(path.join(raiz, "src"))) {
      if (fichero.startsWith(carpeta) || fichero.endsWith(".test.ts")) continue;
      const texto = readFileSync(fichero, "utf8");
      for (const m of texto.matchAll(/components\/modoAdmin\/([A-Za-z]+)/g)) {
        assert.equal(m[1], "CargadorModoAdmin", `${path.relative(raiz, fichero)} importa ${m[1]}`);
      }
    }
  });

  it("el cargador no hace peticiones ni pinta nada por su cuenta", () => {
    const cargador = leer("src/components/modoAdmin/CargadorModoAdmin.tsx");
    assert.doesNotMatch(cargador, /fetch\(/);
    assert.match(cargador, /hayPista\(\)/);
  });

  it("el layout del sitio monta el cargador, y nada más del modo administración", () => {
    const layout = leer("src/app/(site)/layout.tsx");
    assert.match(layout, /<CargadorModoAdmin \/>/);
    assert.equal([...layout.matchAll(/modoAdmin/g)].length, 1);
  });

  it("el QA anónimo reconoce el módulo de verdad (no pasa en vacío si se renombra algo)", () => {
    const qa = leer("scripts/qa/modo-admin.mjs");
    // Las tres marcas por las que el QA reconoce el módulo dentro de un script.
    const marcas = ["pqma-franja", "api/modo-admin/mapa", "pqma-editar"];
    const lista = qa.slice(
      qa.indexOf("const MODULO = ["),
      qa.indexOf("];", qa.indexOf("const MODULO = [")),
    );
    const modulo = ["ModoAdmin.tsx", "MarcasEdicion.tsx", "estilos.ts"]
      .map((f) => leer(`src/components/modoAdmin/${f}`))
      .join(" ");
    // El cargador sí llega a todos: sin sus comentarios, no puede llevar ninguna.
    const cargador = leer("src/components/modoAdmin/CargadorModoAdmin.tsx")
      .split("\n")
      .filter((linea) => !/^\s*(\/\*|\*|\/\/)/.test(linea))
      .join(" ");
    assert.equal(
      lista.split("/,").length,
      marcas.length,
      "el QA y esta prueba no llevan las mismas marcas",
    );
    for (const marca of marcas) {
      assert.ok(lista.includes(marca.replaceAll("/", "\\/")), `el QA ya no busca «${marca}»`);
      assert.ok(modulo.includes(marca), `el módulo ya no contiene «${marca}»`);
      assert.ok(!cargador.includes(marca), `el cargador lleva «${marca}»`);
    }
  });

  it("la franja no se pinta hasta que el mapa (que exige rol de personal) responde bien", () => {
    const modulo = leer("src/components/modoAdmin/ModoAdmin.tsx");
    assert.match(modulo, /if \(sesion !== "si" \|\| !confirmado\) return null;/);
  });

  it("la ruta del mapa no se cachea y consulta con el acceso del usuario", () => {
    const ruta = leer("src/app/(site)/api/modo-admin/mapa/route.ts");
    assert.match(ruta, /export const dynamic = "force-dynamic"/);
    assert.match(ruta, /"cache-control": "no-store"/);
    assert.match(ruta, /overrideAccess: false/);
    assert.doesNotMatch(ruta, /unstable_cache|export async function (POST|PUT|PATCH|DELETE)/);
    assert.doesNotMatch(ruta, /payload\.(create|update|delete)/);
  });
});
