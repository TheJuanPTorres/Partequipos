import Image from "next/image";

import type { LogoMarca as DatosLogo } from "@/lib/marca/logoMarca";

import estilos from "./logoMarca.module.css";

/**
 * EL logo de una marca, igual en todo el sitio (`src/lib/marca/logoMarca.ts`):
 * con sus colores, o en una sola tinta oscura si en el panel está marcada
 * «Pintar el logo en oscuro en el menú». Va siempre sobre fondo claro. El
 * tamaño lo pone quien lo usa (`className`); las medidas reales del fichero
 * van en `width`/`height`, así que no hay CLS.
 *
 * `alt` vacío cuando el nombre de la marca ya está escrito al lado (decorativo).
 */
export function LogoMarca({
  logo,
  alt,
  sizes,
  className,
  priority = false,
  loading,
  fill = false,
}: {
  logo: DatosLogo;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  /** Llena su caja (posicionada), entero y sin recortar: las tarjetas con foto. */
  fill?: boolean;
}) {
  return (
    <Image
      src={logo.url}
      alt={alt}
      {...(fill ? { fill: true } : { width: logo.width, height: logo.height })}
      sizes={sizes}
      priority={priority}
      loading={loading}
      className={`${estilos.logo} ${className ?? ""}`}
      data-oscuro={logo.oscuro ? "" : undefined}
    />
  );
}
