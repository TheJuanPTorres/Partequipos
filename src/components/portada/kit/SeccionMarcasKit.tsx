import Image from "next/image";

import type { LogoDePortada } from "@/lib/portada/kitCliente";
import type { ImagenLista } from "@/lib/utils/relations";

import { BandaLogos } from "./diferidosKit";
import estilos from "./marcasKit.module.css";

/**
 * LA SECCIÓN DE MARCAS CON EL DISEÑO DEL CLIENTE (2026-10-26; prototipo `MarcasSlider` de
 * `partequipos-diseno\portada\marcas`), PORTADA a CSS modules. Título arriba a la izquierda, una
 * banda blanca con los logos corriendo en bucle y la máquina a la derecha, por delante de la banda.
 * Sustituye al carrusel de logos de ux-9.
 *
 * Desde 1025 px el panel mantiene su proporción 3:1 (alto = 33 % del ancho, con un mínimo) y todo
 * se mide en % del panel o en `cqw`: máquina, banda y franjas caen siempre en el mismo sitio. En el
 * teléfono se apila: título, máquina y banda.
 *
 * Datos del panel: los logos de la lista de la sección (manda el elegido ahí, los del kit), el
 * título y la máquina con su reflejo. Sin logos, la sección no se pinta.
 */

const SIZES_MAQUINA = "(min-width: 1025px) 55vw, 90vw";

export function SeccionMarcasKit({
  logos,
  titulo,
  resaltado,
  maquina,
  reflejo,
}: {
  logos: LogoDePortada[];
  titulo: string;
  resaltado: string;
  maquina: ImagenLista | null;
  reflejo: ImagenLista | null;
}) {
  if (logos.length === 0) return null;
  const idTitulo = "marcas-kit-titulo";
  return (
    <section id="marcas" className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.panel}>
        <Fondo />

        <div className={estilos.cabecera}>
          <h2 id={idTitulo} className={estilos.titulo}>
            {titulo || "Marcas que mueven"}
            {resaltado ? (
              <>
                <br />
                <span className={estilos.resaltado}>{resaltado}</span>
              </>
            ) : null}
          </h2>
        </div>

        {maquina ? (
          <div
            className={estilos.maquina}
            style={{ aspectRatio: `${maquina.width} / ${maquina.height}` }}
          >
            {reflejo ? (
              <div
                className={estilos.reflejo}
                style={{ aspectRatio: `${reflejo.width} / ${reflejo.height}` }}
              >
                <Image
                  src={reflejo.url}
                  alt=""
                  fill
                  sizes={SIZES_MAQUINA}
                  className={estilos.contener}
                />
              </div>
            ) : null}
            <Sombras />
            <Image
              src={maquina.url}
              alt=""
              fill
              sizes={SIZES_MAQUINA}
              className={estilos.contener}
            />
          </div>
        ) : null}

        <BandaLogos logos={logos} />
      </div>
    </section>
  );
}

/**
 * El fondo del panel: losas diagonales claras y la franja roja entrando por arriba a la derecha,
 * más un piso claro bajo la máquina. Solo desde 1025 px: en el teléfono el panel es alto y el
 * `slice` agrandaría la franja hasta taparlo todo.
 */
function Fondo() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1000 333"
      preserveAspectRatio="xMaxYMid slice"
      className={estilos.fondo}
    >
      <defs>
        <linearGradient
          id="kit-marcas-izq"
          gradientUnits="userSpaceOnUse"
          x1="380"
          y1="0"
          x2="640"
          y2="0"
        >
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask
          id="kit-marcas-mascara"
          maskUnits="userSpaceOnUse"
          x="0"
          y="-100"
          width="1000"
          height="500"
        >
          <rect x="0" y="-100" width="1000" height="500" fill="url(#kit-marcas-izq)" />
        </mask>
        <linearGradient
          id="kit-marcas-roja"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="-20"
          x2="0"
          y2="250"
        >
          <stop offset="0" stopColor="var(--color-marca)" />
          <stop offset="0.45" stopColor="var(--color-marca)" stopOpacity="0.92" />
          <stop offset="0.75" stopColor="var(--color-marca)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--color-marca)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="kit-marcas-piso" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <g mask="url(#kit-marcas-mascara)">
        <polygon points="642,-20 772,-20 549,340 419,340" fill="#d8d6d3" opacity="0.45" />
        <polygon points="772,-20 862,-20 639,340 549,340" fill="#ebe9e6" opacity="0.5" />
        <polygon points="1020,-20 1120,-20 897,340 797,340" fill="#d8d6d3" opacity="0.4" />
        <polygon
          points="862,-20 920,-20 763,233 705,233"
          fill="url(#kit-marcas-roja)"
          opacity="0.85"
        />
      </g>
      <rect x="-1000" y="225" width="3000" height="120" fill="url(#kit-marcas-piso)" />
    </svg>
  );
}

/** Sombras de contacto medidas por el cliente sobre el render de la Case 580N (1920 × 1344). */
function Sombras() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 1920 1344" className={estilos.sombras}>
      <defs>
        <filter id="kit-marcas-amplia" x="-30%" y="-200%" width="160%" height="500%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
        <filter id="kit-marcas-sombra" x="-30%" y="-200%" width="160%" height="500%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <ellipse
        cx="1050"
        cy="1110"
        rx="820"
        ry="55"
        fill="#14110f"
        opacity="0.14"
        filter="url(#kit-marcas-amplia)"
      />
      <ellipse
        cx="345"
        cy="1032"
        rx="90"
        ry="12"
        fill="#14110f"
        opacity="0.4"
        filter="url(#kit-marcas-sombra)"
      />
      <ellipse
        cx="650"
        cy="1044"
        rx="115"
        ry="14"
        fill="#14110f"
        opacity="0.45"
        filter="url(#kit-marcas-sombra)"
      />
      <ellipse
        cx="955"
        cy="1095"
        rx="85"
        ry="13"
        fill="#14110f"
        opacity="0.45"
        filter="url(#kit-marcas-sombra)"
      />
      <polygon
        points="1170,1112 1800,1100 1800,1116 1170,1134"
        fill="#14110f"
        opacity="0.32"
        filter="url(#kit-marcas-sombra)"
      />
    </svg>
  );
}
