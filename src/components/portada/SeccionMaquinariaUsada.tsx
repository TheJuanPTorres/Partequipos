import { IconEngine, IconGauge, IconSettings, IconWeight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";
import type { DatoFicha, Pestana, TarjetaEquipo } from "@/lib/portada/secciones";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./maquinariaUsada.module.css";
import { PestanasUsada } from "./diferidos";

/**
 * «MAQUINARIA PESADA USADA» DE LA PORTADA — Home V2 de Andrés (2026-10-15),
 * secciones 3 (cabecera) y 4 (pestañas) de `elementor-3519`.
 *
 * Componente de SERVIDOR: las tarjetas se pintan aquí y llegan ya hechas a las
 * pestañas (cliente). Los textos son del panel (página «inicio»); las
 * tarjetas, de `equipos-usados`; la máquina decorativa, de la portada.
 *
 * Lo que se aparta del diseño (docs/diseno/decisiones-home-ux9.md §33):
 * - El título en `<h2>` y el subtítulo y la frase en `<p>` (en el diseño,
 *   `<div>` y `<h3>`); el nombre de cada tarjeta en `<h3>`.
 * - D10: en móvil siguen siendo pestañas, no acordeón.
 * - Las tres pestañas con tarjetas verticales (el diseño solo rediseña la
 *   primera; «Otros» y «Aditamentos» conservan las de ux-9), por petición de
 *   dirección.
 * - «Ficha técnica» solo si la unidad tiene PDF; sin él, no se pinta.
 * - Iconos de Tabler en vez de los de Flaticon (L2).
 */

const ICONOS: Record<DatoFicha["clave"], typeof IconWeight> = {
  peso: IconWeight,
  potencia: IconGauge,
  motor: IconEngine,
};

/** Ancho pintado de la foto: la tarjeta menos su relleno (1 columna en móvil, 3 en el resto). */
const SIZES_TARJETA = "(max-width: 767px) calc(100vw - 93px), calc(32vw - 76px)";

/** `idNombre` sale de la posición, no del id de la base: no se exponen ids (CLAUDE.md §8). */
function Tarjeta({
  equipo,
  idNombre,
  verTexto,
}: {
  equipo: TarjetaEquipo;
  idNombre: string;
  verTexto: string;
}) {
  return (
    <article className={estilos.tarjeta} aria-labelledby={idNombre}>
      {/* Sin foto no se reserva su hueco: el texto sube. */}
      {equipo.imagen ? (
        <div className={estilos.foto}>
          <Image
            src={equipo.imagen.url}
            alt={equipo.imagen.alt}
            fill
            sizes={SIZES_TARJETA}
            className={estilos.img}
            style={{ objectPosition: equipo.imagen.posicion }}
          />
        </div>
      ) : null}
      <h3 id={idNombre} className={`${estilos.nombre} texto-destacado-negrita`}>
        {equipo.nombre}
      </h3>
      {equipo.ficha.length > 0 ? (
        <ul className={estilos.ficha}>
          {equipo.ficha.map((d) => {
            const Icono = ICONOS[d.clave];
            return (
              <li key={d.clave} className={`${estilos.dato} texto-cuerpo`}>
                <Icono
                  aria-hidden="true"
                  focusable="false"
                  stroke={1.75}
                  className={estilos.icono}
                />
                <span>
                  <span className={estilos.etiquetaDato}>{d.etiqueta}:</span> {d.valor}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className={estilos.botones}>
        {verTexto ? (
          <Link
            href={equipo.href}
            aria-describedby={idNombre}
            className={`${estilos.boton} texto-etiqueta`}
          >
            {verTexto}
          </Link>
        ) : null}
        {equipo.fichaPdf ? (
          <a
            href={equipo.fichaPdf}
            className={`${estilos.boton} ${estilos.botonOscuro} texto-etiqueta`}
          >
            Ficha técnica<span className="sr-only"> de {equipo.nombre} (PDF)</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

export type TextosUsada = {
  antetitulo: string;
  titulo: string;
  marcasTitulo: string;
  marcasTexto: string;
  botonTexto: string;
  verProductoTexto: string;
};

type Props = {
  pestanas: Pestana[];
  maquina: ImagenLista | null;
  hrefVerTodo: string;
  textos: TextosUsada;
};

export function SeccionMaquinariaUsada({ pestanas, maquina, hrefVerTodo, textos }: Props) {
  if (pestanas.length === 0) return null;
  return (
    <section className={estilos.seccion} aria-labelledby="portada-usada-titulo">
      <div className={maquina ? `${estilos.cabecera} ${estilos.conMaquina}` : estilos.cabecera}>
        {/* Sin máquina no se reserva su columna: los textos ocupan la cabecera. */}
        {maquina ? (
          <div className={estilos.izq}>
            <Image
              src={maquina.url}
              alt=""
              width={maquina.width}
              height={maquina.height}
              sizes="(max-width: 767px) 72vw, (max-width: 1024px) min(46vw, 368px), 45vw"
              className={estilos.maquina}
            />
          </div>
        ) : null}
        <div className={estilos.der}>
          <div className={estilos.espacioDer} />
          {textos.antetitulo ? (
            <p className={`${estilos.antetitulo} texto-etiqueta`}>{textos.antetitulo}</p>
          ) : null}
          {textos.titulo ? (
            <Revelado
              adelanto={ADELANTOS.alto}
              como="h2"
              id="portada-usada-titulo"
              texto={textos.titulo}
              ritmo="titulo"
              disparo={0.95}
              className={`${estilos.titulo} texto-titulo-seccion`}
            />
          ) : null}
          {textos.marcasTitulo ? (
            <Revelado
              adelanto={ADELANTOS.alto}
              como="p"
              texto={textos.marcasTitulo}
              ritmo="titulo"
              disparo={0.95}
              className={`${estilos.subtitulo} texto-titulo-4`}
            />
          ) : null}
          {textos.marcasTexto ? (
            <Revelado
              adelanto={ADELANTOS.alto}
              como="p"
              texto={textos.marcasTexto}
              ritmo="pausado"
              className={`${estilos.frase} texto-destacado`}
            />
          ) : null}
          {textos.botonTexto ? (
            <div className={estilos.verTodo}>
              <Link href={hrefVerTodo} className={`${estilos.boton} texto-etiqueta`}>
                <IconSettings aria-hidden="true" focusable="false" stroke={1.75} />
                {textos.botonTexto}
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className={estilos.catalogo}>
        <PestanasUsada
          etiquetadoPor="portada-usada-titulo"
          pestanas={pestanas.map(({ clave, etiqueta }) => ({ clave, etiqueta }))}
          paneles={pestanas.map((p) =>
            p.equipos.map((e, i) => (
              <Tarjeta
                key={e.id}
                equipo={e}
                idNombre={`portada-usada-${p.clave}-${i + 1}`}
                verTexto={textos.verProductoTexto}
              />
            )),
          )}
        />
      </div>
    </section>
  );
}
