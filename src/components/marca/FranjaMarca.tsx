import type { LogoConAlt } from "@/lib/marca/logoMarca";

import { LogoMarca } from "./LogoMarca";
import estilos from "./franjaMarca.module.css";

/**
 * LA FRANJA DE MARCA (plantilla 4036 de Andrés, «Otros {tipo}» de la ficha nueva, #309): barra
 * blanca de radio 30 con el logo de la marca a la izquierda (`LogoMarca`, el único del sitio) y
 * el título a la derecha, como `<h2>`. Sin logo, solo el título. La usan la ficha nueva y, desde
 * el 2026-10-23, las páginas generales de tipo de nueva para separar las marcas. Va sobre el gris
 * de la página.
 */
export function FranjaMarca({
  id,
  titulo,
  logo,
}: {
  id: string;
  titulo: string;
  logo: LogoConAlt | null;
}) {
  return (
    <div className={estilos.franja}>
      {logo ? (
        <span className={estilos.cajaLogo}>
          <LogoMarca logo={logo} alt={logo.alt} sizes="140px" className={estilos.logo} />
        </span>
      ) : null}
      <h2 id={id} className={`${estilos.titulo} texto-titulo-bloque`}>
        {titulo}
      </h2>
    </div>
  );
}
