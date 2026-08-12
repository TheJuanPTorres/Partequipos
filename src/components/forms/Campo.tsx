"use client";

import type { ReactNode } from "react";

/**
 * Campo de formulario con su etiqueta y su mensaje de error enlazados.
 *
 * La accesibilidad no es decoración: sin `htmlFor`/`id` el lector de pantalla no
 * sabe qué etiqueta va con qué campo, y sin `aria-describedby` el usuario oye
 * "correo, edición" sin enterarse de que hay un error debajo. Se centraliza aquí
 * para que ningún formulario se olvide.
 */

type Props = {
  id: string;
  etiqueta: string;
  error?: string;
  obligatorio?: boolean;
  ayuda?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean | undefined;
    "aria-describedby": string | undefined;
    required: boolean | undefined;
  }) => ReactNode;
};

export function Campo({ id, etiqueta, error, obligatorio, ayuda, children }: Props) {
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  // Se enlazan ayuda y error a la vez: aria-describedby admite varios ids.
  const describedBy = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(" ");

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {etiqueta}
        {obligatorio ? (
          <span className="text-red-700">
            {" *"}
            <span className="sr-only">(obligatorio)</span>
          </span>
        ) : (
          <span className="ml-1 font-normal text-gray-500">(opcional)</span>
        )}
      </label>

      {ayuda ? (
        <p id={idAyuda} className="mt-1 text-xs text-gray-500">
          {ayuda}
        </p>
      ) : null}

      <div className="mt-1">
        {children({
          id,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy || undefined,
          required: obligatorio || undefined,
        })}
      </div>

      {/*
       * `role="alert"` para que el error se anuncie en cuanto aparece, sin que
       * el usuario tenga que ir a buscarlo.
       */}
      {error ? (
        <p id={idError} role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Clases compartidas por los controles. El estilo va aparte del marcado. */
export const claseControl =
  "w-full rounded border border-gray-300 px-3 py-2 text-gray-900 " +
  "focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20 " +
  "aria-[invalid=true]:border-red-600 disabled:bg-gray-100 disabled:text-gray-500";
