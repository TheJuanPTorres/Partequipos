import type { ChangeEventHandler } from "react";

import {
  CAMPO_AUTORIZACION,
  PARTES_AUTORIZACION,
  RUTA_POLITICA_DATOS,
} from "@/lib/formularios/autorizacionDatos";

import estilos from "./casillaAutorizacion.module.css";

/**
 * LA CASILLA DE AUTORIZACIÓN DEL TRATAMIENTO DE DATOS (Ley 1581 de 2012; 2026-11-27), común a todos
 * los formularios con datos personales: la de la hoja de vida y la de las solicitudes. Obligatoria,
 * SIN marcar de entrada y antes del botón de enviar. El texto lleva el enlace a la política, que se
 * abre en otra pestaña (`noopener`) y lo dice a los lectores de pantalla.
 *
 * El error va junto a la casilla, con `role="alert"` (se anuncia al aparecer) y enlazado con
 * `aria-describedby`; la casilla se marca `aria-invalid` para que el foco vaya a ella.
 */
export function CasillaAutorizacion({
  id,
  error,
  defaultChecked,
  alCambiar,
}: {
  /** Base de los ids del formulario: la casilla es `<id>` y su error `<id>-error`. */
  id: string;
  error?: string;
  defaultChecked?: boolean;
  alCambiar?: ChangeEventHandler<HTMLInputElement>;
}) {
  const idError = `${id}-error`;
  return (
    <section data-campo="" data-autorizacion="" className={estilos.casilla}>
      <label htmlFor={id}>
        <input
          id={id}
          name={CAMPO_AUTORIZACION}
          type="checkbox"
          required
          aria-required="true"
          defaultChecked={defaultChecked}
          onChange={alCambiar}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
        />
        <span>
          {PARTES_AUTORIZACION.antes}
          <a href={RUTA_POLITICA_DATOS} target="_blank" rel="noopener">
            {PARTES_AUTORIZACION.enlace}
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
          {PARTES_AUTORIZACION.despues} <span className={estilos.asterisco}>*</span>
          <span className="sr-only">(obligatorio)</span>
        </span>
      </label>
      {error ? (
        <p id={idError} role="alert" data-error="" className={estilos.error}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
