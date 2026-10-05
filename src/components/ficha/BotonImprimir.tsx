"use client";

import { IconPrinter } from "@tabler/icons-react";

/**
 * «Imprimir» de los botones de compartir de la ficha. Es de cliente solo por
 * `window.print()`; lo que sale en papel lo deciden los estilos `@media print`
 * de `ficha.module.css` (sin cabecera, pie ni botones).
 */
export function BotonImprimir({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
      aria-label="Imprimir la ficha"
    >
      <IconPrinter aria-hidden="true" stroke={1.75} />
    </button>
  );
}
