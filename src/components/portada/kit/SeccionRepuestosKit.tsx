import Image from "next/image";
import Link from "next/link";

import type { CategoriaDePortada } from "@/lib/portada/kitCliente";
import type { ImagenLista } from "@/lib/utils/relations";

import { Flecha } from "./Flecha";
import estilos from "./repuestosKit.module.css";

/**
 * «VENTA DE REPUESTOS» CON EL DISEÑO DEL CLIENTE (2026-10-26; prototipo `CatalogoRepuestos` de
 * `partequipos-diseno\portada\repuestos`), PORTADO a CSS modules. Título y tarjetas de categoría a
 * la izquierda y la máquina sobre el piso, con su reflejo, a la derecha.
 *
 * Componente de SERVIDOR, sin JavaScript. Las categorías son las técnicas con posición en la
 * portada (orden, nombre o «Título en portada», y la «Foto en la portada» o la de la tarjeta), y
 * cada tarjeta lleva a SU PÁGINA («Ver todos»), no a WhatsApp como el prototipo. Máquina y reflejo,
 * del panel; sin ellos, la columna no se pinta.
 *
 * Distribución por tamaño (la del prototipo): en teléfono y tablet, título, máquina y tarjetas
 * apiladas; en portátil, título y máquina en una fila y las tarjetas debajo a todo el ancho; desde
 * 1536 px, tarjetas a la izquierda y la máquina a la derecha.
 */

const SIZES_MAQUINA = "(min-width: 1536px) 54vw, (min-width: 1025px) 50vw, 90vw";

export type TextosRepuestosKit = { antetitulo: string; titulo: string; verTodos: string };

