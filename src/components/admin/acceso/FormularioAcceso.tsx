"use client";

import { useAuth } from "@payloadcms/ui";
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import type { UserWithToken } from "@payloadcms/ui";

import { mensajeDeError, type Bloqueo } from "@/lib/panel/acceso";

type Props = {
  /** `POST` de inicio de sesión de Payload (`/api/users/login`). */
  accion: string;
  bloqueo: Bloqueo;
  /** Vista «¿Olvidaste tu contraseña?» de Payload. */
  olvido: string;
  /** Ya pasada por `getSafeRedirect` en el servidor. */
  redireccion: string;
};

/**
 * Formulario de correo y contraseña de la pantalla de acceso.
 *
 * Hace lo mismo que el `LoginForm` de Payload 3.89: `POST` a su endpoint de
 * login, `setUser` con la respuesta y navegación a la redirección. La sesión,
 * la cookie y el bloqueo por intentos los pone el servidor de Payload.
 *
 * Errores: el texto del servidor NO se muestra. Payload distingue «contraseña
 * incorrecta» de «cuenta bloqueada», y lo segundo delata que el correo existe;
 * aquí los dos dan el mismo mensaje (`mensajeDeError`).
 */
export default function FormularioAcceso({ accion, bloqueo, olvido, redireccion }: Props) {
  const { setUser } = useAuth();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  const idError = `${id}-error`;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    const datos = new FormData(evento.currentTarget);
    const email = String(datos.get("email") ?? "").trim();
    const password = String(datos.get("password") ?? "");
    if (!email || !password) {
      setError(mensajeDeError(400, bloqueo));
      return;
    }

    setEnviando(true);
    setError(null);
    let estado: number | null = null;
    try {
      const respuesta = await fetch(accion, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      estado = respuesta.status;
      if (respuesta.ok) {
        setUser((await respuesta.json()) as UserWithToken);
        // Se queda en «Ingresando…» hasta que cargue el panel.
        router.push(redireccion);
        return;
      }
    } catch {
      estado = null;
    }
    setError(mensajeDeError(estado, bloqueo));
    setEnviando(false);
  }

  return (
    <form className="pq-acceso__formulario" noValidate onSubmit={enviar}>
      {/*
       * Región SIEMPRE presente y vacía hasta que hay error: así el lector de
       * pantalla anuncia el mensaje al aparecer (insertar un `role="alert"`
       * nuevo no se anuncia igual en todos).
       */}
      <div aria-live="assertive" className="pq-acceso__alerta" id={idError} role="alert">
        {error ? (
          <>
            <IconAlertTriangle aria-hidden="true" className="pq-acceso__alerta-icono" />
            <span>{error}</span>
          </>
        ) : null}
      </div>

      <div className="pq-acceso__campo">
        <label className="pq-acceso__etiqueta" htmlFor={`${id}-email`}>
          Correo
        </label>
        <input
          aria-describedby={error ? idError : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="email"
          className="pq-acceso__input"
          id={`${id}-email`}
          inputMode="email"
          name="email"
          placeholder="tu@correo.com"
          required
          spellCheck={false}
          type="email"
        />
      </div>

      <div className="pq-acceso__campo">
        <div className="pq-acceso__fila-etiqueta">
          <label className="pq-acceso__etiqueta" htmlFor={`${id}-password`}>
            Contraseña
          </label>
          <a className="pq-acceso__olvido" href={olvido}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <input
          aria-describedby={error ? idError : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="current-password"
          className="pq-acceso__input"
          id={`${id}-password`}
          name="password"
          placeholder="Contraseña"
          required
          type="password"
        />
      </div>

      <button
        aria-disabled={enviando || undefined}
        className="pq-acceso__boton pq-acceso__boton--primario"
        type="submit"
      >
        {enviando ? (
          <>
            <IconLoader2 aria-hidden="true" className="pq-acceso__girando" />
            Ingresando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>
    </form>
  );
}
