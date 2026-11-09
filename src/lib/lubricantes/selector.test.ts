import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BANDERAS_DIBUJADAS } from "../../components/marca/Bandera";
import { enlaceExternoLubricante, tienePaginaPropiaLubricante } from "./destino";
import { PAISES, paisDe } from "./pais";
import { COLOR_SIN_COLOR, TITULO_SELECTOR, primeraFrase, vistaSelector } from "./selector";

const media = (id: number, url: string) => ({
  id,
  url,
  width: 600,
  height: 400,
  alt: "foto",
  updatedAt: "",
  createdAt: "",
});

const eni = {
  id: 1,
  nombre: "Eni",
  slug: "lubricantes-eni",
  destino: "pagina" as const,
  paisOrigen: "it" as const,
  colorPrincipal: "#ffd100",
  entradilla: "Lubricantes Eni son productos de calidad. Con una reputación bien establecida.",
  imagenCabecera: media(10, "/cabecera.jpg"),
  logo: media(11, "/eni.png"),
};
const dispel = {
  id: 2,
  nombre: "Dispel",
  slug: "dispel",
  destino: "externo" as const,
  paisOrigen: "co" as const,
  colorPrincipal: "#005684",
  fotoSelector: media(12, "/dispel.jpg"),
};

describe("lubricantes: destino y país (2026-11-04)", () => {
  it("una marca de «Otra web» no tiene página, tenga o no enlace; vacío cuenta como «su página»", () => {
    assert.equal(tienePaginaPropiaLubricante(eni), true);
    assert.equal(tienePaginaPropiaLubricante({ destino: null }), true);
    assert.equal(tienePaginaPropiaLubricante(dispel), false);
    assert.equal(
      tienePaginaPropiaLubricante({ ...dispel, enlaceExterno: "https://example.com" }),
      false,
    );
  });

  it("el enlace solo vale en «Otra web», con https y de otro sitio", () => {
    assert.equal(enlaceExternoLubricante({ ...eni, enlaceExterno: "https://example.com" }), null);
    assert.equal(enlaceExternoLubricante(dispel), null);
    assert.equal(
      enlaceExternoLubricante({ ...dispel, enlaceExterno: "https://example.com" }),
      "https://example.com/",
    );
    assert.equal(enlaceExternoLubricante({ ...dispel, enlaceExterno: "http://example.com" }), null);
  });

  it("cada país de la lista tiene su bandera dibujada, y nada más", () => {
    assert.deepEqual([...BANDERAS_DIBUJADAS].sort(), PAISES.map((p) => p.valor).sort());
    assert.deepEqual(paisDe("co"), { codigo: "co", nombre: "Colombia" });
    assert.equal(paisDe("zz"), null);
    assert.equal(paisDe(null), null);
  });
});

describe("lubricantes: selector de marcas de la categoría «Lubricantes» (2026-11-04)", () => {
  const activa = { selectorMarcas: { activo: true } };

  it("apagado (o sin marcas), no hay selector: la página sigue con «Qué incluye»", () => {
    assert.equal(vistaSelector({ selectorMarcas: { activo: false } }, [eni, dispel]), null);
    assert.equal(vistaSelector({}, [eni]), null);
    assert.equal(vistaSelector(activa, []), null);
  });

  it("vacío, todas: primero la de página propia (Eni) y después Dispel", () => {
    const v = vistaSelector(activa, [dispel, eni])!;
    assert.equal(v.titulo, TITULO_SELECTOR);
    assert.deepEqual(
      v.paneles.map((p) => p.nombre),
      ["Eni", "Dispel"],
    );
  });

  it("las elegidas, en su orden", () => {
    const v = vistaSelector({ selectorMarcas: { activo: true, marcas: [2, 1] } }, [eni, dispel])!;
    assert.deepEqual(
      v.paneles.map((p) => p.nombre),
      ["Dispel", "Eni"],
    );
  });

  it("Eni: «Ver productos» a su página, bandera de Italia, tinta negra sobre su amarillo", () => {
    const p = vistaSelector(activa, [eni])!.paneles[0]!;
    assert.deepEqual(p.accion, {
      tipo: "pagina",
      href: "/lubricantes/lubricantes-eni/",
      texto: "Ver productos",
    });
    assert.deepEqual(p.pais, { codigo: "it", nombre: "Italia" });
    assert.equal(p.tinta, "#000000");
    // Sin «Texto del selector», la primera frase de la entradilla; sin foto propia, la cabecera.
    assert.equal(p.texto, "Lubricantes Eni son productos de calidad.");
    assert.equal(p.foto?.url, "/cabecera.jpg");
    assert.equal(p.logo?.alt, "Logo de Eni");
  });

  it("Eni con «Enlace externo»: «Ver productos» a su web, fuera (2026-11-08)", () => {
    const conWeb = { ...eni, enlaceExterno: "https://lubricantesenicolombia.com/" };
    const p = vistaSelector(activa, [conWeb])!.paneles[0]!;
    assert.deepEqual(p.accion, {
      tipo: "externo",
      href: "https://lubricantesenicolombia.com/",
      texto: "Ver productos",
    });
    // Sigue teniendo su página aquí: el destino no cambia.
    assert.equal(tienePaginaPropiaLubricante(conWeb), true);
    assert.equal(enlaceExternoLubricante(conWeb), null);
  });

  it("Dispel: sin enlace, «Ver productos» a la portada; con enlace, «Ir a su web» a ese enlace", () => {
    assert.deepEqual(vistaSelector(activa, [dispel])!.paneles[0]!.accion, {
      tipo: "pagina",
      href: "/",
      texto: "Ver productos",
    });
    const conEnlace = { ...dispel, enlaceExterno: "https://example.com" };
    const p = vistaSelector(activa, [conEnlace])!.paneles[0]!;
    assert.deepEqual(p.accion, {
      tipo: "externo",
      href: "https://example.com/",
      texto: "Ir a su web",
    });
    assert.equal(p.tinta, "#ffffff");
    assert.equal(p.foto?.url, "/dispel.jpg");
    assert.equal(p.texto, "");
  });

  it("sin color en el panel, un gris oscuro con texto blanco", () => {
    const p = vistaSelector(activa, [{ ...eni, colorPrincipal: null }])!.paneles[0]!;
    assert.equal(p.color, COLOR_SIN_COLOR);
    assert.equal(p.tinta, "#ffffff");
  });

  it("primeraFrase", () => {
    assert.equal(primeraFrase("Una. Dos."), "Una.");
    assert.equal(primeraFrase("Sin punto"), "Sin punto");
    assert.equal(primeraFrase("  "), "");
    assert.equal(primeraFrase("Versión 2.0 nueva. Otra."), "Versión 2.0 nueva.");
  });
});
