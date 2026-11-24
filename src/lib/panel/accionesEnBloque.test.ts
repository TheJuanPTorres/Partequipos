import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CollectionConfig, Field } from "payload";

import { EquipoNuevo } from "../../collections/EquipoNuevo";
import { EquipoUsado } from "../../collections/EquipoUsado";
import { ModeloRepuesto } from "../../collections/ModeloRepuesto";
import { ACCIONES_EN_BLOQUE } from "./accionesEnBloque";

const COLECCIONES: Record<string, CollectionConfig> = {
  "equipos-nuevos": EquipoNuevo,
  "equipos-usados": EquipoUsado,
  "modelos-repuesto": ModeloRepuesto,
};

/** Los campos con nombre, también dentro de pestañas, filas y grupos sin nombre. */
function nombres(campos: Field[]): Set<string> {
  const s = new Set<string>();
  for (const c of campos) {
    if ("name" in c && c.name) s.add(c.name);
    if (c.type === "tabs")
      for (const t of c.tabs) if (!("name" in t)) nombres(t.fields).forEach((n) => s.add(n));
    if ((c.type === "row" || c.type === "collapsible") && "fields" in c)
      nombres(c.fields).forEach((n) => s.add(n));
  }
  return s;
}

describe("cambios en bloque (tanda 21)", () => {
  it("cada botón escribe campos que existen en su colección (si no, la API los ignora en silencio)", () => {
    for (const [slug, acciones] of Object.entries(ACCIONES_EN_BLOQUE)) {
      const coleccion = COLECCIONES[slug];
      assert.ok(coleccion, `falta ${slug} en la prueba`);
      const campos = nombres(coleccion.fields);
      for (const a of acciones)
        for (const campo of Object.keys(a.datos))
          assert.ok(campos.has(campo), `${slug}: «${a.texto}» escribe ${campo}, que no existe`);
    }
  });

  it("los textos cuentan bien una y varias", () => {
    const [mostrar, ocultar] = ACCIONES_EN_BLOQUE["equipos-nuevos"]!;
    assert.equal(mostrar!.pregunta(1), "¿Mostrar 1 ficha en la web?");
    assert.equal(ocultar!.hecho(3), "3 fichas ocultas: ya no salen en la web.");
    const vendida = ACCIONES_EN_BLOQUE["equipos-usados"]!.find((a) => a.clave === "vendida")!;
    assert.equal(vendida.pregunta(2), "¿Marcar 2 unidades como vendidas?");
    assert.deepEqual(vendida.datos, { disponible: false });
  });
});
