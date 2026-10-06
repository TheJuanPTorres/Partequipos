import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  avisosDePortada,
  etiquetaEditor,
  tarjetasDePortada,
  ultimosModificados,
  type EntidadPortada,
} from "./portada";

const base = { sinFotos: {}, etiquetas: {}, indexacionPermitida: true };

describe("avisosDePortada", () => {
  it("sin nada que atender, no hay avisos", () => {
    assert.deepEqual(avisosDePortada(base), []);
  });

  it("cada aviso enlaza a la lista filtrada con el mismo criterio que cuenta", () => {
    const avisos = avisosDePortada({
      ...base,
      sinFotos: { "equipos-nuevos": 3 },
      etiquetas: { "equipos-nuevos": "Equipos nuevos" },
      solicitudesNuevas: 1,
      altFlojos: 2,
      redireccionesRotas: 1,
      indexacionPermitida: false,
    });
    assert.deepEqual(
      avisos.map((a) => a.clave),
      ["solicitudes", "redirecciones", "sin-fotos-equipos-nuevos", "alt", "buscadores"],
    );
    assert.equal(avisos[0]?.texto, "1 solicitud nueva sin atender.");
    assert.equal(
      avisos[0]?.enlace?.href,
      "/admin/collections/solicitudes?where[estado][equals]=nueva",
    );
    assert.equal(
      avisos[2]?.texto,
      "3 fichas de equipos nuevos sin fotos: en el sitio salen sin imagen.",
    );
    assert.equal(
      avisos[2]?.enlace?.href,
      "/admin/collections/equipos-nuevos?where[imagenes][exists]=false",
    );
    assert.equal(avisos[4]?.enlace, undefined);
  });

  it("un aviso de una colección que el usuario no ve no sale (undefined)", () => {
    assert.deepEqual(avisosDePortada({ ...base, solicitudesNuevas: undefined }), []);
  });
});

describe("tarjetasDePortada", () => {
  const e = (slug: string, grupo: string, tipo: "collection" | "global" = "collection") =>
    ({ slug, grupo, tipo, etiqueta: slug, puedeCrear: tipo === "collection" }) as EntidadPortada;

  it("ordena como el menú: «Partes del sitio» antes que «Configuración»", () => {
    const t = tarjetasDePortada(
      [
        e("redirects", "Configuración"),
        e("seo", "Configuración", "global"),
        e("pie", "Partes del sitio", "global"),
        e("solicitudes", "Solicitudes"),
      ],
      { redirects: 10, solicitudes: 4 },
    );
    assert.deepEqual(
      t.map((x) => x.nombre),
      ["Solicitudes", "Partes del sitio", "Configuración"],
    );
    const config = t[2]!;
    assert.deepEqual(
      config.entradas.map((x) => x.slug),
      ["seo", "redirects"],
    );
    assert.equal(config.entradas[0]?.contador, null, "un global no lleva contador");
    assert.equal(config.entradas[0]?.href, "/admin/globals/seo");
    assert.equal(config.entradas[1]?.hrefCrear, "/admin/collections/redirects/create");
  });

  it("sin permiso de crear, no hay enlace de crear", () => {
    const [t] = tarjetasDePortada([{ ...e("media", "Archivos"), puedeCrear: false }], { media: 3 });
    assert.equal(t?.entradas[0]?.hrefCrear, null);
  });
});

describe("ultimosModificados", () => {
  const r = (slug: string, actualizado: string) => ({
    slug,
    coleccion: slug,
    titulo: slug,
    href: `/admin/collections/${slug}/1`,
    actualizado,
    editor: "—",
  });

  it("junta, ordena por fecha y deja fuera solicitudes y usuarios", () => {
    const u = ultimosModificados(
      [
        [r("articulos", "2026-10-01T00:00:00Z")],
        [r("solicitudes", "2026-10-06T00:00:00Z"), r("users", "2026-10-05T00:00:00Z")],
        [r("media", "2026-10-03T00:00:00Z")],
      ],
      8,
    );
    assert.deepEqual(
      u.map((x) => x.slug),
      ["media", "articulos"],
    );
  });
});

describe("etiquetaEditor", () => {
  it("uno mismo, un usuario legible, uno no legible y sin dato", () => {
    assert.equal(etiquetaEditor(5, 5), "ti");
    assert.equal(etiquetaEditor({ id: 5, email: "yo@x.co" }, 5), "ti");
    assert.equal(etiquetaEditor({ id: 7, email: "otra@x.co" }, 5), "otra@x.co");
    assert.equal(etiquetaEditor(7, 5), "otra persona del equipo");
    assert.equal(etiquetaEditor(null, 5), "—");
    assert.equal(etiquetaEditor(undefined, 5), "—");
  });
});
