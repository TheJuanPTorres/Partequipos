"use server";

import type { ReactNode } from "react";

import { idVistaPrevia } from "@/lib/vistaPrevia/enVivo";
import {
  documentoGuardado,
  esColeccionServidor,
  fichaVistaPrevia,
  sesionDelPersonal,
} from "@/lib/vistaPrevia/servidor";

/**
 * La ficha pintada en el servidor con lo que el editor está escribiendo (vista previa en vivo de
 * maquinaria nueva y modelos de repuestos). Es una función de servidor, o sea un punto de entrada
 * público: comprueba ella misma la sesión del personal y lo que recibe. Sin sesión, con una
 * colección que no es de estas o un id que no existe, devuelve `null` y no pinta nada.
 */
export async function pintarVistaPrevia(
  coleccion: unknown,
  id: unknown,
  datos: unknown,
): Promise<ReactNode> {
  if (!esColeccionServidor(coleccion)) return null;
  const n = idVistaPrevia(id);
  if (!n) return null;
  if (!(await sesionDelPersonal())) return null;
  const guardado = await documentoGuardado(coleccion, n);
  if (!guardado) return null;
  return fichaVistaPrevia(coleccion, guardado, datos);
}
