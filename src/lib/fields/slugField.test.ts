import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Field, FieldAccess } from "payload";

import { PaginaInstitucional } from "../../collections/PaginaInstitucional";
import { slugEditable, slugField } from "./slugField";

type Args = Parameters<FieldAccess>[0];
const llamar = (user: unknown, doc: unknown) =>
  slugEditable({ req: { user }, doc } as unknown as Args);

describe("slugEditable", () => {
  it("deja escribir el slug al crear", () => {
    assert.equal(llamar({ id: 1, rol: "editor" }, undefined), true);
  });

  it("no deja cambiarlo después sin el permiso", () => {
    assert.equal(llamar({ id: 1, rol: "editor", puedeEditarSlugs: false }, { id: 9 }), false);
    assert.equal(llamar({ id: 1, rol: "administrador" }, { id: 9 }), false);
    assert.equal(llamar(null, { id: 9 }), false);
  });

  it("lo deja cambiar con el permiso", () => {
    assert.equal(llamar({ id: 1, rol: "editor", puedeEditarSlugs: true }, { id: 9 }), true);
  });
});

/** El acceso de `update` de un campo con nombre, buscado en la lista. */
function accesoDeActualizar(campos: Field[], nombre: string): unknown {
  const campo = campos.find((c) => "name" in c && c.name === nombre);
  return campo && "access" in campo ? campo.access?.update : undefined;
}

describe("el bloqueo del slug está puesto donde debe", () => {
  it("en el campo reutilizable", () => {
    assert.equal(accesoDeActualizar([slugField()], "slug"), slugEditable);
  });

  it("en la ruta de las páginas, que no usa slugField", () => {
    assert.equal(accesoDeActualizar(PaginaInstitucional.fields, "slug"), slugEditable);
  });
});
