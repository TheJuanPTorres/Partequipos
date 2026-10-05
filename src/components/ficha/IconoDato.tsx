import {
  IconArrowBarToDown,
  IconBolt,
  IconBucket,
  IconEngine,
  IconGauge,
  IconInfoCircle,
  IconRulerMeasure,
  IconWeight,
  type Icon,
} from "@tabler/icons-react";

import type { IconoFicha } from "@/lib/maquinaria/fichaTecnica";

/**
 * Icono de Tabler de cada dato destacado. La lista y sus nombres en el panel
 * están en `src/lib/maquinaria/fichaTecnica.ts`; aquí, solo el dibujo.
 */
const ICONOS: Record<IconoFicha, Icon> = {
  peso: IconWeight,
  potencia: IconBolt,
  motor: IconEngine,
  capacidad: IconBucket,
  alcance: IconRulerMeasure,
  profundidad: IconArrowBarToDown,
  velocidad: IconGauge,
  otro: IconInfoCircle,
};

export function IconoDato({ icono, className }: { icono: IconoFicha; className?: string }) {
  const Dibujo = ICONOS[icono];
  return <Dibujo aria-hidden="true" focusable="false" stroke={1.75} className={className} />;
}
