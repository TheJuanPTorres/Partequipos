"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  src: string;
  nombreSitio: string;
  /** Nombre accesible del `<h1>` de la portada: el título de la página `inicio`. */
  tituloPortada: string;
};

/**
 * EL LOGO ES EL `<h1>` DE LA PORTADA, y solo de la portada (desviación D1,
 * docs/diseno/decisiones-home-ux9.md). En el resto de páginas el `<h1>` es el
 * título de cada una y el logo es un enlace sin encabezado.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): la cabecera vive en el
 * layout, que no sabe en qué ruta está; `usePathname` sí. Se prerenderiza en el
 * servidor igualmente: el `<h1>` está en el HTML inicial.
 *
 * TAMAÑO: se declara el PINTADO (36 px de alto → 184 de ancho, proporción del
 * PNG 1614×317), no el del fichero. Con 1614×317 `next/image` generaba el
 * `srcset` a 1920 y 3840 px para pintar 184: 11,7 kB en vez de 2,9 (§2).
 */
export function LogoCabecera({ src, nombreSitio, tituloPortada }: Props) {
  const esPortada = usePathname() === "/";
  const imagen = (
    <Image
      src={src}
      alt={esPortada ? tituloPortada : nombreSitio}
      width={184}
      height={36}
      className="h-9 w-auto object-contain"
      preload
    />
  );

  if (esPortada) {
    return (
      <h1 className="m-0 shrink-0">
        <Link href="/" aria-current="page">
          {imagen}
        </Link>
      </h1>
    );
  }

  return (
    <Link href="/" className="shrink-0" aria-label={`${nombreSitio} — Inicio`}>
      {imagen}
    </Link>
  );
}
