import type { CSSProperties } from "react";

import { colocarLogo, type Caja } from "@/lib/marca/tamanoOptico";
import type { LogoConAlt } from "@/lib/marca/logoMarca";

import { LogoMarca } from "./LogoMarca";
import estilos from "./logoEnCaja.module.css";

const px = (n: number) => `${n}px`;

/** El tamaño de una caja fija, para el contenedor que la reserva. */
export function tamanoCaja(caja: Caja): CSSProperties {
  return { width: px(caja.ancho), height: px(caja.alto) };
}

/**
 * UN LOGO EN UNA CAJA FIJA (selector de marcas #439 y banner de marca, 2026-11-09): con la misma
 * área visible que los demás (`colocarLogo`), sin sus márgenes transparentes (la parte visible la
 * mide el servidor, `recorteVisible`), centrado y sin filtros. Quien lo usa pone la caja
 * (`tamanoCaja`, posicionada) y, con `className`, si se ve o no.
 */
export function LogoEnCaja({
  logo,
  caja,
  className,
  placa = false,
  loading = "eager",
}: {
  logo: LogoConAlt;
  caja: Caja;
  className?: string;
  /** Sobre una plaquita blanca (la pinta quien lo usa, con `[data-placa]`). */
  placa?: boolean;
  loading?: "eager" | "lazy";
}) {
  const { visible, imagen } = colocarLogo(logo, caja);
  return (
    <span className={className} data-placa={placa ? "" : undefined} aria-hidden="true">
      <span
        className={estilos.recorte}
        style={{
          left: px(visible.izquierda),
          top: px(visible.arriba),
          width: px(visible.ancho),
          height: px(visible.alto),
        }}
      >
        <span
          className={estilos.imagen}
          style={{
            left: px(imagen.izquierda),
            top: px(imagen.arriba),
            width: px(imagen.ancho),
            height: px(imagen.alto),
          }}
        >
          <LogoMarca
            logo={logo}
            alt=""
            fill
            loading={loading}
            sizes={px(Math.ceil(imagen.ancho))}
          />
        </span>
      </span>
    </span>
  );
}
