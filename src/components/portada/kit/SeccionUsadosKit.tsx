import { IconCalendar, IconClock, IconWeight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { ANCLA_COTIZAR } from "@/components/ficha/FichaProducto";
import { BotonFormulario } from "@/components/forms/BotonFormulario";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { FiltroUsados } from "@/lib/portada/kitCliente";
import type { DatoFicha, TarjetaEquipo } from "@/lib/portada/secciones";
import type { ImagenLista } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

import { FiltroUsadosCliente, SliderUsados } from "./diferidosKit";
import { Flecha } from "./Flecha";
import estilos from "./usadosKit.module.css";

/**
 * «MAQUINARIA PESADA USADA» CON EL DISEÑO DEL CLIENTE (2026-10-26; prototipos `CatalogoUsados` y
 * `UsedHero` de `partequipos-diseno\portada\maquinaria-usada`), PORTADO a CSS modules y sin
 * `motion`. Un solo panel redondeado con la cabecera (la máquina sobre su piso, con reflejo y
 * sombras, y el texto), el FILTRO de tres categorías y el carrusel de la elegida.
 *
 * Componente de SERVIDOR: las tarjetas de las tres categorías se pintan aquí (están en el HTML,
 * para buscadores y sin JavaScript) y el cliente solo decide cuál se ve y mueve el carrusel.
 *
 * Se aparta del prototipo:
 * - Datos del panel: las unidades disponibles y visibles de cada categoría, sus textos e imágenes.
 * - «Cotizar ahora» abre NUESTRA ventana de cotización (no la ficha), y el aviso sin unidades,
 *   la misma ventana (no WhatsApp directo). «Ver todo» lleva al índice de usados.
 * - El título en `<h2>` (el `<h1>` de la portada es otro) y el carrusel con el botón de pausa del
 *   sitio (D2), parado con «reducir movimiento».
 */

const ICONOS: Record<DatoFicha["clave"], typeof IconWeight> = {
  peso: IconWeight,
  anio: IconCalendar,
  horometro: IconClock,
};

/** Ancho pintado de la foto: 1 por fila en el móvil, 2 en tablet y 3 en escritorio. */
const SIZES_TARJETA = "(max-width: 767px) 92vw, (max-width: 1279px) 46vw, 31vw";
/** La máquina de la cabecera: toda la fila en el móvil, ~60 % del panel en escritorio. */
const SIZES_MAQUINA = "(max-width: 1024px) 100vw, 60vw";

/** Lo que la ventana de «Cotizar» necesita del servidor. */
export type DatosCotizar = { siteKey: string | null; telefono: string };

/**
 * El formulario de la ventana: el MISMO que el de la página de la unidad, con la unidad como
 * referencia. La solicitud guarda de dónde viene: la portada.
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

/** Sin unidades en la categoría: el aviso del prototipo, con nuestra ventana («Avísame»). */
function formularioDeAviso(categoria: string, datos: DatosCotizar): ConfigFormulario {
  return {
    tipo: "contacto",
    origen: "/",
    siteKey: datos.siteKey,
    whatsapp: enlaceWhatsApp(datos.telefono, `Hola, busco ${categoria.toLowerCase()} usada.`),
    titulo: "Avísame cuando llegue",
    textoBoton: "Enviar",
    mensajeInicial: `Busco ${categoria.toLowerCase()} usada: `,
  };
}

function Tarjeta({
  equipo,
  idNombre,
  cotizar,
}: {
  equipo: TarjetaEquipo;
  idNombre: string;
  cotizar: DatosCotizar;
}) {
  const foto = equipo.imagen;
  return (
    <article className={estilos.tarjeta} aria-labelledby={idNombre}>
      {equipo.href ? (
        <Link href={equipo.href} tabIndex={-1} aria-hidden="true" className={estilos.foto}>
          {foto ? (
            <Image
              src={foto.url}
              alt=""
              fill
              sizes={SIZES_TARJETA}
              className={estilos.fotoImg}
              style={{ objectPosition: foto.posicion }}
            />
          ) : null}
        </Link>
      ) : (
        <div className={estilos.foto} aria-hidden="true">
          {foto ? (
            <Image src={foto.url} alt="" fill sizes={SIZES_TARJETA} className={estilos.fotoImg} />
          ) : null}
        </div>
      )}
      <h3 id={idNombre} className={estilos.nombre}>
        {equipo.href ? (
          <Link href={equipo.href} className={estilos.nombreEnlace}>
            {equipo.nombre}
          </Link>
        ) : (
          equipo.nombre
        )}
      </h3>
      <dl className={estilos.ficha}>
        {equipo.ficha.map((d) => {
          const Icono = ICONOS[d.clave];
          return (
            <div key={d.clave} className={estilos.dato}>
              <Icono aria-hidden="true" focusable="false" stroke={1.6} className={estilos.icono} />
              <dt>{d.etiqueta}:</dt>
              <dd>{d.valor}</dd>
            </div>
          );
        })}
      </dl>
      <div className={estilos.botones}>
        {equipo.href ? (
          <Link href={equipo.href} className={estilos.boton}>
            Ver más<span className="sr-only">: {equipo.nombre}</span>
          </Link>
        ) : null}
        {/* Sin JavaScript, baja al formulario de la página de la unidad. */}
        <BotonFormulario
          href={equipo.href ? `${equipo.href}#${ANCLA_COTIZAR}` : "/contactanos/"}
          className={`${estilos.boton} ${estilos.botonOscuro}`}
          formulario={formularioDeCotizar(equipo.nombre, cotizar)}
        >
          Cotizar ahora<span className="sr-only">: {equipo.nombre}</span>
        </BotonFormulario>
      </div>
    </article>
  );
}

export type TextosUsadosKit = {
  antetitulo: string;
  titulo: string;
  descripcion: string;
  botonTexto: string;
};

export function SeccionUsadosKit({
  filtros,
  maquina,
  textos,
  hrefVerTodo,
  cotizar,
}: {
  filtros: FiltroUsados[];
  maquina: ImagenLista | null;
  textos: TextosUsadosKit;
  hrefVerTodo: string;
  cotizar: DatosCotizar;
}) {
  const idTitulo = "usados-kit-titulo";
  return (
    <section id="maquinaria-usada" className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.panel}>
        <div className={estilos.cabecera}>
          <Fondo />
          <div className={estilos.cabeceraRejilla}>
            {maquina ? (
              <div className={estilos.maquinaCaja}>
                <div
                  className={estilos.maquina}
                  style={{ aspectRatio: `${maquina.width} / ${maquina.height}` }}
                >
                  <div className={estilos.piso} aria-hidden="true" />
                  {/* Reflejo: la misma imagen volteada sobre la línea de las orugas (el 92 %). */}
                  <Image
                    src={maquina.url}
                    alt=""
                    fill
                    sizes={SIZES_MAQUINA}
                    className={estilos.reflejo}
                    aria-hidden="true"
                  />
                  <SombraMaquina />
                  <Image
                    src={maquina.url}
                    alt=""
                    fill
                    sizes={SIZES_MAQUINA}
                    className={estilos.maquinaImg}
                  />
                </div>
              </div>
            ) : null}
            <div className={estilos.texto}>
              {textos.antetitulo ? <p className={estilos.antetitulo}>{textos.antetitulo}</p> : null}
              <h2 id={idTitulo} className={estilos.titulo}>
                {textos.titulo || "Maquinaria pesada usada"}
              </h2>
              {textos.descripcion ? (
                <p className={estilos.descripcion}>{textos.descripcion}</p>
              ) : null}
              {textos.botonTexto ? (
                <Link href={hrefVerTodo} className={estilos.verTodo}>
                  {textos.botonTexto}
                  <Flecha className={estilos.flecha} />
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className={estilos.cuerpo}>
          <FiltroUsadosCliente
            filtros={filtros.map((f) => ({ clave: f.clave, nombre: f.nombre, imagen: f.imagen }))}
            paneles={filtros.map((f) =>
              f.tarjetas.length > 0 ? (
                <SliderUsados key={f.clave} etiqueta={f.nombre}>
                  {f.tarjetas.map((t, i) => (
                    <li key={t.id} className={estilos.item}>
                      <Tarjeta
                        equipo={t}
                        idNombre={`usados-kit-${f.clave}-${i}`}
                        cotizar={cotizar}
                      />
                    </li>
                  ))}
                </SliderUsados>
              ) : (
                <div key={f.clave} className={estilos.vacio}>
                  <p className={estilos.vacioTitulo}>
                    Por ahora no hay {f.nombre.toLowerCase()} usada en el inventario.
                  </p>
                  <p className={estilos.vacioTexto}>
                    Cuéntanos qué buscas y te avisamos cuando llegue.
                  </p>
                  <BotonFormulario
                    href={f.href}
                    className={estilos.verTodo}
                    formulario={formularioDeAviso(f.nombre, cotizar)}
                  >
                    Avísame cuando llegue
                    <Flecha className={estilos.flecha} />
                  </BotonFormulario>
                </div>
              ),
            )}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * La pared del fondo: losas diagonales del gris del panel y la franja roja que entra por detrás
 * del cucharón. `slice`: el ángulo no se deforma al cambiar la proporción de la pantalla.
 */
function Fondo() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={estilos.fondo}
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMinYMid slice"
    >
      <defs>
        <linearGradient id="kit-usados-roja" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="var(--color-marca)" />
          <stop offset="0.5" stopColor="var(--color-marca)" stopOpacity="0.92" />
          <stop offset="0.78" stopColor="var(--color-marca)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--color-marca)" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="kit-usados-pared"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="1060"
          y2="0"
        >
          <stop offset="0.58" stopColor="#fff" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask
          id="kit-usados-mascara"
          maskUnits="userSpaceOnUse"
          x="-200"
          y="0"
          width="1840"
          height="640"
        >
          <rect x="-200" y="0" width="1840" height="640" fill="url(#kit-usados-pared)" />
        </mask>
      </defs>
      <g mask="url(#kit-usados-mascara)">
        <polygon points="250,0 560,0 1060,640 750,640" fill="#fafaf9" opacity="0.5" />
        <polygon points="0,22 215,22 699,640 484,640" fill="#d3d1ce" opacity="0.35" />
        <polygon points="-70,150 45,150 437,640 322,640" fill="#fafaf9" opacity="0.6" />
        <polygon points="760,100 905,100 1326,640 1181,640" fill="#dedcd9" opacity="0.28" />
        <polygon points="600,250 835,250 1139,640 904,640" fill="#d3d1ce" opacity="0.35" />
      </g>
      <polygon
        points="45,215 200,215 470,560 315,560"
        fill="url(#kit-usados-roja)"
        opacity="0.78"
      />
    </svg>
  );
}

/**
 * Sombras medidas por el cliente sobre el recorte de la ZX210 (1920 × 1344): el SVG comparte la
 * caja de la imagen y cada sombra cae bajo su pieza a cualquier tamaño. Con otra máquina en el
 * panel caerían algo desplazadas: son un adorno, sin texto encima.
 */
function SombraMaquina() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 1920 1344" className={estilos.sombras}>
      <defs>
        <filter id="kit-usados-amplia" x="-50%" y="-300%" width="200%" height="700%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id="kit-usados-media" x="-50%" y="-300%" width="200%" height="700%">
          <feGaussianBlur stdDeviation="13" />
        </filter>
        <filter id="kit-usados-contacto" x="-50%" y="-300%" width="200%" height="700%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <ellipse
        cx="1250"
        cy="1252"
        rx="600"
        ry="52"
        fill="#14110f"
        opacity="0.34"
        filter="url(#kit-usados-amplia)"
      />
      <ellipse
        cx="470"
        cy="1286"
        rx="200"
        ry="28"
        fill="#14110f"
        opacity="0.26"
        filter="url(#kit-usados-amplia)"
      />
      <ellipse
        cx="1210"
        cy="1240"
        rx="455"
        ry="24"
        fill="#14110f"
        opacity="0.42"
        filter="url(#kit-usados-media)"
      />
      <ellipse
        cx="450"
        cy="1281"
        rx="130"
        ry="14"
        fill="#14110f"
        opacity="0.38"
        filter="url(#kit-usados-media)"
      />
      <ellipse
        cx="935"
        cy="1231"
        rx="178"
        ry="11"
        fill="#14110f"
        opacity="0.78"
        filter="url(#kit-usados-contacto)"
      />
      <ellipse
        cx="1380"
        cy="1244"
        rx="290"
        ry="12"
        transform="rotate(-2.4 1380 1244)"
        fill="#14110f"
        opacity="0.8"
        filter="url(#kit-usados-contacto)"
      />
      <ellipse
        cx="500"
        cy="1279"
        rx="72"
        ry="8"
        fill="#14110f"
        opacity="0.62"
        filter="url(#kit-usados-contacto)"
      />
    </svg>
  );
}
