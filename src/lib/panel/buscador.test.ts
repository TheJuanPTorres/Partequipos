import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COLECCIONES_BUSCABLES,
  coincide,
  esAtajoPaleta,
  fichasDeRespuesta,
  filtrarComandos,
  normalizar,
  urlBusqueda,
  type Comando,
} from "./buscador";

const c = (id: string, tipo: Comando["tipo"], etiqueta: string, contexto?: string): Comando => ({
  id,
  tipo,
  etiqueta,
  contexto,
  href: `/admin/${id}`,
});

describe("buscador del panel: texto", () => {
  it("normaliza tildes, mayúsculas, signos y espacios", () => {
    assert.equal(normalizar("  Máquinas   USADAS, «ZX350H-5B» "), "maquinas usadas zx350h 5b");
    assert.equal(normalizar("Compañía"), "compania");
  });

  it("cada palabra escrita tiene que estar, en cualquier orden", () => {
    assert.equal(coincide("Excavadora Hitachi ZX350H", "hitachi exca"), true);
    assert.equal(coincide("Excavadora Hitachi ZX350H", "hitachi cat"), false);
    assert.equal(coincide("Cualquier cosa", "  "), true);
  });
});

describe("buscador del panel: comandos", () => {
  const comandos = [
    c("s1", "seccion", "Solicitudes", "Mensajes recibidos"),
    c("s2", "seccion", "Máquinas usadas", "Maquinaria"),
    c("s3", "seccion", "Marcas de maquinaria nueva", "Maquinaria"),
    c("a1", "accion", "Crear equipo usado"),
    c("f1", "ficha", "Excavadora usada de ejemplo", "Máquina usada"),
  ];

  it("ordena por tipo: secciones, acciones y fichas", () => {
    assert.deepEqual(
      filtrarComandos(comandos, "usad").map((x) => x.id),
      ["s2", "a1", "f1"],
    );
  });

  it("también busca en el contexto (el grupo del menú)", () => {
    assert.deepEqual(
      filtrarComandos(comandos, "maquinaria").map((x) => x.id),
      ["s3", "s2"],
    );
  });

  it("vacío: todo, en el orden de entrada, con el máximo por tipo", () => {
    assert.deepEqual(
      filtrarComandos(comandos, "", 1).map((x) => x.id),
      ["s1", "a1", "f1"],
    );
  });

  it("sin coincidencias, nada", () => {
    assert.deepEqual(filtrarComandos(comandos, "zzz"), []);
  });
});

describe("buscador del panel: fichas por la API", () => {
  const usadas = COLECCIONES_BUSCABLES[0]!;
  const nuevas = COLECCIONES_BUSCABLES.find((x) => x.slug === "equipos-nuevos")!;

  it("busca por nombre o código, solo el título, sin profundidad", () => {
    const url = urlBusqueda("/api", nuevas, " zx350 ")!;
    const p = new URL(url, "https://x.test").searchParams;
    assert.ok(url.startsWith("/api/equipos-nuevos?"));
    assert.equal(p.get("where[or][0][nombre][like]"), "zx350");
    assert.equal(p.get("where[or][1][codigo][like]"), "zx350");
    assert.equal(p.get("depth"), "0");
    assert.equal(p.get("select[nombre]"), "true");
  });

  it("con menos de dos letras no pide nada", () => {
    assert.equal(urlBusqueda("/api", usadas, " z "), null);
  });

  it("nunca busca en solicitudes ni usuarios (datos personales)", () => {
    const slugs = COLECCIONES_BUSCABLES.map((x) => x.slug);
    assert.ok(!slugs.includes("solicitudes"));
    assert.ok(!slugs.includes("users"));
  });

  it("convierte la respuesta en fichas con enlace a su ficha del panel", () => {
    const r = { docs: [{ id: 27, nombre: "Excavadora de ejemplo" }, { id: 3 }, { nada: 1 }] };
    assert.deepEqual(fichasDeRespuesta("/admin", usadas, r), [
      {
        id: "ficha-equipos-usados-27",
        tipo: "ficha",
        etiqueta: "Excavadora de ejemplo",
        contexto: "Máquina usada",
        href: "/admin/collections/equipos-usados/27",
      },
      {
        id: "ficha-equipos-usados-3",
        tipo: "ficha",
        etiqueta: "#3",
        contexto: "Máquina usada",
        href: "/admin/collections/equipos-usados/3",
      },
    ]);
    assert.deepEqual(fichasDeRespuesta("/admin", usadas, { errors: [] }), []);
    assert.deepEqual(fichasDeRespuesta("/admin", usadas, null), []);
  });
});

describe("buscador del panel: atajo", () => {
  const t = (key: string, o: Partial<Parameters<typeof esAtajoPaleta>[0]> = {}) =>
    esAtajoPaleta({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...o });

  it("Ctrl+K o Cmd+K, y nada más", () => {
    assert.equal(t("k", { ctrlKey: true }), true);
    assert.equal(t("K", { metaKey: true }), true);
    assert.equal(t("k"), false);
    assert.equal(t("k", { ctrlKey: true, shiftKey: true }), false);
    assert.equal(t("j", { ctrlKey: true }), false);
  });
});
