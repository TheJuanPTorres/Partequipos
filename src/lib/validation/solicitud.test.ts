import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { desdeFormData, validarSolicitud } from "./solicitud";

/** Solicitud mínima válida; cada prueba la modifica en lo que le interesa. */
const base = {
  tipo: "contacto",
  nombre: "Juan Pérez",
  correo: "juan@ejemplo.com",
  mensaje: "Necesito información sobre repuestos para una excavadora.",
};

const valida = (extra: Record<string, unknown> = {}) => validarSolicitud({ ...base, ...extra });

describe("validarSolicitud — casos válidos", () => {
  it("acepta la solicitud mínima", () => {
    const r = valida();
    assert.equal(r.ok, true);
  });

  it("normaliza el correo a minúsculas", () => {
    const r = valida({ correo: "Juan.Perez@Ejemplo.COM" });
    assert.ok(r.ok);
    assert.equal(r.datos.correo, "juan.perez@ejemplo.com");
  });

  it("recorta los espacios sobrantes", () => {
    const r = valida({ nombre: "  Juan Pérez  " });
    assert.ok(r.ok);
    assert.equal(r.datos.nombre, "Juan Pérez");
  });

  it("convierte los opcionales vacíos en undefined, no en cadena vacía", () => {
    const r = valida({ telefono: "", empresa: "   " });
    assert.ok(r.ok);
    assert.equal(r.datos.telefono, undefined);
    assert.equal(r.datos.empresa, undefined);
  });

  it("acepta los formatos de teléfono que se usan en Colombia", () => {
    for (const telefono of [
      "+57 317 670 7071",
      "3176707071",
      "(601) 492-6260",
      "601 492 62 60",
      "492-62-60",
    ]) {
      assert.equal(valida({ telefono }).ok, true, `rechazó ${telefono}`);
    }
  });

  it("acepta los tres tipos de solicitud", () => {
    for (const tipo of ["contacto", "cotizacion", "repuesto"]) {
      assert.equal(valida({ tipo }).ok, true, `rechazó ${tipo}`);
    }
  });

  it("convierte referenciaId de texto a número", () => {
    const r = valida({ referenciaTipo: "equipos-nuevos", referenciaId: "42" });
    assert.ok(r.ok);
    assert.equal(r.datos.referenciaId, 42);
  });
});

describe("validarSolicitud — casos inválidos", () => {
  const rechaza = (extra: Record<string, unknown>, campo: string) => {
    const r = validarSolicitud({ ...base, ...extra });
    assert.equal(r.ok, false, `debería rechazar ${campo}`);
    assert.ok(!r.ok && r.errores[campo], `falta el error de ${campo}`);
  };

  it("exige nombre", () => rechaza({ nombre: "" }, "nombre"));
  it("rechaza un nombre de una sola letra", () => rechaza({ nombre: "J" }, "nombre"));
  it("exige correo", () => rechaza({ correo: "" }, "correo"));
  it("rechaza un correo mal formado", () => rechaza({ correo: "juan@" }, "correo"));
  it("exige mensaje", () => rechaza({ mensaje: "" }, "mensaje"));
  it("rechaza un mensaje demasiado corto", () => rechaza({ mensaje: "hola" }, "mensaje"));
  it("rechaza un tipo inventado", () => rechaza({ tipo: "spam" }, "tipo"));

  it("rechaza un teléfono con letras", () => rechaza({ telefono: "llámame ya" }, "telefono"));
  it("rechaza un teléfono con muy pocos dígitos", () => rechaza({ telefono: "12345" }, "telefono"));

  it("corta los campos desmesurados", () => {
    rechaza({ nombre: "a".repeat(121) }, "nombre");
    rechaza({ mensaje: "a".repeat(4001) }, "mensaje");
  });

  it("rechaza una colección de referencia que no existe", () =>
    rechaza({ referenciaTipo: "usuarios" }, "referenciaTipo"));

  it("rechaza un id de referencia negativo", () => rechaza({ referenciaId: "-3" }, "referenciaId"));

  it("da un solo error por campo", () => {
    const r = validarSolicitud({ tipo: "contacto", nombre: "", correo: "", mensaje: "" });
    assert.ok(!r.ok);
    assert.equal(Object.keys(r.errores).length, 3);
  });

  it("no revienta con una entrada que no es un objeto", () => {
    for (const entrada of [null, undefined, "texto", 42, []]) {
      assert.equal(validarSolicitud(entrada).ok, false);
    }
  });
});

describe("desdeFormData", () => {
  const fd = (pares: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(pares)) f.append(k, v);
    return f;
  };

  it("extrae los campos del formulario", () => {
    const datos = desdeFormData(fd({ ...base, telefono: "3176707071" }));
    assert.equal(datos.nombre, "Juan Pérez");
    assert.equal(datos.telefono, "3176707071");
  });

  it("deja en undefined los campos ausentes", () => {
    const datos = desdeFormData(fd(base));
    assert.equal(datos.empresa, undefined);
    assert.equal(datos.origen, undefined);
  });

  it("ignora los valores que no son texto (ficheros adjuntos)", () => {
    const f = fd(base);
    f.set("nombre", new File(["x"], "x.txt"));
    assert.equal(desdeFormData(f).nombre, undefined);
  });

  it("encadena con la validación", () => {
    const r = validarSolicitud(desdeFormData(fd(base)));
    assert.equal(r.ok, true);
  });
});
