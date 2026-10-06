import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  type Icon,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

export type TonoAviso = "info" | "aviso" | "error" | "exito";

const ICONOS: Record<TonoAviso, Icon> = {
  info: IconInfoCircle,
  aviso: IconAlertTriangle,
  error: IconAlertCircle,
  exito: IconCircleCheck,
};

type Props = {
  tono?: TonoAviso;
  /** Línea en negrita; opcional. */
  titulo?: ReactNode;
  children?: ReactNode;
  /**
   * `nota` (por defecto): texto fijo que se lee al llegar a él, sin anunciarse.
   * `estado`: cambia mientras se edita y se anuncia con educación (contadores).
   * `alerta`: error que hay que oír ya.
   * `ninguno`: dentro de una región que ya anuncia (p. ej. un contador).
   */
  rol?: "nota" | "estado" | "alerta" | "ninguno";
  className?: string;
};

const ROLES = { nota: "note", estado: "status", alerta: "alert", ninguno: undefined } as const;

/**
 * AVISO DEL PANEL (F4 del rediseño, 2026-10-06; decisiones-panel.md §22).
 *
 * Réplica del `alert` del sistema del cliente (ui.partequipos.com/components/alert)
 * sin `class-variance-authority` ni Tailwind: un `div` con su icono de Tabler,
 * título y texto, y el SCSS de `.pq-aviso` en `custom.scss`. Sirve igual en
 * componentes de servidor y de cliente: no usa hooks.
 *
 * El icono es decorativo (`aria-hidden`): el tono lo dice el texto, que es lo
 * que lee el lector de pantalla.
 */
export function Aviso({ tono = "info", titulo, children, rol = "nota", className }: Props) {
  const Icono = ICONOS[tono];
  return (
    <div
      className={["pq-aviso", `pq-aviso--${tono}`, className].filter(Boolean).join(" ")}
      role={ROLES[rol]}
    >
      <Icono aria-hidden="true" className="pq-aviso__icono" size={16} />
      <div className="pq-aviso__cuerpo">
        {titulo ? <p className="pq-aviso__titulo">{titulo}</p> : null}
        {children ? <div className="pq-aviso__texto">{children}</div> : null}
      </div>
    </div>
  );
}
