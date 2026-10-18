import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo, TiposMaquinaria } from "@/payload-types";

import { gruposDeSubtipos, subtiposDe } from "./subtipos";

const tipo = (id: number, extra: Partial<TiposMaquinaria> = {}): TiposMaquinaria =>
  ({ id, nombre: `Tipo ${id}`, slug: `tipo-${id}`, marca: 1, ...extra }) as TiposMaquinaria;
const equipo = (id: number, tipoId: number): EquiposNuevo =>
  ({ id, nombre: `Equipo ${id}`, slug: `equipo-${id}`, tipo: tipoId }) as unknown as EquiposNuevo;

describe("tipos paraguas de maquinaria nueva", () => {
  it("los subtipos poblados, en su orden; un id sin poblar no cuenta", () => {
    const t = tipo(9, { subtipos: [tipo(3), 4, tipo(2)] });
    assert.deepEqual(
      subtiposDe(t).map((s) => s.id),
      [3, 2],
    );
    assert.deepEqual(subtiposDe(tipo(1)), []);
  });

  it("un grupo por subtipo con sus equipos; sin equipos, sin grupo", () => {
    const grupos = gruposDeSubtipos(
      [tipo(3), tipo(4), tipo(2)],
      [equipo(1, 2), equipo(2, 3), equipo(3, 3), equipo(4, 7)],
    );
    assert.deepEqual(
      grupos.map((g) => [g.tipo.id, g.equipos.map((e) => e.id)]),
      [
        [3, [2, 3]],
        [2, [1]],
      ],
    );
  });
});
