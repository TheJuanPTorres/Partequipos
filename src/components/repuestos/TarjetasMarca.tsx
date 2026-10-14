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
}: {
  id: string;
  titulo: string;
  verTodo: string;
  tarjetas: TarjetaMarca[];
}) {
  if (!titulo || tarjetas.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section className={estilos.tarjetas} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
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
                <h3 id={idT} className={estilos.tituloTarjeta}>
                  {t.titulo}
                </h3>
                {verTodo ? (
                  <Link href={t.href} aria-describedby={idT} className={estilos.botonTarjeta}>
                    <IconArrowRight aria-hidden="true" focusable="false" stroke={2} size={14} />
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
