import type { CSSProperties, ReactNode } from "react";

import { anchoPalabraMasLarga, necesitaGuion, type NivelTitulo } from "@/lib/titulos/palabraLarga";

type Props = {
  /** El texto del título, para medir su palabra más larga. */
  texto: string;
  /** Lo que se pinta, si no es el texto tal cual (p. ej. con los códigos sin cortar). */
  children?: ReactNode;
  /** El título se pinta en mayúsculas con CSS (`text-transform`): se mide en mayúsculas. */
  mayusculas?: boolean;
  /** Fija el tamaño mínimo legible. */
  nivel?: NivelTitulo;
};

/**
 * TEXTO DE UN TÍTULO QUE SE AJUSTA SI SU PALABRA MÁS LARGA NO CABE (tanda 21, tarea 7). Va DENTRO
 * del título (`<h1><TextoTitulo texto={…} /></h1>`); el texto
 * baja de tamaño lo justo para que esa palabra quepa, nunca por debajo del mínimo del nivel. Un
 * título que cabe se queda igual (`min(1em, …)`). Si ni al mínimo cabe, se parte con guion.
 * Sin JavaScript en el navegador: componente de servidor o de cliente, da igual.
 */
export function TextoTitulo({ texto, children, mayusculas = false, nivel = "grande" }: Props) {
  const ancho = anchoPalabraMasLarga(texto, { mayusculas });
  // El mínimo va por `data-nivel` en el CSS, no aquí: un px en línea no pasaría por la escala.
  const estilo = { "--palabra-em": String(ancho || 1) } as CSSProperties;
  return (
    <span
      className="texto-ajustado"
      data-guion={necesitaGuion(ancho, nivel) ? "" : undefined}
      data-nivel={nivel}
      style={estilo}
    >
      {children ?? texto}
    </span>
  );
}
