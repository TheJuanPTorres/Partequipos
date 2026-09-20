import { PartequiposWordmark } from "@/components/ui/partequipos-wordmark";

/**
 * Icono del panel: aparece en las migas de pan y en espacios reducidos.
 *
 * Mismo cambio y mismo motivo que `Logo.tsx` (pendiente #12): el PNG llevaba
 * fondo blanco y en oscuro se veía como una pastilla blanca. Aquí el tamaño lo
 * fija la altura —22 px, la que ya tenía el PNG— y el ancho sale del `viewBox`
 * (718 × 173), así que la proporción se conserva sin declarar dimensiones.
 *
 * Los ojales de las letras usan `--theme-bg` igual que en el acceso: en las
 * migas el logotipo se apoya sobre el fondo de la vista, no sobre una tarjeta.
 */
export default function Icon() {
  return (
    <PartequiposWordmark
      className="pq-logo-migas"
      holeColor="var(--theme-bg)"
      textColor="var(--theme-elevation-1000)"
    />
  );
}
