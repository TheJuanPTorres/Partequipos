"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Lo que la ventana de contacto necesita del SERVIDOR (la clave pública de
 * Turnstile depende del entorno y el WhatsApp, de los datos de la empresa) para
 * abrirse desde un botón editable en el panel, que no conoce esos datos.
 * `ProveedorContacto` (servidor) los pone una vez en el diseño del sitio.
 */
export type DatosContacto = {
  siteKey: string | null;
  whatsapp?: { href: string; etiqueta: string };
  /** Solo fuera del sitio publicado: deja probar las mejoras de la ventana con `?anim=`. */
  permitirUrl?: boolean;
};

const Contexto = createContext<DatosContacto | null>(null);

export function ProveedorContactoCliente({
  datos,
  children,
}: {
  datos: DatosContacto;
  children: ReactNode;
}) {
  return <Contexto.Provider value={datos}>{children}</Contexto.Provider>;
}

export function useDatosContacto(): DatosContacto | null {
  return useContext(Contexto);
}
