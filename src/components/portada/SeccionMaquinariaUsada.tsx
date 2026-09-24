import { IconEngine, IconFileText, IconGauge, IconSettings, IconWeight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import type { DatoFicha, Pestana, TarjetaEquipo } from "@/lib/portada/secciones";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./maquinariaUsada.module.css";
import { PestanasUsada } from "./PestanasUsada";

/**
 * SECCIÓN 3 DE LA PORTADA — «Maquinaria pesada usada» (ux-9).
 *
 * Componente de SERVIDOR: las tarjetas se pintan aquí y llegan ya hechas a las
 * pestañas (cliente). Los textos de la sección son de interfaz; las tarjetas
 * salen de `equipos-usados` y la máquina decorativa, de la portada en Payload.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-home-ux9.md §11):
 * - D1: los dos títulos en `<h2>`, la frase en `<p>` y el nombre de cada
 *   tarjeta en `<h3>` (en ux-9: `<div>`, `<h2>` y `<h2>`).
 * - D5: en móvil la tarjeta se apila (ver el CSS).
 * - D6: iconos de Tabler en vez de los de Flaticon, pendientes de licencia (L2).
 * - D10: en móvil siguen siendo pestañas, no acordeón (ver el CSS).
 * - D11: sin pestaña «Aditamentos»: no tiene fuente en la línea usada.
 */

const ICONOS: Record<DatoFicha["clave"], typeof IconWeight> = {
  peso: IconWeight,
  potencia: IconGauge,
  motor: IconEngine,
};

/** Ancho pintado de la imagen de la tarjeta: 96 % de su columna. */
const SIZES_TARJETA = "(max-width: 767px) 90vw, (max-width: 1024px) 150px, 230px";

/** `idNombre` sale de la posición, no del id de la base: no se exponen ids (CLAUDE.md §8). */
function Tarjeta({ equipo, idNombre }: { equipo: TarjetaEquipo; idNombre: string }) {
  return (
    <article className={estilos.tarjeta} aria-labelledby={idNombre}>
      <div className={estilos.imgCol}>
        {equipo.imagen ? (
          <Image
            src={equipo.imagen.url}
            alt={equipo.imagen.alt}
            width={equipo.imagen.width}
            height={equipo.imagen.height}
            sizes={SIZES_TARJETA}
            className={estilos.img}
          />
        ) : null}
      </div>
      <div className={estilos.textoCol}>
        <h3 id={idNombre} className={estilos.nombre}>
          <span className={estilos.principal}>{equipo.principal}</span>
          {equipo.modelo ? (
            <span className={`${estilos.modelo} texto-etiqueta`}>{equipo.modelo}</span>
          ) : null}
        </h3>
        <div className={estilos.filete} aria-hidden="true" />
        {equipo.ficha.length > 0 ? (
          <ul className={estilos.ficha}>
            {equipo.ficha.map((d) => {
              const Icono = ICONOS[d.clave];
              return (
                <li key={d.clave} className={`${estilos.dato} texto-cuerpo`}>
                  <span className={estilos.icono} aria-hidden="true">
                    <Icono focusable="false" stroke={1.75} />
                  </span>
                  <span>
                    <span className={estilos.etiquetaDato}>{d.etiqueta}:</span> {d.valor}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
        <Link
          href={equipo.href}
          aria-describedby={idNombre}
          className={`${estilos.boton} ${estilos.botonTarjeta} texto-etiqueta`}
        >
          <IconFileText aria-hidden="true" focusable="false" stroke={1.75} />
          Ver producto
        </Link>
      </div>
    </article>
  );
}

type Props = {
  pestanas: Pestana[];
  maquina: ImagenLista | null;
  hrefExcavadoras: string | null;
};

export function SeccionMaquinariaUsada({ pestanas, maquina, hrefExcavadoras }: Props) {
  if (pestanas.length === 0) return null;
  return (
    <section className={estilos.seccion} aria-labelledby="portada-usada-titulo">
      <div className={estilos.izq}>
        {maquina ? (
          <Image
            src={maquina.url}
            alt=""
            width={maquina.width}
            height={maquina.height}
            sizes="(max-width: 767px) 72vw, (max-width: 1024px) 46vw, 45vw"
            className={estilos.maquina}
          />
        ) : null}
        <div className={estilos.espacioMaquina} />
        <Revelado
          como="h2"
          texto="Marcas que Respaldan Nuestro Trabajo"
          ritmo="titulo"
          disparo={0.95}
          className={`${estilos.tituloMarcas} texto-titulo-bloque`}
        />
        <Revelado
          como="p"
          texto="Trabajamos con fabricantes líderes a nivel internacional para ofrecerle calidad, rendimiento y respaldo"
          ritmo="pausado"
          className={`${estilos.frase} texto-destacado`}
        />
        {hrefExcavadoras ? (
          <div className={estilos.botonIzq}>
            <Link href={hrefExcavadoras} className={`${estilos.boton} texto-etiqueta`}>
              <IconSettings aria-hidden="true" focusable="false" stroke={1.75} />
              Ver todas las excavadoras
            </Link>
          </div>
        ) : null}
        <div className={estilos.espacioFinal} />
      </div>

      <div className={estilos.der}>
        <div className={estilos.espacioDer} />
        <p className={`${estilos.antetitulo} texto-etiqueta`}>Venta de maquinaria</p>
        <Revelado
          como="h2"
          id="portada-usada-titulo"
          texto="Maquinaria pesada usada"
          ritmo="titulo"
          disparo={0.95}
          className={`${estilos.tituloUsada} texto-titulo-seccion`}
        />
        <PestanasUsada
          etiquetadoPor="portada-usada-titulo"
          pestanas={pestanas.map(({ clave, etiqueta }) => ({ clave, etiqueta }))}
          paneles={pestanas.map((p) =>
            p.equipos.map((e, i) => (
              <Tarjeta key={e.id} equipo={e} idNombre={`portada-usada-${p.clave}-${i + 1}`} />
            )),
          )}
        />
      </div>
    </section>
  );
}
