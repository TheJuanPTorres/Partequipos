import { PartequiposWordmark } from "@/components/ui/partequipos-wordmark";

/**
 * Logotipo de la pantalla de inicio de sesión del panel.
 *
 * Server Component: es marcado estático.
 *
 * CAMBIADO el 2026-09-20: antes era el PNG institucional
 * (`seoConfig.logoPath`), que **lleva fondo blanco**. En el panel en modo
 * oscuro eso se veía como una tarjeta blanca pegada al fondo — el pendiente #12
 * del cliente. Ahora usa el componente del sistema de diseño del cliente
 * (`partequipos-wordmark`, copiado con su CLI: un fichero, cero dependencias,
 * solo marcado SVG).
 *
 * LOS COLORES SON LOS DEL PANEL, NO LOS DEL SISTEMA. El componente trae por
 * defecto `var(--foreground)` y `var(--sidebar)`, que **no existen aquí**: el
 * panel de Payload usa su propia rampa. Se le pasan los equivalentes:
 *
 * - `textColor` → `--theme-elevation-1000`, el extremo de texto de la rampa, que
 *   se invierte solo con el tema.
 * - `holeColor` → `--theme-bg`, el fondo real sobre el que se apoya el
 *   logotipo. Son los ojales internos de las letras (a, e, o, p, q): si no
 *   igualan la superficie, se ven como manchas.
 * - La «P» se queda en el rojo de marca, que es igual en los dos modos.
 *
 * El PNG sigue en uso en el sitio público y en el JSON-LD (§10.8); esto solo
 * cambia el panel.
 */
export default function Logo() {
  return (
    <PartequiposWordmark
      className="pq-logo-acceso"
      holeColor="var(--theme-bg)"
      textColor="var(--theme-elevation-1000)"
    />
  );
}
