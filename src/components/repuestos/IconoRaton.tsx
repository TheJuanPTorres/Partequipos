import estilos from "./marca.module.css";

/**
 * ICONO DE RATÓN CON DESPLAZAMIENTO — widget `animated_mouse_scroll_icon` de
 * ux-9 (Unlimited Elements, leído en su código: `html.tpl` y `css.tpl`).
 * Un ratón con una rueda que baja y se desvanece, enlazado a la sección
 * siguiente.
 *
 * Lo que se aparta de ux-9:
 * - La rueda se mueve 2 veces (4,4 s) y se queda quieta; el widget la repite
 *   sin fin. Un movimiento de menos de 5 s no necesita botón de pausa
 *   (WCAG 2.2.2) y el icono no distrae mientras se lee.
 * - Con `prefers-reduced-motion` no se mueve.
 * - El enlace es un enlace (en el widget lleva `role="button"` aunque navega).
 */
export function IconoRaton({
  href,
  etiqueta = "Ir a las categorías de repuestos",
}: {
  href: string;
  /** Nombre accesible del enlace: dice adónde lleva. */
  etiqueta?: string;
}) {
  return (
    <a href={href} className={estilos.raton} aria-label={etiqueta}>
      <span className={estilos.ratonCuerpo} aria-hidden="true">
        <span className={estilos.ratonRueda} />
      </span>
    </a>
  );
}
