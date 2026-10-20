import { IconEngine } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { EnlaceContacto } from "@/components/forms/EnlaceContacto";

import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";
import { CATEGORIAS_POR_TARJETA, enTarjetas, type TarjetaRepuesto } from "@/lib/portada/seccionesE";

import { TarjetasApiladas } from "./diferidos";
import estilos from "./repuestos.module.css";

/**
 * SECCIÓN «Venta de repuestos» de la portada — Home V2 de Andrés (sección 6 de
 * `elementor-3519`): widget «Stacking Cards» con DOS tarjetas apiladas. Al
 * bajar, la segunda sube y tapa a la primera (decisión de dirección del
 * 2026-10-16, que corrige la fila de 4 y la tarjeta grande del #182).
 *
 * Cada tarjeta lleva CINCO categorías técnicas, en el orden de su posición en
 * la portada (las 10 de la página de categorías de WordPress: 5 y 5). Las
 * tarjetas se pintan aquí, en el servidor; el envoltorio de cliente
 * (`TarjetasApiladas`) solo calcula la escala ligada al scroll.
 *
 * Lo que se aparta del diseño (docs/diseno/decisiones-home-v2-repuestos.md):
 * - Título en `<h2>` y cada categoría en `<h3>` (en el diseño, `<h2>`).
 * - «Ver todo» solo si la categoría tiene enlace (el diseño enlaza «#»).
 * - En móvil, cada categoría en una fila (foto pequeña a la izquierda): la
 *   referencia pone una por fila a todo el ancho y desborda la tarjeta.
 * - Con «reducir movimiento», sin barrido: una tarjeta tras otra.
 */

/** Ancho pintado de la foto: 160 px a 1440, ~140 a 1010 y 72 en móvil. */
const SIZES_FOTO = "(max-width: 767px) 72px, (max-width: 1024px) 18vw, 160px";

function Categoria({
  t,
  idTitulo,
  verMas,
}: {
  t: TarjetaRepuesto;
  idTitulo: string;
  verMas: string;
}) {
  return (
    <li className={estilos.categoria} data-con-foto={t.imagen ? "" : undefined}>
      {/* Sin foto no se reserva su hueco: la tarjeta se ajusta al texto. */}
      {t.imagen ? (
        <div className={estilos.foto}>
          <Image
            src={t.imagen.url}
            alt=""
            width={160}
            height={160}
            sizes={SIZES_FOTO}
            className={estilos.img}
            style={{ objectPosition: t.imagen.posicion }}
          />
        </div>
      ) : null}
      <div className={estilos.textoCategoria}>
        <h3 id={idTitulo} className={estilos.tituloCategoria}>
          {t.titulo}
        </h3>
        {t.href && verMas ? (
          <Link
            href={t.href}
            aria-describedby={idTitulo}
            className={`${estilos.verMas} texto-etiqueta`}
          >
            {verMas}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export type TextosRepuestos = {
  antetitulo: string;
  titulo: string;
  verMasTexto: string;
  botonTexto: string;
  botonEnlace: string;
};

export function SeccionRepuestos({
  tarjetas,
  textos,
}: {
  tarjetas: TarjetaRepuesto[];
  textos: TextosRepuestos;
}) {
  if (tarjetas.length === 0) return null;
  return (
    <section className={estilos.seccion} aria-labelledby="portada-repuestos-titulo">
      <div className={estilos.caja}>
        <div className={estilos.separador} aria-hidden="true" />
        {textos.antetitulo ? (
          <p className={`${estilos.antetitulo} texto-etiqueta`}>{textos.antetitulo}</p>
        ) : null}
        {textos.titulo ? (
          <Revelado
            adelanto={ADELANTOS.medio}
            como="h2"
            id="portada-repuestos-titulo"
            texto={textos.titulo}
            ritmo="titulo"
            disparo={0.95}
            className={`${estilos.titulo} texto-titulo-seccion`}
          />
        ) : null}
        <TarjetasApiladas className={estilos.apiladas} claseItem={estilos.item}>
          {enTarjetas(tarjetas).map((grupo, g) => (
            <ul key={g} className={estilos.tarjeta}>
              {grupo.map((t, i) => {
                const n = g * CATEGORIAS_POR_TARJETA + i + 1;
                // El id sale de la posición, no de la base: no se exponen ids (CLAUDE.md §8).
                return (
                  <Categoria
                    key={t.id}
                    t={t}
                    idTitulo={`portada-repuesto-${n}`}
                    verMas={textos.verMasTexto}
                  />
                );
              })}
            </ul>
          ))}
        </TarjetasApiladas>
        {textos.botonTexto && textos.botonEnlace ? (
          <div className={estilos.pie}>
            <EnlaceContacto href={textos.botonEnlace} className={`${estilos.boton} texto-etiqueta`}>
              <IconEngine aria-hidden="true" focusable="false" stroke={1.75} />
              {textos.botonTexto}
            </EnlaceContacto>
          </div>
        ) : null}
      </div>
    </section>
  );
}
