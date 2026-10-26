"use client";

import { useAuth } from "@payloadcms/ui";
import { useId, useState } from "react";

import { Aviso } from "../aviso/Aviso";

type Resultado = { ok: boolean; mensaje: string };

/**
 * «Enviar correo de prueba» de «Correo y formularios». No es un `<form>`: va dentro del
 * formulario del global, así que el botón es `type="button"` e Intro en el campo envía la
 * prueba en vez de guardar el global. Solo un administrador puede enviar (también lo exige el
 * servidor, `enviarCorreoDePrueba`).
 */
export default function PruebaCorreo() {
  const { user } = useAuth();
  const id = useId();
  const [destino, setDestino] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const admin = (user as { rol?: string } | null)?.rol === "administrador";
  const puede = admin && !enviando && destino.trim() !== "";

  async function enviar() {
    if (!puede) return;
    setEnviando(true);
    setResultado(null);
    try {
      const r = await fetch("/api/globals/correo-formularios/prueba/", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destino }),
      });
      const cuerpo = (await r.json().catch(() => null)) as Resultado | null;
      setResultado(
        cuerpo ?? { ok: false, mensaje: `Respuesta inesperada del servidor (${r.status}).` },
      );
    } catch {
      setResultado({
        ok: false,
        mensaje: "No se pudo contactar con el servidor. Revisa la conexión.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pq-correo-prueba field-type">
      <label className="field-label" htmlFor={`${id}-destino`}>
        Enviar correo de prueba
      </label>
      <p className="pq-correo-prueba__ayuda" id={`${id}-ayuda`}>
        {admin
          ? "Escribe una dirección y pulsa el botón: se envía un correo corto por el servidor de salida y aquí se ve si salió o por qué no."
          : "Solo un administrador puede enviar el correo de prueba."}
      </p>
      <div className="pq-correo-prueba__fila">
        <input
          id={`${id}-destino`}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nombre@empresa.com"
          aria-describedby={`${id}-ayuda`}
          value={destino}
          disabled={!admin || enviando}
          onChange={(ev) => setDestino(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              void enviar();
            }
          }}
        />
        <button
          type="button"
          className="btn btn--style-secondary btn--size-medium"
          disabled={!puede}
          onClick={() => void enviar()}
        >
          {enviando ? "Enviando…" : "Enviar correo de prueba"}
        </button>
      </div>
      <div aria-live="polite">
        {resultado ? (
          <Aviso
            tono={resultado.ok ? "exito" : "error"}
            titulo={resultado.ok ? "Correo enviado." : "No se envió."}
            rol="ninguno"
          >
            <p>{resultado.mensaje}</p>
          </Aviso>
        ) : null}
      </div>
    </div>
  );
}
