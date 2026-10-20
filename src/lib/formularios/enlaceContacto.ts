/**
 * ¿Un enlace editable en el panel lleva al formulario de contacto? Entonces el
 * botón abre la ventana (con el enlace de siempre como respaldo sin JavaScript).
 * Cuenta `/contactanos/` (con o sin ancla) y las anclas de contacto de la propia
 * página (`#contacto`, `#formulario`, `#cotizar`…). El «Contáctanos» de la
 * cabecera no pasa por aquí: sigue yendo a la página.
 */
const CONTACTANOS = /^\/contactanos\/?(#.*)?$/i;
const ANCLA_CONTACTO = /^#(contacto|contactanos|formulario|cotiz|solicit|asesor|avisame)[\w-]*$/i;

export function llevaAlFormulario(href: string | null | undefined): boolean {
  const h = href?.trim() ?? "";
  return CONTACTANOS.test(h) || ANCLA_CONTACTO.test(h);
}
