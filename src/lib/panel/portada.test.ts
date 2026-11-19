import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  accionesHabituales,
  avisosDePortada,
  mensajesRecientes,
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

  it("ordena como el menú: «Empresa y sedes» antes que «Configuración»", () => {
    const t = tarjetasDePortada(
      [
        e("redirects", "Configuración"),
        e("seo", "Configuración", "global"),
        e("vacantes-buk", "Empresa y sedes", "global"),
        e("solicitudes", "Mensajes recibidos"),
      ],
      { redirects: 10, solicitudes: 4 },
    );
    assert.deepEqual(
      t.map((x) => x.nombre),
      ["Mensajes recibidos", "Empresa y sedes", "Configuración"],
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
    const [t] = tarjetasDePortada([{ ...e("media", "Configuración"), puedeCrear: false }], {
      media: 3,
    });
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

describe("avisos nuevos de la fase 2 (PR 6)", () => {
  it("salen en su orden y enlazan con el mismo criterio que cuentan", () => {
    const avisos = avisosDePortada({
      ...base,
      etiquetas: { "equipos-usados": "Equipos usados", "equipos-nuevos": "Equipos nuevos" },
      fotosPequenas: 12,
      sinDescripcion: { "equipos-usados": 4 },
      sinSeo: { "equipos-nuevos": 101 },
      busquedasSinResultado: 1,
      altFlojos: 2,
      indexacionPermitida: false,
    });
    assert.deepEqual(
      avisos.map((a) => a.clave),
      [
        "fotos-pequenas",
        "sin-descripcion-equipos-usados",
        "alt",
        "sin-seo-equipos-nuevos",
        "busquedas",
        "buscadores",
      ],
    );
    assert.equal(
      avisos[0]?.texto,
      "12 fotos de las galerías de las fichas miden menos de 1.200 px de ancho: en pantallas grandes se ven borrosas.",
    );
    assert.equal(avisos[0]?.enlace?.href, "/admin/collections/media?where[width][less_than]=1200");
    assert.equal(avisos[1]?.texto, "4 fichas de equipos usados sin descripción.");
    assert.match(avisos[1]?.enlace?.href ?? "", /where\[or\]\[0\]\[descripcion\]\[exists\]=false/);
    assert.equal(avisos[3]?.tono, "info");
    assert.match(avisos[3]?.enlace?.href ?? "", /seo\.metaDescription/);
    assert.equal(
      avisos[4]?.texto,
      "1 búsqueda de los visitantes sin resultado: puede faltar un sinónimo o una página.",
    );
  });

  it("con 0 no salen", () => {
    const avisos = avisosDePortada({
      ...base,
      fotosPequenas: 0,
      sinDescripcion: { "equipos-usados": 0 },
      sinSeo: {},
      busquedasSinResultado: 0,
    });
    assert.deepEqual(avisos, []);
  });
});

describe("accionesHabituales", () => {
  it("todas, en el orden del plan, con todos los permisos y la portada", () => {
    const acciones = accionesHabituales(() => true, 3);
    assert.deepEqual(
      acciones.map((a) => a.clave),
      ["usada", "vendida", "nueva", "diapositiva", "articulo", "mensajes", "imagenes"],
    );
    assert.equal(acciones[3]?.href, "/admin/collections/paginas/3");
    assert.equal(
      acciones[1]?.href,
      "/admin/collections/equipos-usados?where[disponible][equals]=true",
    );
  });

  it("solo lo que el rol puede hacer, y sin portada no hay diapositiva", () => {
    const acciones = accionesHabituales(
      (slug, permiso) => slug === "equipos-usados" && permiso === "update",
    );
    assert.deepEqual(
      acciones.map((a) => a.clave),
      ["vendida"],
    );
    assert.equal(
      accionesHabituales(() => true).some((a) => a.clave === "diapositiva"),
      false,
    );
  });
});

describe("mensajesRecientes", () => {
  it("pone la etiqueta del tipo y el enlace a la solicitud", () => {
    const [m] = mensajesRecientes(
      [{ id: 9, nombre: "Ana Prueba", tipo: "cotizacion", createdAt: "2026-11-19T10:00:00.000Z" }],
      { cotizacion: "Cotización de equipo" },
    );
    assert.deepEqual(m, {
      id: 9,
      nombre: "Ana Prueba",
      tipo: "Cotización de equipo",
      creado: "2026-11-19T10:00:00.000Z",
      href: "/admin/collections/solicitudes/9",
    });
  });

  it("sin nombre, lo dice", () => {
    const [m] = mensajesRecientes([{ id: 1, nombre: " ", tipo: "otro" }], {});
    assert.equal(m?.nombre, "Sin nombre");
    assert.equal(m?.tipo, "otro");
  });
});
