"use client";

import { IconPrinter } from "@tabler/icons-react";
import type { ReactNode } from "react";

/**
 * «Imprimir» de la ficha. Es de cliente solo por `window.print()`; lo que sale en papel lo
 * deciden los estilos `@media print` de `ficha.module.css` (sin cabecera, pie ni botones).
 * Con `children` lleva texto al lado del icono (bloque de acciones de la ficha de usado,
 * 2026-11-17); sin él, solo el icono con su nombre accesible.
 */
export function BotonImprimir({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
      aria-label={children ? undefined : "Imprimir la ficha"}
    >
      <IconPrinter aria-hidden="true" stroke={1.75} />
      {children}
    </button>
  );
}
