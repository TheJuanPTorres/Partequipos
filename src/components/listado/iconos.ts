import {
  IconBackhoe,
  IconBulldozer,
  IconTools,
  IconTractor,
  IconTruckLoading,
  type Icon,
} from "@tabler/icons-react";

import { singularAproximado } from "../../lib/utils/singular";

/**
 * Icono de cada pestaña de los listados (presentación, como los iconos del
 * menú del panel), por el SUSTANTIVO del nombre de la categoría o el tipo, en
 * nueva y en usada, en singular o en plural («Excavadora» y «Excavadoras»,
 * «Cargador Frontal»; los nombres pasan a singular, 2026-10-23). Antes iba por
 * el nombre exacto en plural, y en singular todos habrían caído al bulldozer.
 * El resto, el bulldozer.
 */
const ICONO_PESTANA: Record<string, Icon> = {
  excavadora: IconBackhoe,
  miniexcavadora: IconBackhoe,
  cargador: IconTruckLoading,
  minicargador: IconTruckLoading,
  compactador: IconTractor,
  vibrocompactador: IconTractor,
  aditamento: IconTools,
};

export const iconoDePestana = (texto: string): Icon =>
  ICONO_PESTANA[singularAproximado(texto).split(" ")[0] ?? ""] ?? IconBulldozer;
