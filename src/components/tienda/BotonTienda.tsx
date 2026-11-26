import { IconBuildingStore } from "@tabler/icons-react";
import type { ReactNode } from "react";

import type { OrigenTienda } from "@/lib/tienda/enlaceTienda";

import estilos from "./botonTienda.module.css";

/**
 * «VER EN LA TIENDA» (2026-11-26, el cliente monta su tienda de repuestos). Un enlace a la tienda,
 * en pestaña nueva con `rel="noopener noreferrer"` y con el aviso para lectores de pantalla
 * («se abre en otra pestaña»). Dos formas:
 *
 * - `icono` (por defecto): un botón CUADRADO de 44 px, fondo oscuro e icono claro, sin texto
 *   visible; su nombre accesible es `Ver <X> en la tienda`.
 * - con `children`: un botón con texto, cuyo aspecto pone la `className` de quien lo usa.
 *
 * `origen` marca el clic para el evento GA4 `clic_tienda` (`data-analitica="tienda:<origen>"`; lo
 * recoge el escuchador general de `AvisoCookies`, solo con permiso de analítica).
 */
export function BotonTienda({
  href,
  origen,
  nombre,
  className,
  children,
  tamano = 20,
}: {
  href: string;
  origen: OrigenTienda;
  /** El elemento que se ve en la tienda, para el nombre accesible del botón de solo icono. */
  nombre?: string;
  className?: string;
  children?: ReactNode;
  tamano?: number;
}) {
  const texto = children ? null : `Ver ${nombre ?? "el producto"} en la tienda`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-analitica={`tienda:${origen}`}
      data-evita-flotante=""
      className={`${children ? "" : estilos.icono} ${className ?? ""}`.trim()}
      aria-label={texto ? `${texto} (se abre en otra pestaña)` : undefined}
    >
      <IconBuildingStore aria-hidden="true" focusable="false" stroke={2} size={tamano} />
      {children}
      {children ? <span className="sr-only"> (se abre en otra pestaña)</span> : null}
    </a>
  );
}
