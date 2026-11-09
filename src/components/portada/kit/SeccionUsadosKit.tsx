import Image from "next/image";
import Link from "next/link";

import type { AlineacionTexto, AnchoTexto } from "@/lib/fields/alineacionTexto";
import type { FiltroUsados } from "@/lib/portada/kitCliente";
import type { ImagenLista } from "@/lib/utils/relations";

import { Flecha } from "./Flecha";
import { TextoEditable } from "./TextoEditable";
import estilos from "./usadosKit.module.css";

/**
 * «MAQUINARIA PESADA USADA» CON EL DISEÑO DEL CLIENTE (2026-10-26; prototipos `CatalogoUsados` y
 * `UsedHero` de `partequipos-diseno\portada\maquinaria-usada`), PORTADO a CSS modules y sin
 * `motion`. Un solo panel redondeado con la cabecera (la máquina sobre su piso, con reflejo y
 * sombras, y el texto) y tres ENLACES a las categorías de usados. El carrusel de las excavadoras
 * (con «Cotizar ahora» y el aviso sin unidades) se QUITÓ el 2026-11-09 (dirección): la sección
 * acaba en las tarjetas de tipo.
 *
 * Los tres botones (Excavadora, «Otros», Aditamentos) eran un filtro del carrusel; desde el
 * 2026-10-26 (dirección) son enlaces a la página de su categoría, sin estado «seleccionado».
 * Componente de SERVIDOR, sin JavaScript.
 *
 * Se aparta del prototipo:
 * - Datos del panel: sus textos e imágenes. «Ver todo» lleva al índice de usados.
 * - El título en `<h2>` (el `<h1>` de la portada es otro).
 */

/** La máquina de la cabecera: toda la fila en el móvil, ~60 % del panel en escritorio. */
const SIZES_MAQUINA = "(max-width: 1024px) 100vw, 60vw";

export type TextosUsadosKit = {
  antetitulo: string;
  titulo: string;
  /** «Frase de la cabecera»: bajo el título, con sus saltos de línea. */
  frase: string;
  fraseAlineacion: AlineacionTexto;
  fraseAncho: AnchoTexto;
  descripcion: string;
  descripcionAlineacion: AlineacionTexto;
  descripcionAncho: AnchoTexto;
  botonTexto: string;
};

export function SeccionUsadosKit({
  filtros,
  maquina,
  textos,
  hrefVerTodo,
}: {
  filtros: FiltroUsados[];
  maquina: ImagenLista | null;
  textos: TextosUsadosKit;
  hrefVerTodo: string;
}) {
  const idTitulo = "usados-kit-titulo";
  return (
    <section className={estilos.seccion} aria-labelledby={idTitulo}>
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
            {/* El ancla va en el bloque del título y no en la sección: por debajo de 1025 px la máquina
                va encima y, llegando a la sección, el título quedaba fuera de la ventana (#417). */}
            <div id="maquinaria-usada" className={estilos.texto}>
              {textos.antetitulo ? <p className={estilos.antetitulo}>{textos.antetitulo}</p> : null}
              <h2 id={idTitulo} className={estilos.titulo}>
                {textos.titulo || "Maquinaria pesada usada"}
              </h2>
              <TextoEditable
                texto={textos.frase}
                alineacion={textos.fraseAlineacion}
                ancho={textos.fraseAncho}
                className={estilos.frase}
              />
              <TextoEditable
                texto={textos.descripcion}
                alineacion={textos.descripcionAlineacion}
                ancho={textos.descripcionAncho}
                className={estilos.descripcion}
              />
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
          <EnlacesCategorias filtros={filtros} />
        </div>
      </div>
    </section>
  );
}

/**
 * Los tres botones de categoría: ENLACES a su página de usados. Al pasar el ratón o enfocar, la
 * flecha pasa a rojo y el lado izquierdo se tiñe de un rojo suave (solo color y opacidad: nada se
 * mueve ni cambia de medida).
 */
function EnlacesCategorias({ filtros }: { filtros: FiltroUsados[] }) {
  return (
    <ul className={estilos.filtros} aria-label="Maquinaria usada por categoría">
      {filtros.map((f) => (
        <li key={f.clave}>
          <Link href={f.href} className={estilos.filtro}>
            <span className={estilos.filtroImagen}>
              {f.imagen ? (
                <Image src={f.imagen.url} alt="" fill sizes="120px" className={estilos.filtroImg} />
              ) : null}
            </span>
            <span className={estilos.filtroNombre}>{f.nombre}</span>
            <span className={estilos.filtroFlecha} aria-hidden="true">
              <Flecha />
            </span>
          </Link>
        </li>
      ))}
    </ul>
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
