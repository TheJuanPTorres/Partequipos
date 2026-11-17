import { IconSettings } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import type { LogoConAlt } from "@/lib/marca/logoMarca";
import { colocarLogo, type Caja } from "@/lib/marca/tamanoOptico";
import { ZonaAnimada } from "@/components/repuestos/ZonaAnimada";
import { ANIMACIONES_NUEVA } from "@/lib/portada/animacionesNueva";
import type { TarjetaMarca } from "@/lib/portada/secciones";
import type { ImagenLista } from "@/lib/utils/relations";

import { CarruselNuevaKit } from "./diferidosKit";
import estilos from "./nuevaKit.module.css";

/**
 * «MAQUINARIA PESADA NUEVA», DISEÑO DEL CLIENTE V2 (2026-11-08; `partequipos-diseno\portada-nueva-v2`,
 * `MaquinariaNueva`), PORTADO a CSS modules sobre la sección del #389.
 *
 * - Rótulo y título con «nueva» en rojo; detrás, la foto de obra que se funde a blanco y la
 *   retroexcavadora grande arriba a la derecha. Por debajo de 1024 px la máquina va entre el texto
 *   y las tarjetas, sobre la misma foto.
 * - Una tarjeta por marca: panel del color de la marca con su logo (regla «una marca, un solo
 *   logo»), una franja de luz en diagonal y la máquina sobre el paisaje; abajo, en blanco, el botón.
 *   Al pasar el ratón la máquina avanza (N2) y el botón se rellena de rojo. LiuGong lleva
 *   «Distribuido por» con el logo de Maquitecno y su botón va a su web, en otra pestaña.
 * - Cinco en fila desde 1024 px; por debajo, tira deslizable (carrusel con pausa, D2).
 *
 * Todo del panel: textos, enlace de «Ver todo», máquina, foto de obra y paisaje (página «inicio»),
 * y por marca el color, el logo, la máquina y el distribuidor. Componente de SERVIDOR: el único
 * JavaScript es el del carrusel y el de las animaciones.
 *
 * Se aparta del prototipo: el título es `<h2>` (el `<h1>` de la portada es otro); el contenido no
 * pasa de 1680 px (a 1920 y 2560 las tarjetas se estirarían); el panel de Yanmar y el de LiuGong
 * llevan el color de su baldosa con el logo en blanco (regla de dirección) en vez del blanco del
 * diseño, y por eso el logo de Maquitecno va en blanco.
 */

/** Ancho pintado de la máquina de la tarjeta: 72 % / 40 % / 30 % del ancho en tira; ⅕ de ≤ 1680 px. */
const SIZES_TARJETA =
  "(max-width: 639px) 70vw, (max-width: 767px) 40vw, (max-width: 1023px) 30vw, (max-width: 1680px) 18vw, 320px";

export type TextosNueva = {
  antetitulo: string;
  titulo: string;
  botonTexto: string;
  botonEnlace: string;
};

/** El título con la palabra «nueva» (la última, sin mirar mayúsculas) en rojo, como el diseño. */
function tituloConNueva(titulo: string): ReactNode {
  const m = /^([\s\S]*)\b(nueva)\b([\s\S]*)$/i.exec(titulo);
  if (!m) return titulo;
  return (
    <>
      {m[1]}
      <span className={estilos.rojo}>{m[2]}</span>
      {m[3]}
    </>
  );
}

