import { IconSettings } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { ZonaAnimada } from "@/components/repuestos/ZonaAnimada";
import { ANIMACIONES_NUEVA } from "@/lib/portada/animacionesNueva";
import type { TarjetaMarca } from "@/lib/portada/secciones";
import type { ImagenLista } from "@/lib/utils/relations";

import { CarruselNuevaKit } from "./diferidosKit";
import estilos from "./nuevaKit.module.css";

/**
 * «MAQUINARIA PESADA NUEVA» CON EL DISEÑO DEL CLIENTE (2026-10-27; prototipo `MaquinariaNueva` de
 * `partequipos-diseno\portada-nueva`), PORTADO a CSS modules. Rótulo y título, una TARJETA por
 * marca de nueva (foto de la marca, su logo en una placa blanca y su presentación, enlace a su
 * página) y la retroexcavadora de perfil, todo sobre la foto de obra de fondo. Tarjetas en
 * carrusel en el teléfono y la tablet, y en rejilla de 2 × 2 desde 1024 px (fila de 4 desde
 * 1536 px); desde 1024 px la máquina va pegada a la última tarjeta, como si las empujara, y por
 * debajo va junto al título.
 *
 * Todo del panel: textos y botón de la sección (página «inicio»), la máquina y la foto de obra
 * (opcionales: sin ellas, la sección sale sin máquina o sobre blanco) y las marcas visibles de
 * nueva. Componente de SERVIDOR: el único JavaScript es el del carrusel y el de las animaciones.
 *
 * Se aparta del prototipo: el título en `<h2>` (el `<h1>` de la portada es otro), «Ver todo» con
 * el enlace del panel, el carrusel con el botón de pausa del sitio (D2) y las animaciones N1 y N2
 * con su interruptor (`ANIMACIONES_NUEVA`).
 */

/** Ancho pintado de la foto de la tarjeta: 78 % / ½ / ⅓ de la fila; ¼–½ de ~52 % en rejilla. */
const SIZES_TARJETA =
  "(max-width: 479px) 78vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1535px) 26vw, 17vw";

export type TextosNueva = {
  antetitulo: string;
  titulo: string;
  botonTexto: string;
  botonEnlace: string;
};

export function SeccionNuevaKit({
  tarjetas,
  textos,
  maquina,
  fondo,
}: {
  tarjetas: TarjetaMarca[];
  textos: TextosNueva;
  maquina: ImagenLista | null;
  fondo: ImagenLista | null;
}) {
  if (tarjetas.length === 0) return null;
  const idTitulo = "portada-nueva-titulo";
  return (
    <section id="nueva" className={estilos.seccion} aria-labelledby={idTitulo}>
      {fondo ? (
        <div aria-hidden="true" className={estilos.escena}>
          <div className={estilos.escenaFoto}>
            <Image
              src={fondo.url}
              alt=""
              fill
              sizes="100vw"
              className={estilos.foto}
              style={{ objectPosition: "100% 100%" }}
            />
          </div>
          <span className={estilos.escenaVelo} />
        </div>
      ) : null}

      <ZonaAnimada
        interruptores={ANIMACIONES_NUEVA}
        permitirUrl={process.env.VERCEL_ENV !== "production"}
        entrada="N1"
      >
        <div className={estilos.columna}>
          <div className={`${estilos.cabecera} ${maquina ? estilos.cabeceraConMaquina : ""}`}>
            <div className={estilos.textos}>
              {textos.antetitulo ? <p className={estilos.antetitulo}>{textos.antetitulo}</p> : null}
              <h2 id={idTitulo} className={estilos.titulo}>
                {textos.titulo || "Maquinaria pesada nueva"}
              </h2>
            </div>
            {maquina ? <EscenaCompacta maquina={maquina} fondo={fondo} /> : null}
          </div>

          <div className={estilos.zonaTarjetas}>
            <CarruselNuevaKit etiqueta="Marcas de maquinaria nueva" entrada>
              {tarjetas.map((t) => (
                <li key={t.id} className={estilos.item}>
                  <Tarjeta marca={t} />
                </li>
              ))}
            </CarruselNuevaKit>
            {maquina ? (
              // N1: la máquina entra con las tarjetas (`data-entrada` hace entrar a su hijo).
              <div className={estilos.empujaZona} data-entrada="">
                <div
                  aria-hidden="true"
                  className={estilos.empuja}
                  style={{ aspectRatio: `${maquina.width} / ${maquina.height}` }}
                >
                  <Image
                    src={maquina.url}
                    alt=""
                    fill
                    sizes="(max-width: 1280px) 50vw, 40vw"
                    className={estilos.contener}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {textos.botonTexto && textos.botonEnlace ? (
            <div className={estilos.pie}>
              <Link href={textos.botonEnlace} className={estilos.verTodo}>
                <IconSettings aria-hidden="true" focusable="false" stroke={1.8} />
                {textos.botonTexto}
              </Link>
            </div>
          ) : null}
        </div>
      </ZonaAnimada>
    </section>
  );
}

/**
 * Por debajo de 1024 px la máquina va en la cabecera: a la derecha del título desde 768 px y
 * debajo de él en el teléfono, con la foto de obra detrás, que sale hasta los bordes y se funde en
 * blanco arriba y abajo. La caja recorta el aire de arriba del render.
 */
function EscenaCompacta({ maquina, fondo }: { maquina: ImagenLista; fondo: ImagenLista | null }) {
  return (
    <div aria-hidden="true" className={estilos.compacta}>
      {fondo ? (
        <div className={estilos.compactaFoto}>
          <Image
            src={fondo.url}
            alt=""
            fill
            sizes="(max-width: 767px) 180vw, 90vw"
            className={estilos.foto}
            style={{ objectPosition: "100% 100%" }}
          />
        </div>
      ) : null}
      <div
        className={estilos.compactaMaquina}
        style={{ aspectRatio: `${maquina.width} / ${maquina.height}` }}
      >
        <Image
          src={maquina.url}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 48vw"
          className={estilos.contener}
        />
      </div>
    </div>
  );
}

/**
 * La tarjeta de una marca: la foto llena la tarjeta y se oscurece hacia abajo; el logo va en una
 * placa blanca (la regla común del logo, `LogoMarca`) y debajo la presentación. La placa arranca a
 * la misma altura en todas (relleno de arriba en % del ancho), así logos y textos quedan alineados.
 */
function Tarjeta({ marca }: { marca: TarjetaMarca }) {
  return (
    <Link href={marca.href} className={estilos.tarjeta}>
      {marca.fondo ? (
        <Image
          src={marca.fondo.url}
          alt=""
          fill
          sizes={SIZES_TARJETA}
          className={estilos.tarjetaFoto}
          style={{ objectPosition: marca.fondo.posicion }}
        />
      ) : null}
      <span aria-hidden="true" className={estilos.tarjetaVelo} />
      <span className={estilos.placa}>
        {marca.logo ? (
          <LogoMarca logo={marca.logo} alt={marca.nombre} sizes="110px" className={estilos.logo} />
        ) : (
          <span className={estilos.placaNombre}>{marca.nombre}</span>
        )}
      </span>
      {marca.texto ? <span className={estilos.presentacion}>{marca.texto}</span> : null}
      <span className="sr-only">: ver la marca</span>
    </Link>
  );
}
