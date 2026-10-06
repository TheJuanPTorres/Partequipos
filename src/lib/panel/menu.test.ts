import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GRUPOS_DEL_MENU, idDeGrupo, ORDEN_DE_ENTRADAS, ordenarMenu } from "./menu";

const g = (nombre: string, ...slugs: string[]) => ({
  nombre,
  entradas: slugs.map((slug) => ({ slug })),
});

describe("ordenarMenu", () => {
  it("pone los grupos en el orden aprobado, aunque Payload los dé en otro", () => {
    // Payload pone los globales detrás de las colecciones: «Partes del sitio»
    // (solo globales) llegaría detrás de «Configuración».
    const de_payload = [
      g("Configuración", "redirects", "users", "seo"),
      g("Solicitudes", "solicitudes"),
      g("Partes del sitio", "cabecera", "pie"),
      g("Repuestos", "marcas", "modelos-repuesto"),
    ];
    assert.deepEqual(
      ordenarMenu(de_payload).map((x) => x.nombre),
      ["Solicitudes", "Repuestos", "Partes del sitio", "Configuración"],
    );
  });

  it("ordena las entradas: la ficha primero y el global de SEO al inicio de Configuración", () => {
    const r = ordenarMenu([
      g("Configuración", "redirects", "users", "seo"),
      g("Repuestos", "marcas", "tipos-equipo", "modelos-repuesto"),
    ]);
    const config = r.find((x) => x.nombre === "Configuración");
    const repuestos = r.find((x) => x.nombre === "Repuestos");
    assert.ok(config && repuestos);
    assert.deepEqual(
      config.entradas.map((e) => e.slug),
      ["seo", "redirects", "users"],
    );
    assert.deepEqual(
      repuestos.entradas.map((e) => e.slug),
      ["modelos-repuesto", "marcas", "tipos-equipo"],
    );
  });

  it("lo desconocido va al final y no se pierde (comprobación del guardián)", () => {
    const r = ordenarMenu([g("Nuevo grupo", "x"), g("Solicitudes", "otra", "solicitudes")]);
    assert.deepEqual(
      r.map((x) => x.nombre),
      ["Solicitudes", "Nuevo grupo"],
    );
    assert.deepEqual(
      r[0]?.entradas.map((e) => e.slug),
      ["solicitudes", "otra"],
    );
  });

  it("no hay duplicados en las listas", () => {
    assert.equal(new Set(GRUPOS_DEL_MENU).size, GRUPOS_DEL_MENU.length);
    assert.equal(new Set(ORDEN_DE_ENTRADAS).size, ORDEN_DE_ENTRADAS.length);
  });
});

describe("idDeGrupo", () => {
  it("da ids sin espacios ni tildes, distintos para cada grupo", () => {
    assert.equal(idDeGrupo("Páginas y blog"), "paginas-y-blog");
    assert.equal(idDeGrupo("Configuración"), "configuracion");
    const ids = GRUPOS_DEL_MENU.map(idDeGrupo);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
  });
});
