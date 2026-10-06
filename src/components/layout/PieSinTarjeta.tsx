/**
 * PIE SIN LA TARJETA ROJA («Ofrecemos Soluciones para tus Proyectos»).
 *
 * Una página que ya tiene su propia llamada a la acción (la ficha de producto,
 * con «Contáctanos para recibir asesoría» y su formulario) pinta este
 * marcador, y el pie no muestra la tarjeta: dos llamadas seguidas sobraban
 * (decisión de dirección, 2026-10-06). El resto del pie no cambia.
 *
 * POR QUÉ UN MARCADOR Y CSS. El pie está en el layout raíz, que no recibe
 * nada de la página, y leer la ruta en el layout haría dinámicas todas las
 * páginas estáticas. Así la decisión viene en el HTML del servidor y la aplica
 * el CSS del pie (`body:has([data-pie-sin-tarjeta])`, en `pie.module.css`)
 * desde el primer pintado: sin JavaScript y sin CLS. Un navegador sin `:has()`
 * enseña la tarjeta, como antes.
 */
export const ATRIBUTO_PIE_SIN_TARJETA = "data-pie-sin-tarjeta";

export function PieSinTarjeta() {
  return <span {...{ [ATRIBUTO_PIE_SIN_TARJETA]: "" }} hidden />;
}
