import { IconArrowRight, IconBook2 } from "@tabler/icons-react";
import Link from "next/link";

import estilos from "./botonCatalogo.module.css";

/**
 * «VER CATÁLOGO» CON PROTAGONISMO (petición del cliente, 2026-10-26): el botón principal del sitio
 * (rojo de marca, 56 px de alto, texto grande) con el icono de catálogo y la flecha que avanza al
 * pasar el ratón. Lo usa la página general de lubricantes en su cabecera y bajo el título del
 * bloque de la marca. Un enlace normal: teclado y lectores; los iconos son decorativos.
 */
export function BotonCatalogo({
  href,
  texto,
  className,
}: {
  href: string;
  texto: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`${estilos.boton} ${className ?? ""}`}>
      <IconBook2 aria-hidden="true" focusable="false" stroke={2} className={estilos.icono} />
      <span>{texto}</span>
      <IconArrowRight
        aria-hidden="true"
        focusable="false"
        stroke={2.25}
        className={estilos.flecha}
      />
    </Link>
  );
}
