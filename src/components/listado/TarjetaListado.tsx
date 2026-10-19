import { IconEye, IconFileDescription, type Icon } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import type { FotoDeTarjeta } from "@/lib/queries/getMaquinaria";
import { posicionFocal } from "@/lib/utils/relations";

import estilos from "./listado.module.css";

/**
 * Tamaño en que se pinta la foto de la tarjeta, para que el optimizador sirva
 * la que toca (medición de C, 2026-10-14). La foto va con `contain` en una
 * caja que, desde 640 px de pantalla, no pasa de 343 px (columna de 391 px
 * menos 48 de relleno; entre 640 y 1024, unos 341). Por debajo de 640, la
 * tarjeta ocupa la columna: pantalla − 100 px (márgenes y relleno). La rejilla
 * en escritorio pinta más pequeño (3 por fila, unos 295 px); en tablet va a 2
 * por fila y la foto llega a unos 430 px.
 * Sin `sizes`, con un ancho fijo de 420, se pedía w=640 (y w=1080 en 2×) en
 * cualquier pantalla.
 */
const SIZES_FOTO =
  "(min-width: 1025px) 343px, (min-width: 768px) 430px, (min-width: 640px) 343px, calc(100vw - 100px)";
/** Solo para la proporción de la foto: el ancho que se pide lo decide `sizes`. */
const ANCHO_FOTO = 384;

export type FilaTarjeta = { icono: Icon; texto: string; valor: string | null };

/**
 * Una tarjeta del listado («Categoría secundaria» de ux-9), común a nueva y a
 * usada: en lista (por defecto) o en rejilla, según el `data-vista` de la
 * lista (`CambioDeVista`). Como ux-9: en lista, «Ver producto» y «Cotizar»; en
 * rejilla, «Ver más» y, si hay PDF, «Ficha técnica». Sin página propia
 * (`href` nulo), el título va sin enlace y sin botones.
 */
export function TarjetaListado({
  nombre,
  titulo,
  href,
  codigo,
  foto,
  logo,
  logoAlt = "",
  filas,
  pdf,
  prioridad,
}: {
  /** El nombre completo, para la foto sin `alt` y los textos solo para lectores. */
  nombre: string;
  titulo: string;
  href: string | null;
  /** Línea roja bajo el título (el modelo, en nueva). */
  codigo?: string | null;
  foto: FotoDeTarjeta | null;
  logo?: FotoDeTarjeta | null;
  logoAlt?: string;
  filas: FilaTarjeta[];
  pdf?: string | null;
  prioridad: boolean;
}) {
  return (
    <li className={estilos.tarjeta}>
      <div className={estilos.foto}>
        {foto?.url && foto.width && foto.height ? (
          <Image
            src={foto.url}
            alt={foto.alt || nombre}
            width={ANCHO_FOTO}
            height={Math.round((ANCHO_FOTO * foto.height) / foto.width)}
            sizes={SIZES_FOTO}
            priority={prioridad}
            style={{ objectPosition: posicionFocal(foto.focalX, foto.focalY) }}
          />
        ) : null}
        {logo?.url && logo.width && logo.height ? (
          <span className={estilos.logo}>
            <Image
              src={logo.url}
              alt={logoAlt}
              width={96}
              height={Math.round((96 * logo.height) / logo.width)}
            />
          </span>
        ) : null}
      </div>
      <div className={estilos.datos}>
        <h3 className={estilos.nombre}>{href ? <Link href={href}>{titulo}</Link> : titulo}</h3>
        {codigo ? <p className={estilos.modelo}>{codigo}</p> : null}
        <hr className={estilos.linea} />
        <ul className={estilos.lista}>
          {filas
            .filter((f) => f.valor)
            .map(({ icono: IconoFila, texto, valor }) => (
              <li key={texto}>
                <span className={estilos.circulo}>
                  <IconoFila size={16} stroke={1.8} aria-hidden="true" />
                </span>
                <span className={estilos.dato}>
                  {texto}: {valor}
                </span>
              </li>
            ))}
        </ul>
        {href ? (
          <div className={estilos.botones}>
            <Link
              href={href}
              className={`${estilos.boton} ${estilos.botonRojo} ${estilos.soloLista}`}
            >
              <IconEye size={18} stroke={1.8} aria-hidden="true" />
              Ver producto<span className="sr-only">: {nombre}</span>
            </Link>
            <Link
              href={`${href}#cotizar`}
              className={`${estilos.boton} ${estilos.botonNegro} ${estilos.soloLista}`}
            >
              Cotizar<span className="sr-only">: {nombre}</span>
            </Link>
            <Link
              href={href}
              className={`${estilos.boton} ${estilos.botonRojo} ${estilos.soloRejilla}`}
            >
              Ver más<span className="sr-only">: {nombre}</span>
            </Link>
            {pdf ? (
              <a
                href={pdf}
                className={`${estilos.boton} ${estilos.botonNegro} ${estilos.soloRejilla}`}
              >
                <IconFileDescription size={18} stroke={1.8} aria-hidden="true" />
                Ficha técnica<span className="sr-only"> de {nombre} (PDF)</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
