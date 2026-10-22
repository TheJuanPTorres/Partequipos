import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { VerTodosEquipos } from "@/components/nueva/VerTodosEquipos";
import type { TarjetaMarca } from "@/lib/repuestos/marca";

import estilos from "./marca.module.css";
import { RecuadrosConScroll } from "./RecuadrosConScroll";

/**
 * «REPUESTOS SEGÚN TIPO DE MÁQUINA» (ux-9): una tarjeta por tipo de la marca
 * con su foto, un panel blanco que sube sobre la foto con el título y el botón
 * «Ver todo» a la página del tipo; y, al final, las del marketplace (maquinaria
 * usada y aditamentos).
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-repuestos-marca.md):
 * - Las tarjetas salen de los tipos de la marca (en ux-9, seis fijas): se
 *   pintan todas en los tres tamaños. ux-9 oculta por posición la 4.ª a la 6.ª
 *   en móvil y la 3.ª y la 6.ª en tablet, solo por la maqueta de seis; aquí un
 *   tipo nunca se oculta (SEO: sus enlaces siguen visibles). Solo las del
 *   marketplace se ocultan en móvil, como pidió dirección.
 * - El panel crece con el título: en ux-9 tiene alto fijo y con tres líneas el
 *   botón asoma por debajo del panel (errata, anotada para Andrés).
 * - Sin foto, la tarjeta se pinta solo con el panel, sin hueco.
 * - Foto decorativa (`alt` vacío) y «Ver todo» describe su tarjeta con
 *   `aria-describedby`.
 */
export function TarjetasMarca({
  id,
  titulo,
  verTodo,
  tarjetas,
  indice = false,
  cuatroEnUnaFila = false,
  etiqueta = "Páginas de la sección",
  panelR5 = false,
}: {
  id: string;
  /** Sin título (las páginas índice no lo llevan) la sección se nombra con `etiqueta`. */
  titulo?: string;
  verTodo: string;
  tarjetas: TarjetaMarca[];
  /** Variante de las páginas índice: sección blanca de esquinas redondeadas, sin título. */
  indice?: boolean;
  /**
   * Con exactamente 4 tarjetas: en una fila en escritorio y 2 + 2 en tablet y móvil (las líneas
   * de Lubricantes ENI, plantilla de Andrés 3946). Con otro número, la colocación de siempre.
   */
  cuatroEnUnaFila?: boolean;
  etiqueta?: string;
  /** R5 de repuestos: el panel «Ver todo» con buscador y orden natural. */
  panelR5?: boolean;
}) {
  if ((!titulo && !indice) || tarjetas.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${estilos.tarjetas} ${indice ? estilos.tarjetasIndice : ""}`}
      aria-labelledby={titulo ? idTitulo : undefined}
      aria-label={titulo ? undefined : etiqueta}
    >
      {titulo ? (
        <h2 id={idTitulo} className={estilos.tituloSeccion}>
          {titulo}
        </h2>
      ) : null}
      <RejillaTarjetas
        id={id}
        tarjetas={tarjetas}
        verTodo={verTodo}
        indice={indice}
        nivel={titulo ? "h3" : "h2"}
        panelR5={panelR5}
        cuatroEnUnaFila={cuatroEnUnaFila}
      />
      {indice ? <RecuadrosConScroll /> : null}
    </section>
  );
}

/**
 * La REJILLA de tarjetas (la lista), también suelta: la página de tipo pinta una por serie
 * (`ModelosTipo`). `nivel` es el de los títulos de las tarjetas: sin título de sección (páginas
 * índice) cuelgan del h1 (h2); bajo un título de sección, h3; bajo el de una serie, h4.
 *
 * El botón: con `panel` (marca de repuestos), «Ver todo» abre el panel con los modelos de la
 * tarjeta (`VerTodosEquipos`) y, sin JavaScript, lleva a `href`; sin `href` (un modelo sin
 * ficha), la tarjeta no lleva botón.
 */
export function RejillaTarjetas({
  id,
  tarjetas,
  verTodo,
  indice = false,
  nivel: Nivel,
  panelR5 = false,
  cuatroEnUnaFila = false,
}: {
  id: string;
  tarjetas: TarjetaMarca[];
  verTodo: string;
  indice?: boolean;
  nivel: "h2" | "h3" | "h4";
  panelR5?: boolean;
  /** Ver `TarjetasMarca`. */
  cuatroEnUnaFila?: boolean;
}) {
  return (
    <ul
      className={`${estilos.rejilla} ${estilos.rejillaTarjetas} ${cuatroEnUnaFila ? estilos.rejillaCuatroEnUnaFila : ""}`}
    >
      {tarjetas.map((t) => {
        const idT = `${id}-${t.clave}`;
        // En los índices, la flecha maciza del export (fa-arrow-right) a su tamaño.
        const flecha = (
          <IconArrowRight
            aria-hidden="true"
            focusable="false"
            stroke={indice ? 3 : 2}
            size={indice ? 16 : 14}
          />
        );
        return (
          <li
            key={t.clave}
            className={`${estilos.tarjeta} ${t.soloEscritorio ? estilos.soloEscritorio : ""}`}
          >
            {t.logo ? (
              <div className={estilos.foto}>
                <LogoMarca
                  logo={t.logo}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 45vw, 400px"
                  className={`${estilos.fotoImg} ${estilos.fotoLogo}`}
                />
              </div>
            ) : t.imagen ? (
              <div className={estilos.foto}>
                <Image
                  src={t.imagen.url}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 45vw, 400px"
                  className={estilos.fotoImg}
                  style={{ objectPosition: t.imagen.posicion }}
                />
              </div>
            ) : null}
            <div
              className={estilos.panel}
              data-con-foto={t.imagen || t.logo ? "" : undefined}
              // En los índices, el recuadro se desplaza con el scroll (`RecuadrosConScroll`).
              data-recuadro-scroll={indice && (t.imagen || t.logo) ? "" : undefined}
            >
              <Nivel id={idT} className={estilos.tituloTarjeta}>
                {t.titulo}
              </Nivel>
              {t.detalle ? <p className={estilos.detalleTarjeta}>{t.detalle}</p> : null}
              {verTodo && t.href && t.panel ? (
                <VerTodosEquipos
                  titulo={t.panel.titulo}
                  href={t.href}
                  total={t.panel.total}
                  equipos={t.panel.elementos}
                  className={estilos.botonTarjeta}
                  etiqueta={
                    <>
                      {flecha}
                      {verTodo}
                    </>
                  }
                  describedBy={idT}
                  enlacePagina={t.panel.enlacePagina}
                  acento={t.panel.acento}
                  buscador={panelR5}
                />
              ) : verTodo && t.href ? (
                <Link href={t.href} aria-describedby={idT} className={estilos.botonTarjeta}>
                  {flecha}
                  {verTodo}
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
