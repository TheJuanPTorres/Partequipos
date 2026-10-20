import { IconCalendar, IconClock, IconSettings, IconWeight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { ANCLA_COTIZAR } from "@/components/ficha/FichaProducto";
import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { DatoFicha, EnlaceUsada, TarjetaEquipo } from "@/lib/portada/secciones";
import type { ImagenLista } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

import estilos from "./maquinariaUsada.module.css";
import { CarruselUsada } from "./diferidos";

/**
 * «MAQUINARIA PESADA USADA» DE LA PORTADA — Home V2 de Andrés (2026-10-15),
 * secciones 3 (cabecera) y 4 (pestañas) de `elementor-3519`.
 *
 * Componente de SERVIDOR: las tarjetas se pintan aquí y llegan ya hechas al
 * carrusel (cliente). Los textos son del panel (página «inicio»); las
 * tarjetas, de `equipos-usados`; la máquina decorativa, de la portada.
 *
 * Lo que se aparta del diseño (docs/diseno/decisiones-home-ux9.md §33):
 * - El título en `<h2>` y el subtítulo y la frase en `<p>` (en el diseño,
 *   `<div>` y `<h3>`); el nombre de cada tarjeta en `<h3>`.
 * - DIRECCIÓN (2026-10-20): las tres «pestañas» son ENLACES a su categoría de
 *   usados, en el rojo de marca, y solo hay un carrusel, el de excavadoras.
 * - DIRECCIÓN (2026-10-20): en cada tarjeta, «Ver producto» (la página de la
 *   unidad) y «Cotizar» (la ventana emergente del formulario, con la unidad
 *   como referencia); «Ver todo», más grande.
 * - Iconos de Tabler en vez de los de Flaticon (L2).
 * - La ficha lleva peso operativo, año y horómetro (cliente, 2026-10-16), no
 *   el peso, la potencia y el motor de la Home V2.
 */

const ICONOS: Record<DatoFicha["clave"], typeof IconWeight> = {
  peso: IconWeight,
  anio: IconCalendar,
  horometro: IconClock,
};

/** Ancho pintado de la foto: la tarjeta menos su relleno (1 columna en móvil, 3 en escritorio y 2 en tablet). */
const SIZES_TARJETA =
  "(max-width: 767px) calc(100vw - 93px), (max-width: 1024px) calc(47vw - 76px), calc(32vw - 76px)";

/** Lo que la ventana de «Cotizar» necesita del servidor. */
export type DatosCotizar = { siteKey: string | null; telefono: string };

/**
 * El formulario de la ventana: el MISMO que el de la página de la unidad
 * (`[categoria]/[unidad]/page.tsx`), con la unidad como referencia. La
 * solicitud guarda de dónde viene: la portada.
 */
function formularioDeCotizar(nombre: string, datos: DatosCotizar): ConfigFormulario {
  return {
    tipo: "cotizacion",
    origen: "/",
    siteKey: datos.siteKey,
    whatsapp: enlaceWhatsApp(datos.telefono, `Hola, quiero cotizar la ${nombre}.`),
    referencia: { texto: nombre },
    titulo: "Solicitar cotización",
    descripcion: "Te enviamos precio, disponibilidad y condiciones de entrega.",
    textoBoton: "Pedir cotización",
  };
}

/** `idNombre` sale de la posición, no del id de la base: no se exponen ids (CLAUDE.md §8). */
function Tarjeta({
  equipo,
  idNombre,
  cotizar,
}: {
  equipo: TarjetaEquipo;
  idNombre: string;
  cotizar: DatosCotizar;
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
        {equipo.href ? (
          <Link href={equipo.href} className={`${estilos.boton} texto-etiqueta`}>
            Ver producto<span className="sr-only">: {equipo.nombre}</span>
          </Link>
        ) : null}
        {/* Sin JavaScript, baja al formulario de la página de la unidad. */}
        <BotonFormulario
          href={equipo.href ? `${equipo.href}#${ANCLA_COTIZAR}` : "/contactanos/"}
          className={`${estilos.boton} ${estilos.botonOscuro} texto-etiqueta`}
          formulario={formularioDeCotizar(equipo.nombre, cotizar)}
        >
          Cotizar<span className="sr-only">: {equipo.nombre}</span>
        </BotonFormulario>
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
};

type Props = {
  enlaces: EnlaceUsada[];
  excavadoras: TarjetaEquipo[];
  maquina: ImagenLista | null;
  hrefVerTodo: string;
  textos: TextosUsada;
  cotizar: DatosCotizar;
};

export function SeccionMaquinariaUsada({
  enlaces,
  excavadoras,
  maquina,
  hrefVerTodo,
  textos,
  cotizar,
}: Props) {
  if (excavadoras.length === 0) return null;
  const hechas = (sufijo: string) =>
    excavadoras.map((e, i) => (
      <Tarjeta
        key={e.id}
        equipo={e}
        idNombre={`portada-usada${sufijo}-${i + 1}`}
        cotizar={cotizar}
      />
    ));
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
              <Link href={hrefVerTodo} className={`${estilos.boton} ${estilos.botonGrande}`}>
                <IconSettings aria-hidden="true" focusable="false" stroke={1.75} />
                {textos.botonTexto}
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className={estilos.catalogo}>
        {/* Enlaces a las categorías de usados (antes, pestañas). */}
        <nav aria-label="Categorías de maquinaria usada" className={estilos.enlaces}>
          <ul className={estilos.lista}>
            {enlaces.map((e) => (
              <li key={e.clave}>
                <Link href={e.href} className={estilos.enlace}>
                  {e.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={estilos.panel}>
          <CarruselUsada
            id="portada-usada-excavadoras"
            etiqueta={`Unidades usadas: ${enlaces[0]?.etiqueta ?? "Excavadoras"}`}
            nombres={excavadoras.map((e) => e.nombre)}
            tarjetas={hechas("")}
            copias={hechas("-copia")}
          />
        </div>
      </div>
    </section>
  );
}
