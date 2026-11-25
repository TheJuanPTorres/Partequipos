import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";
import type { ReactNode } from "react";

import { PaginaFichaNueva } from "@/components/ficha/PaginaFichaNueva";
import { PaginaModeloRepuesto } from "@/components/repuestos/PaginaModeloRepuesto";
import { esPersonal } from "@/lib/seguridad/acceso";
import type {
  EquiposNuevo,
  Marca,
  MarcasMaquinaria,
  ModelosRepuesto,
  TiposEquipo,
  TiposMaquinaria,
} from "@/payload-types";

/*
 * VISTA PREVIA EN VIVO pintada EN EL SERVIDOR (tanda 21, tarea 3, fase 2, punto 5): maquinaria
 * nueva (con aditamentos) y modelos de repuestos. Sus fichas llevan piezas que solo existen en el
 * servidor (el texto enriquecido con el visor de documentos, el banner de la marca con su logo
 * recortado), así que no se pueden pintar en el navegador como la de usada: la página y la
 * función `pintarVistaPrevia` (`app/(site)/vista-previa/acciones.ts`) pintan aquí la MISMA
 * componente que la página publicada, con lo guardado y encima lo que el editor está escribiendo.
 */

/** Las colecciones que se pintan aquí (la usada se pinta en el navegador, #579). */
export type ColeccionServidor = "equipos-nuevos" | "modelos-repuesto";

export function esColeccionServidor(v: unknown): v is ColeccionServidor {
  return v === "equipos-nuevos" || v === "modelos-repuesto";
}

/** Profundidad de cada una: la misma que su página publicada (el modelo necesita la del tipo). */
export const PROFUNDIDAD: Record<ColeccionServidor, number> = {
  "equipos-nuevos": 1,
  "modelos-repuesto": 2,
};

/** ¿La petición trae sesión del personal (editor o administrador)? */
export async function sesionDelPersonal(): Promise<boolean> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  return esPersonal(user);
}

/** El documento guardado, con la profundidad de su página. Oculto o no, el editor lo ve. */
export async function documentoGuardado(
  coleccion: ColeccionServidor,
  id: number,
): Promise<EquiposNuevo | ModelosRepuesto | null> {
  const payload = await getPayload({ config });
  // producto-oculto-ok: vista previa del panel, solo con sesión.
  return payload
    .findByID({ collection: coleccion, id, depth: PROFUNDIDAD[coleccion], disableErrors: true })
    .catch(() => null);
}

const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? Number(v.id) : null;

/**
 * Una relación (marca o tipo) con la profundidad que necesita la página: la guardada si el editor
 * no la ha cambiado; si eligió otra, se lee entera. Sin ninguna, `null` (no se pinta).
 */
async function relacion<T extends { id: number }>(
  coleccion: "marcas-maquinaria" | "tipos-maquinaria" | "marcas" | "tipos-equipo",
  enVivo: unknown,
  guardada: unknown,
  depth: number,
): Promise<T | null> {
  const id = idDe(enVivo) ?? idDe(guardada);
  if (!id) return null;
  if (id === idDe(guardada) && guardada && typeof guardada === "object") return guardada as T;
  const payload = await getPayload({ config });
  return (await payload
    .findByID({ collection: coleccion, id, depth, disableErrors: true })
    .catch(() => null)) as T | null;
}

/** Solo un objeto plano sirve como datos del formulario; cualquier otra cosa, nada. */
function objeto(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/**
 * La ficha con lo guardado y, encima, lo que llega del formulario (`datos`). El id es siempre el
 * guardado. Sin marca o sin tipo no hay ficha que pintar: `null`.
 */
export async function fichaVistaPrevia(
  coleccion: ColeccionServidor,
  guardado: EquiposNuevo | ModelosRepuesto,
  datos: unknown,
): Promise<ReactNode> {
  const vivo = { ...guardado, ...objeto(datos), id: guardado.id };
  if (coleccion === "equipos-nuevos") {
    const equipo = vivo as EquiposNuevo;
    const marca = await relacion<MarcasMaquinaria>(
      "marcas-maquinaria",
      equipo.marca,
      (guardado as EquiposNuevo).marca,
      1,
    );
    const tipo = await relacion<TiposMaquinaria>(
      "tipos-maquinaria",
      equipo.tipo,
      (guardado as EquiposNuevo).tipo,
      1,
    );
    if (!marca || !tipo) return null;
    return <PaginaFichaNueva marca={marca} tipo={tipo} equipo={equipo} />;
  }
  const modelo = vivo as ModelosRepuesto;
  const marca = await relacion<Marca>(
    "marcas",
    modelo.marca,
    (guardado as ModelosRepuesto).marca,
    1,
  );
  const tipo = await relacion<TiposEquipo>(
    "tipos-equipo",
    modelo.tipo,
    (guardado as ModelosRepuesto).tipo,
    1,
  );
  if (!marca || !tipo) return null;
  return <PaginaModeloRepuesto marca={marca} tipo={tipo} modelo={modelo} />;
}