export function SeccionNuevaKit({
  tarjetas,
  textos,
  maquina,
  fondo,
  paisaje,
}: {
  tarjetas: TarjetaMarca[];
  textos: TextosNueva;
  maquina: ImagenLista | null;
  fondo: ImagenLista | null;
  paisaje: ImagenLista | null;
}) {
  if (tarjetas.length === 0) return null;
  const idTitulo = "portada-nueva-titulo";
  return (
    <section id="nueva" className={estilos.seccion} aria-labelledby={idTitulo}>
      {fondo ? (
        <div aria-hidden="true" className={estilos.fondo}>
          <div className={estilos.fondoFoto}>
            <Image src={fondo.url} alt="" fill sizes="100vw" className={estilos.cubrir} />
            <span className={estilos.fondoVelo} />
          </div>
        </div>
      ) : null}

      <ZonaAnimada
        interruptores={ANIMACIONES_NUEVA}
        permitirUrl={process.env.VERCEL_ENV !== "production"}
        entrada="N1"
      >
        <div className={estilos.marco}>
          {maquina ? (
            <div
              aria-hidden="true"
              className={estilos.maquinaGrande}
              style={{ aspectRatio: `${maquina.width} / ${maquina.height}` }}
            >
              <Image
                src={maquina.url}
                alt=""
                fill
                sizes="(max-width: 1023px) 1px, (max-width: 1680px) 44vw, 740px"
                quality={90}
                className={estilos.contener}
              />
            </div>
          ) : null}

          <div className={estilos.textos}>
            {textos.antetitulo ? <p className={estilos.antetitulo}>{textos.antetitulo}</p> : null}
            <h2 id={idTitulo} className={estilos.titulo}>
              {tituloConNueva(textos.titulo || "Maquinaria pesada nueva")}
            </h2>
          </div>

          {maquina ? <EscenaCompacta maquina={maquina} fondo={fondo} /> : null}

          <CarruselNuevaKit etiqueta="Marcas de maquinaria nueva" entrada>
            {tarjetas.map((t) => (
              <li key={t.id} className={estilos.item}>
                <Tarjeta marca={t} paisaje={paisaje} />
              </li>
            ))}
          </CarruselNuevaKit>

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

/** Por debajo de 1024 px la retroexcavadora va entre el texto y las tarjetas, sobre la foto. */
function EscenaCompacta({ maquina, fondo }: { maquina: ImagenLista; fondo: ImagenLista | null }) {
  return (
    <div aria-hidden="true" className={estilos.compacta}>
      {fondo ? (
        <div className={estilos.compactaFoto}>
          <Image
            src={fondo.url}
            alt=""
            fill
            sizes="(max-width: 1023px) 100vw, 1px"
            className={estilos.cubrir}
          />
        </div>
      ) : null}
      <div className={estilos.compactaMaquina}>
        <Image
          src={maquina.url}
          alt=""
          fill
          sizes="(max-width: 1023px) 90vw, 1px"
          quality={90}
          className={estilos.contener}
        />
      </div>
    </div>
  );
}

/**
 * LA CAJA DEL LOGO DE LA TARJETA (dirección, 2026-11-13; la regla del #439): todas iguales, con la
 * proporción de la zona del logo del diseño (80 % del ancho × 24 % del alto del panel, 3,55:1), y
 * cada logo con la MISMA ÁREA VISIBLE sin sus márgenes transparentes (`colocarLogo`, con la parte
 * visible que mide el servidor). El área es la de un logo 3:1 a ~70 % del alto de la caja. Va en
 * porcentajes de la caja: crece con la tarjeta.
 */
const CAJA_TARJETA: Caja = { ancho: 213, alto: 60, area: 126 * 42 };

/**
 * Con distribuidor (LiuGong; ronda 20, cierre del 1:1 con la referencia): la caja es más baja, para que
 * «Distribuido por» quede pegado al logo, y el logo algo mayor (~175 px a 1440, como la referencia).
 */
const CAJA_CON_DISTRIBUIDOR: Caja = { ancho: 213, alto: 40, area: 126 * 42 * 1.2 };

function LogoTarjeta({ logo, conDistribuidor }: { logo: LogoConAlt; conDistribuidor?: boolean }) {
  const caja = conDistribuidor ? CAJA_CON_DISTRIBUIDOR : CAJA_TARJETA;
  const { visible, imagen } = colocarLogo(logo, caja);
  const pct = (n: number, de: number) => `${(n / de) * 100}%`;
  return (
    <span
      className={estilos.logoFijo}
      style={conDistribuidor ? { aspectRatio: `${caja.ancho} / ${caja.alto}` } : undefined}
    >
      <span
        className={estilos.logoRecorte}
        style={{
          left: pct(visible.izquierda, caja.ancho),
          top: pct(visible.arriba, caja.alto),
          width: pct(visible.ancho, caja.ancho),
          height: pct(visible.alto, caja.alto),
        }}
      >
        <span
          className={estilos.logoImagen}
          style={{
            left: pct(imagen.izquierda, visible.ancho),
            top: pct(imagen.arriba, visible.alto),
            width: pct(imagen.ancho, visible.ancho),
            height: pct(imagen.alto, visible.alto),
          }}
        >
          <LogoMarca logo={logo} alt={logo.alt} fill sizes="300px" />
        </span>
      </span>
    </span>
  );
}

/**
 * La tarjeta de una marca. Toda la tarjeta es el enlace; su nombre accesible es el logo (`alt` =
 * nombre de la marca), el distribuidor y el texto del botón.
 */
function Tarjeta({ marca: m, paisaje }: { marca: TarjetaMarca; paisaje: ImagenLista | null }) {
  const estiloPanel = {
    "--panel-inicio": m.panel.inicio,
    "--panel-fin": m.panel.fin,
  } as CSSProperties;
  const abajo = m.maquina ? paisaje : m.foto;
  const contenido = (
    <>
      <span
        className={estilos.panel}
        style={estiloPanel}
        data-claro={m.panel.claro ? "" : undefined}
        data-distribuidor={m.distribuidor ? "" : undefined}
      >
        <span aria-hidden="true" className={estilos.luz} />
        {abajo ? (
          <span aria-hidden="true" className={m.maquina ? estilos.paisaje : estilos.fotoMarca}>
            <Image src={abajo.url} alt="" fill sizes={SIZES_TARJETA} className={estilos.cubrir} />
          </span>
        ) : null}
        <span className={m.distribuidor ? estilos.logoConDistribuidor : estilos.logoCaja}>
          {m.logo ? (
            <LogoTarjeta logo={m.logo} conDistribuidor={Boolean(m.distribuidor)} />
          ) : (
            <span className={estilos.nombre}>{m.nombre}</span>
          )}
          {m.distribuidor ? (
            <span className={estilos.distribuidor}>
              Distribuido por
              {m.distribuidor.logo ? (
                <LogoMarca
                  logo={m.distribuidor.logo}
                  alt={m.distribuidor.nombre}
                  sizes="120px"
                  className={estilos.logoDistribuidor}
                />
              ) : (
                <strong>{m.distribuidor.nombre}</strong>
              )}
            </span>
          ) : null}
        </span>
        {m.maquina ? (
          <span aria-hidden="true" className={estilos.maquina}>
            <Image
              src={m.maquina.url}
              alt=""
              fill
              sizes={SIZES_TARJETA}
              className={estilos.maquinaImagen}
            />
          </span>
        ) : null}
      </span>

      <span className={estilos.pieTarjeta}>
        <span className={estilos.boton} data-externo={m.externo ? "" : undefined}>
          {m.externo ? (
            <span>
              <span className={estilos.visitar}>Visitar </span>
              {mayuscula(m.externo.dominio)}
            </span>
          ) : (
            "Ver maquinaria"
          )}
          {m.externo ? <FlechaAfuera /> : <FlechaDerecha />}
        </span>
      </span>
    </>
  );

  return m.externo ? (
    <a href={m.href} target="_blank" rel="noopener noreferrer" className={estilos.tarjeta}>
      {contenido}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  ) : (
    <Link href={m.href} className={estilos.tarjeta}>
      {contenido}
    </Link>
  );
}

/** «maquitecno.co» sale en minúscula del enlace; el botón lo escribe con mayúscula inicial, como el diseño. */
function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Las flechas del botón, las del diseño: trazo de 2 px a 16 px (las de Tabler, a 24 px, quedaban en 1,3 px). */
const ATRIBUTOS_FLECHA = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

function FlechaDerecha() {
  return (
    <svg {...ATRIBUTOS_FLECHA} className={estilos.flechaBoton}>
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}

function FlechaAfuera() {
  return (
    <svg {...ATRIBUTOS_FLECHA} className={estilos.flechaBoton} data-afuera="">
      <path d="M6 3.5h6.5V10M12.5 3.5 4 12" />
    </svg>
  );
}