export function SeccionRepuestosKit({
  categorias,
  maquina,
  reflejo,
  textos,
}: {
  categorias: CategoriaDePortada[];
  maquina: ImagenLista | null;
  reflejo: ImagenLista | null;
  textos: TextosRepuestosKit;
}) {
  if (categorias.length === 0) return null;
  const idTitulo = "repuestos-kit-titulo";
  return (
    <section id="repuestos" className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.panel}>
        <div className={estilos.rejilla}>
          <div className={estilos.cabecera}>
            {textos.antetitulo ? <p className={estilos.antetitulo}>{textos.antetitulo}</p> : null}
            <h2 id={idTitulo} className={estilos.titulo}>
              {textos.titulo || "Encuentra Maquinaria y Repuestos Rápido y Fácil"}
            </h2>
          </div>

          {maquina ? <Maquina maquina={maquina} reflejo={reflejo} /> : null}

          <ul className={estilos.tarjetas}>
            {categorias.map((c) => (
              <li key={c.id}>
                <Link href={c.href} className={estilos.tarjeta}>
                  <span className={estilos.foto}>
                    {c.imagen ? (
                      <Image
                        src={c.imagen.url}
                        alt=""
                        fill
                        sizes="(min-width: 1536px) 200px, (min-width: 1025px) 180px, 40vw"
                        className={estilos.fotoImg}
                      />
                    ) : null}
                  </span>
                  <span className={estilos.nombre}>{c.nombre}</span>
                  <span className={estilos.ver} aria-hidden="true">
                    {textos.verTodos || "Ver todos"}
                    <Flecha className={estilos.flecha} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Maquina({ maquina, reflejo }: { maquina: ImagenLista; reflejo: ImagenLista | null }) {
  const W = maquina.width;
  const H = maquina.height;
  return (
    <div className={estilos.maquinaCaja}>
      <div className={estilos.maquina} style={{ aspectRatio: `${W} / ${H}` }}>
        {/* La pared: losas grises y la franja roja, ancladas a la máquina, apagadas hacia el texto. */}
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 1920 1344"
          className={estilos.capa}
        >
          <defs>
            <linearGradient
              id="kit-repuestos-izq"
              gradientUnits="userSpaceOnUse"
              x1="-900"
              y1="0"
              x2="250"
              y2="0"
            >
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.6" stopColor="#fff" stopOpacity="0.6" />
              <stop offset="1" stopColor="#fff" />
            </linearGradient>
            <linearGradient
              id="kit-repuestos-roja"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="-420"
              x2="0"
              y2="560"
            >
              <stop offset="0" stopColor="var(--color-marca)" />
              <stop offset="0.5" stopColor="var(--color-marca)" stopOpacity="0.92" />
              <stop offset="0.78" stopColor="var(--color-marca)" stopOpacity="0.45" />
              <stop offset="1" stopColor="var(--color-marca)" stopOpacity="0" />
            </linearGradient>
            <mask
              id="kit-repuestos-mascara"
              maskUnits="userSpaceOnUse"
              x="-3000"
              y="-3000"
              width="7000"
              height="5000"
            >
              <rect x="-3000" y="-3000" width="7000" height="5000" fill="url(#kit-repuestos-izq)" />
            </mask>
          </defs>
          <g mask="url(#kit-repuestos-mascara)">
            <polygon points="887,-2400 1117,-2400 -655,640 -885,640" fill="#d3d1ce" opacity="0.45" />
            <polygon points="1117,-2400 1417,-2400 -355,640 -655,640" fill="#fbfbfa" opacity="0.8" />
            <polygon points="2207,-2400 2437,-2400 665,640 435,640" fill="#d3d1ce" opacity="0.45" />
            <polygon points="2437,-2400 2767,-2400 995,640 665,640" fill="#fbfbfa" opacity="0.85" />
            <polygon points="3407,-2400 3627,-2400 1855,640 1635,640" fill="#d3d1ce" opacity="0.45" />
            <polygon points="3627,-2400 3927,-2400 2155,640 1855,640" fill="#fbfbfa" opacity="0.8" />
          </g>
          <polygon
            points="2987,-2400 3177,-2400 1405,640 1215,640"
            fill="url(#kit-repuestos-roja)"
            opacity="0.78"
          />
        </svg>

        {/* El piso: un plano grande desde un horizonte alto (la cámara mira desde arriba). */}
        <div className={estilos.piso} aria-hidden="true" />

        {/* Sombras medidas por el cliente sobre el render de la Yanmar (1920 × 1344). */}
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 1920 1344"
          className={estilos.capa}
        >
          <defs>
            <filter id="kit-repuestos-oruga" x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <filter id="kit-repuestos-amplia" x="-30%" y="-100%" width="160%" height="300%">
              <feGaussianBlur stdDeviation="45" />
            </filter>
          </defs>
          <polygon
            points="700,900 1420,1180 1700,1000 1640,880 1000,720"
            fill="#14110f"
            opacity="0.14"
            filter="url(#kit-repuestos-amplia)"
          />
          <polygon
            points="760,905 1400,1255 1415,1225 790,880"
            fill="#14110f"
            opacity="0.32"
            filter="url(#kit-repuestos-oruga)"
          />
          <polygon
            points="1470,958 1660,962 1660,940 1480,936"
            fill="#14110f"
            opacity="0.28"
            filter="url(#kit-repuestos-oruga)"
          />
          <ellipse
            cx="690"
            cy="960"
            rx="40"
            ry="10"
            fill="#14110f"
            opacity="0.25"
            filter="url(#kit-repuestos-oruga)"
          />
        </svg>

        {/* El reflejo, del kit (más alto que el render): su caja empieza arriba, con su proporción. */}
        {reflejo ? (
          <div
            className={estilos.reflejo}
            style={{ aspectRatio: `${reflejo.width} / ${reflejo.height}` }}
          >
            <Image src={reflejo.url} alt="" fill sizes={SIZES_MAQUINA} className={estilos.contener} />
          </div>
        ) : null}
        <Image src={maquina.url} alt="" fill sizes={SIZES_MAQUINA} className={estilos.contener} />
      </div>
    </div>
  );
}
