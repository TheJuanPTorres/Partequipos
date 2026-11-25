import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { errorEnVivo } from "./validacionVivo";

describe("errorEnVivo", () => {
  it("nombre: vacío y demasiado corto", () => {
    assert.equal(errorEnVivo("nombre", "  "), "Escribe tu nombre.");
    assert.equal(errorEnVivo("nombre", "A"), "El nombre es demasiado corto.");
    assert.equal(errorEnVivo("nombre", "Ana"), null);
  });
  it("correo: vacío y mal escrito", () => {
    assert.equal(errorEnVivo("correo", ""), "Escribe tu correo.");
    assert.equal(errorEnVivo("correo", "ana@"), "Ese correo no parece válido.");
    assert.equal(errorEnVivo("correo", "ana@ejemplo.co"), null);
  });
  it("mensaje: vacío y corto", () => {
    assert.equal(errorEnVivo("mensaje", ""), "Escribe tu mensaje.");
    assert.equal(errorEnVivo("mensaje", "hola"), "Cuéntanos un poco más: al menos 10 caracteres.");
    assert.equal(errorEnVivo("mensaje", "Quiero cotizar una excavadora"), null);
  });
  it("los demás campos no se revisan", () => {
    assert.equal(errorEnVivo("telefono", "abc"), null);
    assert.equal(errorEnVivo("ciudad", ""), null);
  });
});
