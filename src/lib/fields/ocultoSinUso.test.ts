import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Block, Field } from "payload";

import { BLOQUES_PAGINA, bloquesElegibles } from "../../collections/bloques/bloquesPagina";
import { EquipoNuevo } from "../../collections/EquipoNuevo";
import { EquipoUsado } from "../../collections/EquipoUsado";
import { PaginaInstitucional } from "../../collections/PaginaInstitucional";
import { Redirects } from "../../collections/Redirects";
import { TipoEquipo } from "../../collections/TipoEquipo";
import { PaginasIndice } from "../../globals/PaginasIndice";
import { RepuestosMarca } from "../../globals/RepuestosMarca";
import { ocultoSinUso } from "./ocultoSinUso";

/**
 * LIMPIEZA DEL PANEL, PASO 1 (2026-11-18): lo que la web ya no pinta va OCULTO en el panel y sin
 * tocar el esquema. Esta lista es la que el paso 3 borrará con migración, así que: si un campo
 * deja de estar oculto (alguien lo vuelve a usar), o desaparece (se borró sin migración), falla.
 * Ruta: campos con «.», y `bloque:<slug>` para entrar en un bloque.
 */
const OCULTOS: Record<string, { fields: Field[] }> = {
  "equipos-nuevos": EquipoNuevo,
  "equipos-usados": EquipoUsado,
  paginas: PaginaInstitucional,
  redirects: Redirects,
  "tipos-equipo": TipoEquipo,
  "repuestos-marca": RepuestosMarca,
  "paginas-indice": PaginasIndice,
};

const RUTAS_OCULTAS: [keyof typeof OCULTOS, string][] = [
  ["equipos-nuevos", "pesoOperativoKg"],
  ["equipos-nuevos", "destacados"],
  ["equipos-nuevos", "documentos"],
  ["equipos-usados", "potencia"],
  ["equipos-usados", "motor"],
  ["equipos-usados", "pestanaPortada"],
  ["paginas", "tipoPagina"],
  ["paginas", "seccionUsada.verProductoTexto"],
  ["paginas", "seccionUsada.marcasTitulo"],
  ["paginas", "seccionRepuestos.tamanoMaquina"],
  ["paginas", "seccionRepuestos.whatsappTexto"],
  ["paginas", "seccionRepuestos.whatsappMensaje"],
  ["paginas", "seccionRepuestos.verMasTexto"],
  ["paginas", "seccionRepuestos.maquinaReflejo"],
  ["paginas", "bloques.bloque:presentacionImagen.textura"],
  ["paginas", "bloques.bloque:procesoPasos.textura"],
  ["paginas", "bloques.bloque:galeria.texto"],
  ["paginas", "bloques.bloque:videoYoutube.videoFondo"],
  ["redirects", "destinoVerificadoEn"],
  ["tipos-equipo", "imagen"],
  ["tipos-equipo", "series.imagen"],
  // Ya ocultos antes de la limpieza; se borran en el mismo paso 3.
  ["repuestos-marca", "subtituloHero"],
  ["repuestos-marca", "tarjetaUsadas"],
  ["repuestos-marca", "tarjetaAditamentos"],
  ["repuestos-marca", "queIncluyeDisenoPropio"],
  ["paginas-indice", "trabaja.tituloHojaDeVida"],
  ["paginas-indice", "trabaja.textoHojaDeVida"],
  ["paginas-indice", "trabaja.botonHojaDeVida"],
  ["paginas-indice", "trabaja.imagenHojaDeVida"],
];

/** Los subcampos de un campo: grupos, filas, colapsables, filas de array y pestañas. */
function hijos(campo: Field): Field[] {
  if ("fields" in campo && Array.isArray(campo.fields)) return campo.fields;
  if (campo.type === "tabs") return campo.tabs.flatMap((t) => t.fields);
  return [];
}

/** Busca un campo con nombre entre `campos`, entrando en los contenedores sin nombre. */
function buscar(campos: Field[], nombre: string): Field | undefined {
  for (const c of campos) {
    if ("name" in c && c.name === nombre) return c;
    if (!("name" in c)) {
      const dentro = buscar(hijos(c), nombre);
      if (dentro) return dentro;
    }
  }
  return undefined;
}

function resolver(campos: Field[], ruta: string): Field | undefined {
  let actuales = campos;
  let campo: Field | undefined;
  const partes = ruta.split(".");
  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i]!;
    if (parte.startsWith("bloque:")) {
      const bloques = campo && campo.type === "blocks" ? (campo.blocks as Block[]) : [];
      const bloque = bloques.find((b) => b.slug === parte.slice("bloque:".length));
      if (!bloque) return undefined;
      actuales = bloque.fields;
      continue;
    }
    campo = buscar(actuales, parte);
    if (!campo) return undefined;
    actuales = hijos(campo);
  }
  return campo;
}

const oculto = (c: Field) =>
  "admin" in c && (c.admin as { hidden?: unknown } | undefined)?.hidden === true;

describe("limpieza del panel, paso 1: lo que la web no usa va oculto", () => {
  for (const [coleccion, ruta] of RUTAS_OCULTAS) {
    it(`${coleccion} → ${ruta} existe y está oculto`, () => {
      const campo = resolver(OCULTOS[coleccion]!.fields, ruta);
      assert.ok(campo, `no existe ${coleccion}.${ruta}: ¿se borró sin migración?`);
      assert.ok(oculto(campo), `${coleccion}.${ruta} ya no está oculto`);
    });
  }

  it("NO oculta la máquina de reserva de la barra de secciones (sí se usa)", () => {
    const campo = resolver(PaginaInstitucional.fields, "seccionRepuestos.maquina");
    assert.ok(campo);
    assert.equal(oculto(campo), false);
  });

  it("el buscador de rutas falla con una ruta inventada (comprobación del guardián)", () => {
    assert.equal(resolver(EquipoNuevo.fields, "noExiste"), undefined);
    assert.equal(resolver(PaginaInstitucional.fields, "bloques.bloque:noExiste.texto"), undefined);
  });

  it("ocultoSinUso conserva el resto del campo y solo añade `hidden`", () => {
    const antes: Field = {
      name: "x",
      type: "text",
      label: "X",
      admin: { description: "d", width: "50%" },
    };
    const despues = ocultoSinUso(antes);
    assert.deepEqual(despues, {
      ...antes,
      admin: { description: "d", width: "50%", hidden: true },
    });
    assert.deepEqual(antes.admin, { description: "d", width: "50%" });
  });
});

describe("bloques retirados del selector", () => {
  const todos = BLOQUES_PAGINA.map((b) => b.slug);

  it("sin bloques retirados en la página, ofrece todos menos «Franja marquee»", () => {
    const elegibles = bloquesElegibles([{ blockType: "galeria" }]);
    assert.ok(Array.isArray(elegibles));
    assert.deepEqual(
      elegibles,
      todos.filter((s) => s !== "franjaMarquee"),
    );
    assert.deepEqual(bloquesElegibles(undefined), elegibles);
  });

  it("si la página ya lleva uno retirado, los permite todos (si no, no se podría guardar)", () => {
    assert.equal(bloquesElegibles([{ blockType: "franjaMarquee" }]), true);
  });
});
