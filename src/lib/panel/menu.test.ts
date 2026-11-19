import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ENTRADAS_DIRECTAS,
  ETIQUETAS_DEL_MENU,
  entradaActiva,
  GRUPOS_DEL_MENU,
  idDeGrupo,
  ORDEN_DE_ENTRADAS,
  ordenarMenu,
  SOLO_ADMINISTRADOR,
} from "./menu";

const g = (nombre: string, ...slugs: string[]) => ({
  nombre,
  entradas: slugs.map((slug) => ({ slug })),
});

describe("ordenarMenu", () => {
  it("pone los grupos en el orden aprobado, aunque Payload los dé en otro", () => {
    // Payload agrupa por orden de aparición y pone los globales detrás de las colecciones.
    const de_payload = [
      g("Configuración", "redirects", "users", "seo"),
      g("Mensajes recibidos", "solicitudes"),
      g("Empresa y sedes", "sedes", "vacantes-buk"),
      g("Repuestos", "marcas", "modelos-repuesto"),
    ];
    assert.deepEqual(
      ordenarMenu(de_payload).map((x) => x.nombre),
      ["Mensajes recibidos", "Repuestos", "Empresa y sedes", "Configuración"],
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
    const r = ordenarMenu([g("Nuevo grupo", "x"), g("Mensajes recibidos", "otra", "solicitudes")]);
    assert.deepEqual(
      r.map((x) => x.nombre),
      ["Mensajes recibidos", "Nuevo grupo"],
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

describe("menú nuevo (organización del panel, PR 1)", () => {
  it("toda entrada del orden tiene nombre del cliente, y lo técnico está en el orden", () => {
    for (const slug of ORDEN_DE_ENTRADAS)
      assert.ok(ETIQUETAS_DEL_MENU[slug], `«${slug}» sin nombre`);
    for (const slug of SOLO_ADMINISTRADOR) {
      assert.ok(
        (ORDEN_DE_ENTRADAS as readonly string[]).includes(slug),
        `«${slug}» no está en el menú`,
      );
    }
  });

  it("las entradas directas van a grupos del menú y tienen clave única", () => {
    for (const d of ENTRADAS_DIRECTAS) assert.ok(GRUPOS_DEL_MENU.includes(d.grupo));
    assert.equal(new Set(ENTRADAS_DIRECTAS.map((d) => d.clave)).size, ENTRADAS_DIRECTAS.length);
  });

  it("entradaActiva: la de href más largo, con el límite de Payload y la primera si empatan", () => {
    const entradas = [
      { clave: "portada", href: "/admin/collections/paginas/12" },
      { clave: "paginas", href: "/admin/collections/paginas" },
      { clave: "marcas", href: "/admin/collections/marcas" },
      { clave: "empresa", href: "/admin/globals/seo" },
      { clave: "buscadores", href: "/admin/globals/seo" },
    ];
    assert.equal(entradaActiva("/admin/collections/paginas/12", entradas), "portada");
    assert.equal(entradaActiva("/admin/collections/paginas/7", entradas), "paginas");
    assert.equal(entradaActiva("/admin/collections/paginas/120", entradas), "paginas");
    assert.equal(entradaActiva("/admin/collections/marcas-lubricante", entradas), null);
    assert.equal(entradaActiva("/admin/globals/seo", entradas), "empresa");
    assert.equal(entradaActiva("/admin", entradas), null);
  });
});
