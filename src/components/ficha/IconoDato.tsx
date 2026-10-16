import {
  IconArrowBarToDown,
  IconBolt,
  IconBucket,
  IconCalendar,
  IconClockHour4,
  IconEngine,
  IconGauge,
  IconInfoCircle,
  IconMapPin,
  IconRulerMeasure,
  IconWeight,
  type Icon,
} from "@tabler/icons-react";

import type { IconoDatoFicha } from "@/lib/maquinaria/fichaTecnica";

/**
 * Icono de Tabler de cada dato destacado. La lista y sus nombres en el panel
 * están en `src/lib/maquinaria/fichaTecnica.ts`; aquí, solo el dibujo.
 */
const ICONOS: Record<IconoDatoFicha, Icon> = {
  peso: IconWeight,
  potencia: IconBolt,
  motor: IconEngine,
  capacidad: IconBucket,
  alcance: IconRulerMeasure,
  profundidad: IconArrowBarToDown,
  velocidad: IconGauge,
  otro: IconInfoCircle,
  anio: IconCalendar,
  horas: IconClockHour4,
  ubicacion: IconMapPin,
};

export function IconoDato({ icono, className }: { icono: IconoDatoFicha; className?: string }) {
  const Dibujo = ICONOS[icono];
  return <Dibujo aria-hidden="true" focusable="false" stroke={1.75} className={className} />;
}
