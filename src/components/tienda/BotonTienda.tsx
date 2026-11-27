import { IconBuildingStore } from "@tabler/icons-react";

import type { OrigenTienda } from "@/lib/tienda/enlaceTienda";

import estilos from "./botonTienda.module.css";

/**
 * «VER EN LA TIENDA» (2026-11-26; aspecto del diseño nuevo, 2026-11-27). Un botón REDONDO de solo
 * icono: fondo tinta (#100f0f; #2a2727 al pasar el cursor) e icono de tienda rojo (#e5242d). Su
 * tamaño lo pone quien lo usa con `--tamano-tienda` (32 px en el panel de productos; en las demás
 * páginas, la altura de los botones que tiene al lado); nunca baja de 24 px.
 *
 * Abre la tienda en una pestaña nueva con `rel="noopener noreferrer"`. `title` «Ver en la tienda» y
 * nombre accesible «Buscar <nombre> en la tienda (se abre en otra pestaña)». `origen` marca el clic
 * para el evento GA4 `clic_tienda` (`data-analitica="tienda:<origen>"`; lo recoge el escuchador
 * general de `AvisoCookies`, solo con permiso de analítica).
 */
export function BotonTienda({
  href,
  origen,
  nombre,
  className,
}: {
  href: string;
  origen: OrigenTienda;
  /** El elemento que se busca en la tienda, para el nombre accesible. */
  nombre?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver en la tienda"
      aria-label={`Buscar ${nombre?.trim() || "el producto"} en la tienda (se abre en otra pestaña)`}
      data-analitica={`tienda:${origen}`}
      data-evita-flotante=""
      className={`${estilos.icono} ${className ?? ""}`.trim()}
    >
      <IconBuildingStore aria-hidden="true" focusable="false" stroke={2} size={20} />
    </a>
  );
}
