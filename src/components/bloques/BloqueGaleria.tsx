import Image from "next/image";
import { useId } from "react";

import type { VistaGaleria as Datos } from "@/lib/bloques/vista";

import estilos from "./galeria.module.css";

const SIZES = "(max-width: 767px) 46vw, (max-width: 1279px) 31vw, 22vw";

/**
 * BLOQUE «GALERÍA» — rejilla de fotos, de servidor y sin JavaScript. Sustituye
 * a la galería «justificada» de Elementor del sitio actual (servicio técnico,
 * siniestros). Sin visor a pantalla completa: el sitio actual tampoco lo tenía
 * y pediría un componente de cliente.
 *
 * Las fotos se recortan a la misma proporción (4:3) con su punto focal, así la
 * rejilla no salta al cargar (CLS 0). Cada una lleva su texto alternativo.
 */
export function BloqueGaleria({ antetitulo, titulo, imagenes }: Datos) {
  const idTitulo = useId();
  return (
    <section className={estilos.seccion} aria-labelledby={idTitulo}>
      {antetitulo ? (
        <p className={`${estilos.antetitulo} texto-destacado-negrita`}>{antetitulo}</p>
      ) : null}
      <h2 id={idTitulo} className={titulo ? `${estilos.titulo} texto-titulo-seccion` : "sr-only"}>
        {titulo || "Galería de fotos"}
      </h2>
      <ul className={estilos.rejilla}>
        {imagenes.map((imagen, i) => (
          <li key={`${imagen.url}-${i}`} className={estilos.celda}>
            <Image
              src={imagen.url}
              alt={imagen.alt}
              fill
              sizes={SIZES}
              className={estilos.foto}
              style={{ objectPosition: imagen.posicion }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
