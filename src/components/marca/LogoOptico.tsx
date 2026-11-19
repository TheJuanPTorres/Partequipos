import type { CSSProperties } from "react";

import type { LogoMarca as DatosLogo } from "@/lib/marca/logoMarca";
import { sizesPorFactor } from "@/lib/estilos/escala";
import { colocarLogoRelativo, type CajaRelativa } from "@/lib/marca/tamanoOptico";

import { LogoMarca } from "./LogoMarca";
import estilos from "./logoOptico.module.css";

const pct = (n: number) => `${n}%`;

/**
 * UN LOGO CON EL MISMO TAMAÑO A LA VISTA QUE LOS DEMÁS, EN UNA CAJA QUE CAMBIA DE TAMAÑO (logos
 * de repuestos, ronda 19, 2026-11-15). La regla común del selector y el banner de marca
 * (#439/#445, `colocarLogo`): se mide la parte VISIBLE del logo, sin sus márgenes transparentes
 * (`logo.recorte`, que mide el servidor con `recorteVisible`), y se escala para que ocupe la misma
 * ÁREA que los demás en su caja. Aquí en porcentajes (`colocarLogoRelativo`): la caja tiene una
 * proporción fija y su tamaño lo pone quien lo usa con `className` (el ancho; el alto sale de la
 * proporción). Los ficheros subidos no se tocan.
 *
 * Sin `recorte` (sin medir), el fichero entero cuenta como logo: sale como antes, sin romperse.
 * Componente puro: vale también dentro de un componente de cliente (la banda de la portada).
 */
export function LogoOptico({
  logo,
  caja,
  alt,
  sizes,
  className,
  loading,
  priority = false,
  alinear = "centro",
}: {
  logo: DatosLogo;
  caja: CajaRelativa;
  alt: string;
  /** Lo que mide la CAJA en la pantalla: el fichero se pide a ese ancho dividido por lo visible. */
  sizes: string;
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
  /** Dónde va el logo en la caja, a lo ancho: centrado o pegado a la izquierda (junto a un texto). */
  alinear?: "centro" | "izquierda";
}) {
  const { visible, imagen } = colocarLogoRelativo(logo, caja);
  // El fichero se pinta a `visible.ancho` % de la caja × `imagen.ancho` % de lo visible (más
  // grande que la caja si el logo tiene márgenes transparentes): se pide en esa proporción.
  const sizesImagen = sizesPorFactor(sizes, (visible.ancho / 100) * (imagen.ancho / 100));
  return (
    <span
      className={`${estilos.caja} ${className ?? ""}`}
      style={{ aspectRatio: String(caja.proporcion) } as CSSProperties}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <span
        className={estilos.recorte}
        style={{
          left: alinear === "izquierda" ? 0 : pct(visible.izquierda),
          top: pct(visible.arriba),
          width: pct(visible.ancho),
          height: pct(visible.alto),
        }}
      >
        <span
          className={estilos.imagen}
          style={{
            left: pct(imagen.izquierda),
            top: pct(imagen.arriba),
            width: pct(imagen.ancho),
            height: pct(imagen.alto),
          }}
        >
          <LogoMarca
            logo={logo}
            alt=""
            fill
            sizes={sizesImagen}
            loading={loading}
            priority={priority}
          />
        </span>
      </span>
    </span>
  );
}
