import { codigoInterruptorMejoras, interruptoresPorUrl } from "@/lib/repuestos/mejoras";

/**
 * Lee `?mejoras=` ANTES de pintar y apaga en el preview las mejoras de repuestos que no se
 * nombren (`src/lib/repuestos/mejoras.ts`). En producción no se pinta: allí manda solo el
 * interruptor del código. Un script en línea, y no un efecto, para que lo apagado no llegue a
 * verse (ni a contar como CLS en las mediciones).
 */
export function InterruptorMejoras() {
  if (!interruptoresPorUrl()) return null;
  return <script dangerouslySetInnerHTML={{ __html: codigoInterruptorMejoras() }} />;
}
