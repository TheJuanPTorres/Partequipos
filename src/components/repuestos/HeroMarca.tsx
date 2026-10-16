import Image from "next/image";

import reserva from "@/components/blog/cabeceraArticulo.module.css";
import { Revelado } from "@/components/movimiento/Revelado";
import type { VistaEncabezado } from "@/lib/repuestos/marca";

import { IconoRaton } from "./IconoRaton";
import estilos from "./marca.module.css";

/**
 * ENCABEZADO DE LA PÁGINA DE MARCA DE REPUESTOS (ux-9, contenedor de la
 * plantilla 3373). Tarjeta de bordes redondeados sobre la franja de color de
 * la página, con la foto de obra de la marca de fondo, el logo de la marca en
 * una placa blanca, el título en dos líneas, la presentación y el icono de
 * desplazamiento.
 *
 * Componente de SERVIDOR: el título usa `Revelado` (cliente) con `alCargar`,
 * así que la animación es CSS puro desde el primer pintado, sin parpadeo.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-repuestos-marca.md):
 * - Las dos líneas del título van en UN solo `<h1>` (en ux-9, dos `<h2>`).
 * - Sin foto de fondo, la tarjeta queda en el tono oscuro del velo: el texto
 *   blanco se lee y no hay hueco.
 * - El logo lleva `alt` con el nombre de la marca (en ux-9, vacío).
 */
export function HeroMarca({
  vista,
  anclaSiguiente,
  franja = true,
}: {
  vista: VistaEncabezado;
  anclaSiguiente: string;
  /** `false`: sin la franja amarilla tras la tarjeta (las páginas índice). */
  franja?: boolean;
}) {
  const { fondo, logo } = vista;
  return (
    <section className={`${estilos.heroSeccion} ${franja ? "" : estilos.heroSeccionPlano}`}>
      <div className={estilos.hero}>
        {fondo ? (
          <Image
            src={fondo.url}
            alt=""
            fill
            priority
            sizes="100vw"
            className={estilos.fondo}
            style={{ objectPosition: fondo.posicion }}
          />
        ) : null}
        <div className={estilos.velo} aria-hidden="true" />

        <div className={estilos.heroContenido}>
          {logo ? (
            <div className={estilos.placa}>
              <Image
                src={logo.url}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                sizes="131px"
                className={estilos.logo}
              />
            </div>
          ) : null}

          {vista.antetitulo ? <p className={estilos.antetituloHero}>{vista.antetitulo}</p> : null}

          <h1 className={estilos.h1}>
            <Revelado
              como="span"
              alCargar
              ritmo="titulo"
              texto={vista.linea1}
              className={estilos.linea1}
            />
            {vista.linea2 ? (
              <Revelado
                como="span"
                alCargar
                ritmo="titulo"
                texto={vista.linea2}
                className={estilos.linea2}
              />
            ) : null}
          </h1>

          {/*
           * Sin desplazamiento al llegar Inter (medido: CLS 0,073 a 1440 en el tipo
           * de repuestos): el alto lo fija una copia invisible del texto en la
           * fuente de respaldo, la técnica de la cabecera del artículo.
           */}
          {vista.descripcion ? (
            <p
              className={`${estilos.presentacion} ${reserva.reserva}`}
              data-reserva={vista.descripcion}
            >
              <span>{vista.descripcion}</span>
            </p>
          ) : null}

          <IconoRaton href={`#${anclaSiguiente}`} />
        </div>
      </div>
    </section>
  );
}
