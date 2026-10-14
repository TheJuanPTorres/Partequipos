import {
  IconAssembly,
  IconBoxMultiple,
  IconBucketDroplet,
  IconEngine,
  IconFilter,
  IconGasStation,
  IconSettings,
  IconTool,
  IconWheel,
} from "@tabler/icons-react";

import type { IconoCategoria } from "@/lib/portada/seccionesE";

/**
 * Icono de Tabler de cada categoría técnica. Lo comparten la portada (sección
 * 5) y las páginas de marca de repuestos: el valor del `select` nombra el
 * PAPEL, no el fichero (los SVG de Flaticon, L2, no van al repositorio).
 */
export const ICONOS_CATEGORIA: Record<IconoCategoria, typeof IconSettings> = {
  corte: IconSettings,
  llanta: IconWheel,
  lubricante: IconBucketDroplet,
  filtro: IconFilter,
  motor: IconEngine,
  rodaje: IconAssembly,
  miscelaneos: IconTool,
  componentes: IconBoxMultiple,
  diesel: IconGasStation,
};
