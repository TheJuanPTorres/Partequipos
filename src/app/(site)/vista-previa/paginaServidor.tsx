import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { idVistaPrevia } from "@/lib/vistaPrevia/enVivo";
import {
  PROFUNDIDAD,
  documentoGuardado,
  fichaVistaPrevia,
  sesionDelPersonal,
  type ColeccionServidor,
} from "@/lib/vistaPrevia/servidor";

import { VistaPreviaServidor } from "./VistaPreviaServidor";

/*
 * Lo común de las páginas de vista previa pintadas en el servidor (maquinaria nueva y modelos de
 * repuestos): SOLO CON SESIÓN del personal (si no, 404, como si no existiera), `noindex,
 * nofollow`, fuera del sitemap (`RUTAS_FUERA_DEL_SITEMAP`) y dinámicas (leen la sesión).
 */

export const METADATA_VISTA_PREVIA: Metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
};

export async function PaginaVistaPreviaServidor({
  coleccion,
  id,
}: {
  coleccion: ColeccionServidor;
  id: string;
}) {
  const n = idVistaPrevia(id);
  if (!n) notFound();
  if (!(await sesionDelPersonal())) notFound();
  const guardado = await documentoGuardado(coleccion, n);
  if (!guardado) notFound();
  const ficha = await fichaVistaPrevia(coleccion, guardado, null);
  if (!ficha) notFound();

  // El origen del panel, que es el de esta página: el iframe solo acepta sus mensajes.
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "";
  const protocolo =
    cabeceras.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return (
    <VistaPreviaServidor
      coleccion={coleccion}
      id={n}
      inicial={guardado as unknown as Record<string, unknown>}
      origen={`${protocolo}://${host}`}
      profundidad={PROFUNDIDAD[coleccion]}
    >
      {ficha}
    </VistaPreviaServidor>
  );
}
