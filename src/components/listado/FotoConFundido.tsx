"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import estilos from "./listado.module.css";

/** Ancho de la miniatura borrosa que hace de fondo mientras llega la foto. */
const ANCHO_MINIATURA = 32;

/**
 * La foto de una tarjeta con fundido al cargar (animación A6 del listado de
 * usados, `src/lib/listado/animaciones.ts`): mientras llega, se ve su miniatura
 * de 32 px desenfocada, con sus colores, en la MISMA caja que la foto (mismo
 * encaje y punto focal), así que no salta nada; al cargar, la foto aparece con
 * un fundido. Las dos son diferidas: fuera de la vista no se piden.
 *
 * Es de cliente porque necesita saber cuándo ha cargado la foto. Sin
 * JavaScript la foto se ve como siempre: la ocultación inicial y la miniatura
 * solo se aplican con `scripting: enabled` (`listado.module.css`); sin ellas,
 * la miniatura no se pinta y, al ser diferida, no se pide. Con «reducir
 * movimiento», tampoco hay miniatura.
 */
export function FotoConFundido({
  src,
  alt,
  width,
  height,
  sizes,
  posicion,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  posicion: string;
}) {
  const [cargada, setCargada] = useState(false);
  const foto = useRef<HTMLImageElement>(null);
  // La foto pudo terminar antes de hidratar (caché): entonces no habrá `load`.
  useEffect(() => {
    if (foto.current?.complete) setCargada(true);
  }, []);
  return (
    <span className={estilos.marcoFoto} data-cargada={cargada ? "" : undefined}>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={ANCHO_MINIATURA}
        height={Math.max(1, Math.round((ANCHO_MINIATURA * height) / width))}
        sizes={`${ANCHO_MINIATURA}px`}
        className={estilos.miniatura}
        style={{ objectPosition: posicion }}
      />
      <Image
        ref={foto}
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={estilos.fotoFundida}
        style={{ objectPosition: posicion }}
        onLoad={() => setCargada(true)}
        onError={() => setCargada(true)}
      />
    </span>
  );
}
