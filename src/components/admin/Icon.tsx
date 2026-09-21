import { PartequiposLogo } from "@/components/ui/partequipos-logo";

/**
 * Icono del panel: aparece en las migas de pan y en cualquier hueco reducido.
 *
 * AQUÍ VA EL ISOTIPO, NO EL LOGOTIPO, y eso se descubrió midiendo la página
 * pintada (§10.14): el hueco que Payload reserva mide **18 × 22 px con
 * `overflow: hidden`**, y el wordmark, que a 22 px de alto ocupa 91 px, salía
 * recortado en «PA». El isotipo tiene el `viewBox` más alto que ancho
 * (188 × 272), así que a esa altura ocupa ~15 px y cabe.
 *
 * `holeColor` es el ojal interior de la P y debe igualar la superficie: en las
 * migas es el fondo de la vista, `--theme-bg`. Su valor por defecto
 * (`var(--sidebar)`) no existe en el panel. El rojo de marca se conserva: es
 * legible en los dos modos y es la marca.
 *
 * Nombre accesible: el `<svg>` del sistema va con `aria-hidden`, así que se
 * envuelve en `role="img"`, igual que en `Logo.tsx`.
 */
export default function Icon() {
  return (
    <span aria-label="Partequipos" role="img">
      <PartequiposLogo className="pq-isotipo-migas" holeColor="var(--theme-bg)" />
    </span>
  );
}
