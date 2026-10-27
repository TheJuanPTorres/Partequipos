"use client";

import { useField, useFormFields } from "@payloadcms/ui";
import { useId } from "react";

/**
 * CONTRASEÑA DEL SMTP DEL PANEL («Correo y formularios», 2026-10-27): SOLO DE ESCRITURA. El campo
 * empieza siempre vacío (la guardada nunca llega al navegador) y dice si hay una «guardada» o
 * «no guardada». Lo escrito va en `contrasenaNueva` (virtual) y el servidor lo guarda cifrado al
 * guardar el global; «Borrar la contraseña guardada» marca `borrarContrasena`.
 */
export default function ContrasenaSmtp({ path }: { path: string }) {
  const id = useId();
  const base = path.slice(0, path.lastIndexOf(".") + 1);
  const { value, setValue } = useField<string>({ path });
  const borrar = useField<boolean>({ path: `${base}borrarContrasena` });
  const guardada = useFormFields(([campos]) => campos[`${base}contrasenaGuardada`]?.value === true);
  const escrita = typeof value === "string" && value !== "";

  let estado = guardada ? "Guardada." : "No guardada.";
  if (escrita) estado = "Se guardará la nueva al guardar.";
  else if (borrar.value) estado = "Se borrará al guardar.";

  return (
    <div className="pq-correo-contrasena field-type">
      <label className="field-label" htmlFor={`${id}-contrasena`}>
        Contraseña
      </label>
      <p className="pq-correo-contrasena__estado" id={`${id}-estado`} aria-live="polite">
        <strong>{estado}</strong> Por seguridad no se puede volver a ver: para cambiarla, escribe la
        nueva y guarda.
      </p>
      <div className="pq-correo-prueba__fila">
        <input
          id={`${id}-contrasena`}
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          placeholder={
            guardada ? "•••••••• (escribe otra para cambiarla)" : "La contraseña de la cuenta"
          }
          aria-describedby={`${id}-estado`}
          value={escrita ? value : ""}
          onChange={(ev) => {
            setValue(ev.target.value);
            if (ev.target.value) borrar.setValue(false);
          }}
        />
        {guardada ? (
          <button
            type="button"
            className="btn btn--style-secondary btn--size-medium"
            aria-pressed={borrar.value === true}
            onClick={() => {
              setValue("");
              borrar.setValue(!borrar.value);
            }}
          >
            {borrar.value ? "No borrar" : "Borrar la contraseña guardada"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
