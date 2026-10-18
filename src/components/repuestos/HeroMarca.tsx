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
 *
 * `bajaSinFoto` (página de marca de maquinaria nueva, decisión de dirección del
 * 2026-10-17): sin foto de fondo, la tarjeta es más baja y el título y el texto
 * quedan centrados en vertical, en lugar de una tarjeta oscura de 630 px.
 *
 * `indice` («Plantilla 1» de Andrés, 2026-10-18): las páginas índice y las de
 * marca de nueva. La tarjeta mide el 70 % del alto de la ventana, con el
 * contenido centrado en vertical y en horizontal, y el antetítulo en rojo. Sin
 * foto y con `bajaSinFoto`, manda la tarjeta baja.
 */
export function HeroMarca({
  vista,
  anclaSiguiente,
  franja = true,
  bajaSinFoto = false,
  indice = false,
  etiquetaRaton,
}: {
  vista: VistaEncabezado;
  anclaSiguiente: string;
  /** `false`: sin la franja amarilla tras la tarjeta (las páginas índice). */
  franja?: boolean;
  /** Sin foto de fondo, una tarjeta más baja con el contenido centrado en vertical. */
  bajaSinFoto?: boolean;
  /** Variante de las páginas índice («Plantilla 1»): 70 % de la ventana, centrada. */
  indice?: boolean;
  /** Nombre accesible del icono del ratón. */
  etiquetaRaton?: string;
}) {
  const { fondo, logo } = vista;
  const baja = bajaSinFoto && !fondo;
  const variante = baja ? estilos.heroBajo : indice ? estilos.heroIndice : "";
  return (
    <section className={`${estilos.heroSeccion} ${franja ? "" : estilos.heroSeccionPlano}`}>
      <div className={`${estilos.hero} ${variante}`}>
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

          <IconoRaton href={`#${anclaSiguiente}`} etiqueta={etiquetaRaton} />
        </div>
      </div>
    </section>
  );
}
