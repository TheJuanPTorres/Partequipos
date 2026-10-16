import { IconEngine } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";
import type { TarjetaRepuesto } from "@/lib/portada/seccionesE";

import { ICONOS_CATEGORIA } from "./iconosCategoria";
import estilos from "./repuestos.module.css";

/**
 * SECCIÓN «Venta de repuestos» de la portada — fila de categorías (Home V2 de
 * Andrés, plantilla 3474; sustituye a las tarjetas apiladas de ux-9).
 *
 * Componente de SERVIDOR, sin JavaScript de cliente. Una tarjeta blanca por
 * categoría técnica con posición en la portada: foto, título y «Ver todo».
 *
 * Lo que se aparta del diseño (docs/diseno/decisiones-home-v2-repuestos.md):
 * - Título en `<h2>` y cada tarjeta en `<h3>` (en el diseño, `<h2>` en todas).
 * - Las categorías salen de `categorias-tecnicas` y sus fotos son las reales:
 *   la fila de la referencia lleva cuatro de maqueta («Baldes y…» cortado).
 * - «Ver todo» solo si la categoría tiene enlace (el diseño enlaza «#»).
 */

/** Ancho pintado de la foto: 225 px como máximo, o lo que deje la tarjeta. */
const SIZES_FOTO = "(max-width: 767px) 225px, (max-width: 1024px) 40vw, 225px";

function Tarjeta({
  t,
  idTitulo,
  verMas,
}: {
  t: TarjetaRepuesto;
  idTitulo: string;
  verMas: string;
}) {
  return (
    <li className={estilos.tarjeta} data-con-foto={t.imagen ? "" : undefined}>
      {/* Sin foto no se reserva su hueco: la tarjeta se ajusta al texto. */}
      {t.imagen ? (
        <div className={estilos.foto}>
          <Image
            src={t.imagen.url}
            alt=""
            width={225}
            height={225}
            sizes={SIZES_FOTO}
            className={estilos.img}
            style={{ objectPosition: t.imagen.posicion }}
          />
        </div>
      ) : null}
      <h3 id={idTitulo} className={estilos.tituloTarjeta}>
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
    </li>
  );
}

/**
 * Tarjeta grande bajo la fila («Blades y corte» en la referencia): la primera
 * categoría de la portada, con su descripción y su foto del panel. Sin
 * descripción no se pinta: repetir solo el título no aporta nada.
 */
function Destacada({
  t,
  idTitulo,
  verMas,
}: {
  t: TarjetaRepuesto;
  idTitulo: string;
  verMas: string;
}) {
  const Icono = t.icono ? ICONOS_CATEGORIA[t.icono] : null;
  return (
    <article
      className={estilos.destacada}
      data-con-foto={t.imagen ? "" : undefined}
      aria-labelledby={idTitulo}
    >
      <div className={estilos.destacadaTexto}>
        {Icono ? (
          <span className={estilos.icono} aria-hidden="true">
            <Icono focusable="false" stroke={1.75} />
          </span>
        ) : null}
        <h3 id={idTitulo} className={estilos.destacadaTitulo}>
          {t.titulo}
        </h3>
        <p className={`${estilos.destacadaDescripcion} texto-cuerpo`}>{t.texto}</p>
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
      {t.imagen ? (
        <div className={estilos.destacadaFoto}>
          <Image
            src={t.imagen.url}
            alt=""
            fill
            sizes="(max-width: 767px) calc(100vw - 20px), (max-width: 1024px) 40vw, 456px"
            className={estilos.destacadaImg}
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
            adelanto={ADELANTOS.medio}
            como="h2"
            id="portada-repuestos-titulo"
            texto={textos.titulo}
            ritmo="titulo"
            disparo={0.95}
            className={`${estilos.titulo} texto-titulo-seccion`}
          />
        ) : null}
        <div className={estilos.fila}>
          <ul className={estilos.lista}>
            {tarjetas.map((t, i) => (
              // El id sale de la posición, no de la base: no se exponen ids (CLAUDE.md §8).
              <Tarjeta
                key={t.id}
                t={t}
                idTitulo={`portada-repuesto-${i + 1}`}
                verMas={textos.verMasTexto}
              />
            ))}
          </ul>
        </div>
        {tarjetas[0]?.texto ? (
          <Destacada
            t={tarjetas[0]}
            idTitulo="portada-repuesto-destacada"
            verMas={textos.verMasTexto}
          />
        ) : null}
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
