import {
  IconBackhoe,
  IconBulldozer,
  IconTools,
  IconTractor,
  IconTruckLoading,
  type Icon,
} from "@tabler/icons-react";

/**
 * Icono de cada pestaña de los listados (presentación, como los iconos del
 * menú del panel), por el nombre de la categoría o el tipo, en nueva y en
 * usada. El resto, el bulldozer.
 */
const ICONO_PESTANA: Record<string, Icon> = {
  Excavadoras: IconBackhoe,
  Miniexcavadoras: IconBackhoe,
  Cargadores: IconTruckLoading,
  Minicargadores: IconTruckLoading,
  Compactadores: IconTractor,
  Vibrocompactadores: IconTractor,
  Aditamentos: IconTools,
};

export const iconoDePestana = (texto: string): Icon => ICONO_PESTANA[texto] ?? IconBulldozer;
