import {
  IconAssembly,
  IconBucketDroplet,
  IconEngine,
  IconFilter,
  IconSettings,
  IconWheel,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import type { IconoCategoria, TarjetaRepuesto } from "@/lib/portada/seccionesE";

import estilos from "./repuestos.module.css";
import { TarjetasApiladas } from "./diferidos";

/**
 * SECCIÓN 5 DE LA PORTADA — «Venta de repuestos» con tarjetas apiladas (ux-9).
 *
 * Componente de SERVIDOR: las tarjetas se pintan aquí; el envoltorio de
 * cliente (`TarjetasApiladas`) solo calcula la escala ligada al scroll.
 * Las tarjetas salen de `categorias-tecnicas` con posición en la portada.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-home-ux9.md §18):
 * - D1: título en `<h2>` y cada tarjeta en `<h3>` (en ux-9, `<div>`).
 * - D6: iconos de Tabler en vez de los SVG del kit (Flaticon, L2).
 * - D16: «Ver todos los repuestos» (ux-9: «Ver todas los repuestos», errata).
 * - D17: «Ver más» solo si la categoría tiene enlace (ux-9 enlaza «#»).
 */

const ICONOS: Record<IconoCategoria, typeof IconSettings> = {
  corte: IconSettings,
  llanta: IconWheel,
  lubricante: IconBucketDroplet,
  filtro: IconFilter,
  motor: IconEngine,
  rodaje: IconAssembly,
};

/** Ancho pintado de la foto: 40 % de la tarjeta (456 px a 1440); en móvil, toda. */
const SIZES_FOTO = "(max-width: 767px) calc(100vw - 20px), (max-width: 1024px) 40vw, 456px";

function Tarjeta({
  t,
  idTitulo,
  verMas,
}: {
  t: TarjetaRepuesto;
  idTitulo: string;
  verMas: string;
}) {
  const Icono = t.icono ? ICONOS[t.icono] : null;
  return (
    <article
      className={estilos.tarjeta}
      data-con-foto={t.imagen ? "" : undefined}
      aria-labelledby={idTitulo}
    >
      <div className={estilos.contenido}>
        {Icono ? (
          <span className={estilos.icono} aria-hidden="true">
            <Icono focusable="false" stroke={1.75} />
          </span>
        ) : null}
        <h3 id={idTitulo} className={`${estilos.tituloTarjeta} texto-titulo-bloque`}>
          {t.titulo}
        </h3>
        {t.texto ? <p className={`${estilos.texto} texto-cuerpo`}>{t.texto}</p> : null}
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
      {/* Sin foto no se reserva su columna: el texto ocupa la tarjeta. */}
      {t.imagen ? (
        <div className={estilos.foto}>
          <Image
            src={t.imagen.url}
            alt=""
            fill
            sizes={SIZES_FOTO}
            className={estilos.img}
            style={{ objectPosition: t.imagen.posicion }}
          />
        </div>
      ) : null}
    </article>
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
            como="h2"
            id="portada-repuestos-titulo"
            texto={textos.titulo}
            ritmo="titulo"
            disparo={0.95}
            className={`${estilos.titulo} texto-titulo-seccion`}
          />
        ) : null}
        <TarjetasApiladas className={estilos.lista} claseItem={estilos.item}>
          {tarjetas.map((t, i) => (
            // El id sale de la posición, no de la base: no se exponen ids (CLAUDE.md §8).
            <Tarjeta
              key={t.id}
              t={t}
              idTitulo={`portada-repuesto-${i + 1}`}
              verMas={textos.verMasTexto}
            />
          ))}
        </TarjetasApiladas>
        {textos.botonTexto && textos.botonEnlace ? (
          <div className={estilos.pie}>
            <Link href={textos.botonEnlace} className={`${estilos.boton} texto-etiqueta`}>
              <IconEngine aria-hidden="true" focusable="false" stroke={1.75} />
              {textos.botonTexto}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
