import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  IconBackhoe,
  IconBulldozer,
  IconTools,
  IconTractor,
  IconTruckLoading,
} from "@tabler/icons-react";

import { iconoDePestana } from "./iconos";

describe("iconoDePestana", () => {
  it("el mismo icono con el nombre en singular y en plural", () => {
    for (const [nombre, icono] of [
      ["Excavadora", IconBackhoe],
      ["Excavadoras", IconBackhoe],
      ["Miniexcavadora", IconBackhoe],
      ["Cargador Frontal", IconTruckLoading],
      ["Cargadores", IconTruckLoading],
      ["Minicargador", IconTruckLoading],
      ["Compactador de Suelo", IconTractor],
      ["Vibrocompactadores", IconTractor],
      ["Aditamentos", IconTools],
    ] as const) {
      assert.equal(iconoDePestana(nombre), icono, nombre);
    }
  });

  it("el resto, el bulldozer", () => {
    assert.equal(iconoDePestana("Bulldozer"), IconBulldozer);
    assert.equal(iconoDePestana("Motoniveladora"), IconBulldozer);
  });
});
