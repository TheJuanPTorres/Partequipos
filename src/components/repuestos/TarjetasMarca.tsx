import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import type { TarjetaMarca } from "@/lib/repuestos/marca";

import estilos from "./marca.module.css";

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
  etiqueta = "Páginas de la sección",
}: {
  id: string;
  /** Sin título (las páginas índice no lo llevan) la sección se nombra con `etiqueta`. */
  titulo?: string;
  verTodo: string;
  tarjetas: TarjetaMarca[];
  /** Variante de las páginas índice: sección blanca de esquinas redondeadas, sin título. */
  indice?: boolean;
  etiqueta?: string;
}) {
  if ((!titulo && !indice) || tarjetas.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  // Sin título de sección (páginas índice) las tarjetas cuelgan del h1: h2, no h3.
  const Nivel = titulo ? "h3" : "h2";
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
      <ul className={estilos.rejilla}>
        {tarjetas.map((t) => {
          const idT = `${id}-${t.clave}`;
          return (
            <li
              key={t.clave}
              className={`${estilos.tarjeta} ${t.soloEscritorio ? estilos.soloEscritorio : ""}`}
            >
              {t.imagen ? (
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
              <div className={estilos.panel} data-con-foto={t.imagen ? "" : undefined}>
                <Nivel id={idT} className={estilos.tituloTarjeta}>
                  {t.titulo}
                </Nivel>
                {verTodo ? (
                  <Link href={t.href} aria-describedby={idT} className={estilos.botonTarjeta}>
                    {/* En los índices, la flecha maciza del export (fa-arrow-right) a su tamaño. */}
                    <IconArrowRight
                      aria-hidden="true"
                      focusable="false"
                      stroke={indice ? 3 : 2}
                      size={indice ? 16 : 14}
                    />
                    {verTodo}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
