"use client";

import { Link } from "@payloadcms/ui";
import { useSearchParams } from "next/navigation";

import { ANCHO_MINIMO } from "@/lib/panel/fotoPequena";

/**
 * FILTRO RÁPIDO DE «IMÁGENES» (organización del panel, PR 5, 2026-11-19): encima de la lista, un
 * enlace a las que miden menos de 1.200 px de ancho (las que el aviso de foto pequeña señala en
 * las fichas) y otro para volver a todas. Es la misma lista con un filtro en la dirección, así que
 * se puede combinar con la búsqueda y con el resto de filtros de Payload.
 */
const PARAMETRO = "where[width][less_than]";

export default function FiltroFotosPequenas() {
  const parametros = useSearchParams();
  const activo = parametros.get(PARAMETRO) === String(ANCHO_MINIMO);
  return (
    <p className="pq-filtro-rapido">
      {activo ? (
        <>
          Solo las imágenes de menos de {ANCHO_MINIMO.toLocaleString("es-CO")} px de ancho.{" "}
          <Link href="?">Ver todas</Link>
        </>
      ) : (
        <Link href={`?${encodeURI(PARAMETRO)}=${ANCHO_MINIMO}`}>
          Ver solo las pequeñas (menos de {ANCHO_MINIMO.toLocaleString("es-CO")} px de ancho)
        </Link>
      )}
    </p>
  );
}
