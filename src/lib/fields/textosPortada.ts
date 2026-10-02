import type { Field } from "payload";

import { validarEnlace } from "./reglasPortada";

/**
 * Campos de TEXTO de las secciones de la portada (ux-9 alimentada desde el
 * panel, 2026-10-02). Antes estaban escritos en los componentes; ahora se
 * editan en la página «inicio». El valor por defecto es el de ux-9, y la
 * migración `20261002_*_home_panel` lo siembra en la portada ya existente.
 *
 * Vacío = el elemento no se pinta (el título de una sección, su botón…).
 */
export function texto(
  name: string,
  label: string,
  defaultValue: string,
  description?: string,
): Field {
  return {
    name,
    type: "text",
    label,
    defaultValue,
    ...(description ? { admin: { description } } : {}),
  };
}

export function parrafo(name: string, label: string, defaultValue: string): Field {
  return { name, type: "textarea", label, defaultValue };
}

/** Enlace del botón: una ruta del sitio (`/…/`) o una dirección `https://`. */
export function enlace(name: string, label: string, defaultValue: string): Field {
  return {
    name,
    type: "text",
    label,
    defaultValue,
    validate: validarEnlace,
    admin: { description: "Una ruta del sitio (/…/) o una dirección https://." },
  };
}
