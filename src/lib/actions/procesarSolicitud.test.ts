import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CAMPO_TIEMPO, CAMPO_TRAMPA } from "@/lib/formularios/antiSpam";
import { valoresParaReintento } from "./estadoFormulario";
import {
  ERROR_LIMITE,
  ERROR_RAPIDO,
  ERROR_TURNSTILE,
  ERROR_VALIDACION,
  procesarSolicitud,
  type Dependencias,
} from "./procesarSolicitud";

/*
 * El formulario NO se vacía cuando el envío falla: la acción devuelve lo que
 * escribió el usuario en `valores`, y el formulario lo repone como valor por
 * defecto tras el restablecimiento que hace React al terminar la acción.
 */

const MENSAJE_LARGO = "Necesito cotizar un tren de rodaje completo para una excavadora. ".repeat(
  20,
);

function formulario(extra: Record<string, string> = {}) {
  const f = new FormData();
  const campos = {
    tipo: "contacto",
    origen: "/contactanos/",
    nombre: "Persona de prueba",
    correo: "prueba.falsa@example.com",
    telefono: "000 000 0000",
    empresa: "Empresa ficticia",
    mensaje: MENSAJE_LARGO,
    "cf-turnstile-response": "XXXX.DUMMY.TOKEN.XXXX",
    // Mostrado hace un minuto: pasa el tiempo mínimo.
    [CAMPO_TIEMPO]: String(Date.now() - 60_000),
    ...extra,
  };
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

function dependencias(humano: boolean, guardarFalla = false) {
  const guardados: unknown[] = [];
  const errores: unknown[] = [];
  const deps: Dependencias = {
    verificar: async () => humano,
    guardar: async (d) => {
      if (guardarFalla) throw new Error("base caída");
      guardados.push(d);
    },
    registrarError: (e) => errores.push(e),
  };
  return { deps, guardados, errores };
}

const ESPERADOS = {
  nombre: "Persona de prueba",
  correo: "prueba.falsa@example.com",
  telefono: "000 000 0000",
  empresa: "Empresa ficticia",
  mensaje: MENSAJE_LARGO,
};

describe("procesarSolicitud: el formulario no se vacía al fallar", () => {
  it("Turnstile rechaza: error claro, NO se guarda y vuelven todos los valores", async () => {
    const { deps, guardados } = dependencias(false);
    const r = await procesarSolicitud(formulario(), deps);
    assert.equal(r.estado, "error");
    assert.equal(r.mensaje, ERROR_TURNSTILE);
    assert.equal(guardados.length, 0);
    assert.deepEqual(r.valores, ESPERADOS);
  });

  it("validación falla: errores por campo y vuelven los valores", async () => {
    const { deps, guardados } = dependencias(true);
    const r = await procesarSolicitud(formulario({ correo: "no-es-un-correo" }), deps);
    assert.equal(r.estado, "error");
    assert.equal(r.mensaje, ERROR_VALIDACION);
    assert.ok(r.errores?.correo);
    assert.equal(guardados.length, 0);
    assert.equal(r.valores?.correo, "no-es-un-correo");
    assert.equal(r.valores?.mensaje, MENSAJE_LARGO);
  });

  it("la base falla: error genérico, se registra y vuelven los valores", async () => {
    const { deps, errores } = dependencias(true, true);
    const r = await procesarSolicitud(formulario(), deps);
    assert.equal(r.estado, "error");
    assert.equal(errores.length, 1);
    assert.deepEqual(r.valores, ESPERADOS);
  });

  it("envío correcto: se guarda una vez y NO devuelve valores", async () => {
    const { deps, guardados } = dependencias(true);
    const r = await procesarSolicitud(formulario(), deps);
    assert.equal(r.estado, "ok");
    assert.equal(guardados.length, 1);
    assert.equal(r.valores, undefined);
  });

  it("sin token: se pregunta a la verificación con undefined (y rechaza)", async () => {
    let recibido: string | undefined = "sin llamar";
    const { deps } = dependencias(false);
    deps.verificar = async (t) => {
      recibido = t;
      return false;
    };
    const f = formulario();
    f.delete("cf-turnstile-response");
    const r = await procesarSolicitud(f, deps);
    assert.equal(recibido, undefined);
    assert.equal(r.estado, "error");
  });
});

describe("procesarSolicitud: anti-spam", () => {
  it("campo trampa relleno: responde «ok» y NO guarda", async () => {
    const { deps, guardados } = dependencias(true);
    const r = await procesarSolicitud(formulario({ [CAMPO_TRAMPA]: "http://spam.test" }), deps);
    assert.equal(r.estado, "ok");
    assert.equal(guardados.length, 0);
  });

  it("enviado demasiado rápido: error claro, NO guarda y devuelve los valores", async () => {
    const { deps, guardados } = dependencias(true);
    const r = await procesarSolicitud(formulario({ [CAMPO_TIEMPO]: String(Date.now()) }), deps);
    assert.equal(r.estado, "error");
    assert.equal(r.mensaje, ERROR_RAPIDO);
    assert.equal(guardados.length, 0);
    assert.deepEqual(r.valores, ESPERADOS);
  });

  it("sin la hora del formulario (POST a mano): no guarda", async () => {
    const { deps, guardados } = dependencias(true);
    const f = formulario();
    f.delete(CAMPO_TIEMPO);
    const r = await procesarSolicitud(f, deps);
    assert.equal(r.estado, "error");
    assert.equal(guardados.length, 0);
  });

  it("pasado el límite por IP: error claro y NO guarda", async () => {
    const { deps, guardados } = dependencias(true);
    deps.ip = "203.0.113.5";
    deps.permitirIp = () => false;
    const r = await procesarSolicitud(formulario(), deps);
    assert.equal(r.estado, "error");
    assert.equal(r.mensaje, ERROR_LIMITE);
    assert.equal(guardados.length, 0);
  });

  it("el límite recibe la IP y, dentro de él, se guarda", async () => {
    const { deps, guardados } = dependencias(true);
    let vista: string | undefined;
    deps.ip = "203.0.113.5";
    deps.permitirIp = (ip) => ((vista = ip), true);
    const r = await procesarSolicitud(formulario(), deps);
    assert.equal(r.estado, "ok");
    assert.equal(vista, "203.0.113.5");
    assert.equal(guardados.length, 1);
  });
});

describe("valoresParaReintento", () => {
  it("solo los campos visibles: ni ocultos ni el token", () => {
    const v = valoresParaReintento(formulario());
    assert.deepEqual(Object.keys(v).sort(), ["correo", "empresa", "mensaje", "nombre", "telefono"]);
  });

  it("corta a la longitud máxima: un POST enorme no se devuelve entero", () => {
    const v = valoresParaReintento(
      formulario({ mensaje: "x".repeat(50_000), nombre: "y".repeat(500) }),
    );
    assert.equal(v.mensaje?.length, 4000);
    assert.equal(v.nombre?.length, 120);
  });

  it("conserva el texto tal cual (espacios incluidos) y omite los vacíos", () => {
    const v = valoresParaReintento(formulario({ empresa: "", nombre: "  Ana  " }));
    assert.equal(v.nombre, "  Ana  ");
    assert.equal("empresa" in v, false);
  });
});
