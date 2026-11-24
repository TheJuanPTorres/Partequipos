"use client";

import { useLivePreview } from "@payloadcms/live-preview-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { ColeccionServidor } from "@/lib/vistaPrevia/servidor";

import { pintarVistaPrevia } from "./acciones";

/*
 * «use client»: recibe del panel, por `postMessage`, lo que el editor va escribiendo
 * (`useLivePreview`) y pide al servidor la ficha pintada con esos datos (`pintarVistaPrevia`),
 * con una pausa de medio segundo entre cambios. Mientras llega, se queda la anterior. Solo se
 * pinta la respuesta de la ÚLTIMA petición: una lenta que llega tarde no pisa a una más nueva.
 */

const PAUSA_MS = 500;

type Props = {
  coleccion: ColeccionServidor;
  id: number;
  inicial: Record<string, unknown>;
  origen: string;
  profundidad: number;
  /** La ficha con lo guardado, pintada por la página: lo que se ve hasta el primer cambio. */
  children: ReactNode;
};

export function VistaPreviaServidor({
  coleccion,
  id,
  inicial,
  origen,
  profundidad,
  children,
}: Props) {
  const { data } = useLivePreview<Record<string, unknown>>({
    initialData: inicial,
    serverURL: origen,
    depth: profundidad,
  });
  const [ficha, setFicha] = useState<ReactNode>(null);
  const ultima = useRef(0);

  useEffect(() => {
    // Los datos iniciales son lo guardado: ya está pintado.
    if (data === inicial) return;
    const turno = ++ultima.current;
    const temporizador = setTimeout(async () => {
      try {
        const nueva = await pintarVistaPrevia(coleccion, id, data);
        if (turno === ultima.current && nueva) setFicha(nueva);
      } catch (error) {
        console.error("[vista previa] no se pudo pintar la ficha:", error);
      }
    }, PAUSA_MS);
    return () => clearTimeout(temporizador);
  }, [data, inicial, coleccion, id]);

  return <>{ficha ?? children}</>;
}
