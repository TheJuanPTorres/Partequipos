"use client";

import { toast } from "@payloadcms/ui";
import type { ReactNode } from "react";

import { traducirAviso } from "@/lib/panel/avisosEnIngles";

/*
 * Envuelve UNA vez, al cargar el módulo en el navegador, las funciones de aviso de `toast` (la que
 * exporta `@payloadcms/ui`, la misma que usa Payload) para traducir los textos fijos en inglés de
 * `AVISOS_EN_INGLES`. Los demás avisos pasan sin tocar. Cliente porque los avisos son del navegador.
 */
type FuncionAviso = (mensaje: unknown, ...resto: unknown[]) => unknown;
const marca = Symbol.for("partequipos.avisosTraducidos");
const t = toast as unknown as Record<string | symbol, unknown>;
if (typeof window !== "undefined" && !t[marca]) {
  for (const tipo of ["error", "success", "warning", "info", "message"]) {
    const original = t[tipo];
    if (typeof original !== "function") continue;
    t[tipo] = (mensaje: unknown, ...resto: unknown[]) =>
      (original as FuncionAviso)(traducirAviso(mensaje), ...resto);
  }
  t[marca] = true;
}

/** Proveedor del panel (`admin.components.providers`): no pinta nada propio. */
export default function TraducirAvisos({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
