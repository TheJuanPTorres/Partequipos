import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";

import type { EnlaceBloque } from "@/lib/bloques/vista";

import estilos from "./boton.module.css";

/**
 * Botón rojo del kit con el engranaje (`settings.svg` de ux-9): «Conoce más»,
 * «Ver todo». Mismo dibujo que el de la sección 2 de la portada.
 */
export function BotonBloque({ boton, className }: { boton: EnlaceBloque; className?: string }) {
  return (
    <Link href={boton.href} className={`${estilos.boton} texto-etiqueta ${className ?? ""}`}>
      <IconSettings aria-hidden="true" focusable="false" stroke={1.75} />
      {boton.texto}
    </Link>
  );
}
