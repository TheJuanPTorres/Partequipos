/**
 * Dice al botón flotante de WhatsApp de qué página viene el visitante (punto 28, tanda 22): las
 * fichas de máquina (nueva, usada) y de modelo de repuestos lo ponen con el nombre de lo que se
 * mira (con su año, si el nombre lo lleva). El botón lo lee y lo añade a su mensaje; las demás
 * páginas no lo ponen y el mensaje es el de siempre.
 */
export function ContextoWhatsApp({ texto }: { texto: string }) {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (!limpio) return null;
  return <span hidden data-whatsapp-contexto={limpio} />;
}
