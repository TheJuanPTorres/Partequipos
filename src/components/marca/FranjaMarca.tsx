import Image from "next/image";
import Link from "next/link";

import { ZonaAnimada } from "@/components/repuestos/ZonaAnimada";
import { coloresFranja, estiloFranja, MEJORAS_FRANJA, textoModelos } from "@/lib/marca/franjaMarca";
import type { LogoConAlt } from "@/lib/marca/logoMarca";
import type { ImagenLista } from "@/lib/utils/relations";

import { EntradaFranja } from "./EntradaFranja";
import { LogoMarca } from "./LogoMarca";
import estilos from "./franjaMarca.module.css";

/**
 * LA FRANJA DE MARCA (plantilla 4036 de Andrés, «Otros {tipo}» de la ficha nueva, #309): barra
 * de radio 30 con el logo de la marca a la izquierda (`LogoMarca`, el único del sitio) y el
 * título a la derecha, como `<h2>`. Sin logo, solo el título. La usan la ficha nueva y, desde
 * el 2026-10-23, las páginas generales de tipo de nueva para separar las marcas. Va sobre el gris
 * de la página.
 *
 * MÁS FUERZA VISUAL (dirección, 2026-10-23): las mejoras D1–D5 de `MEJORAS_FRANJA`, cada una con
 * su interruptor y probables en un preview con `?anim=` (`ZonaAnimada`): el color de la marca en
 * degradado con la tinta por contraste (D1), las diagonales (D2), la máquina asomando (D3),
 * «N modelos · Ver la marca →» (D4) y la entrada con barrido (D5). Apagadas todas, la franja
 * blanca de siempre. No cambia títulos ni nombres.
 */
export function FranjaMarca({
  id,
  titulo,
  logo,
  color,
  foto,
  modelos,
  marca,
}: {
  id: string;
  titulo: string;
  logo: LogoConAlt | null;
  /** El «Color de la marca» del panel (D1–D3); sin color, el naranja de la barra de series. */
  color?: string | null;
  /** La máquina que asoma por la derecha (D3). */
  foto?: ImagenLista | null;
  /** Cuántos modelos tiene el grupo (D4). */
  modelos?: number;
  /** Nombre y página de la marca, para «Ver la marca →» (D4). */
  marca?: { nombre: string; href: string };
}) {
  const conMeta = modelos !== undefined || marca !== undefined;
  return (
    <ZonaAnimada
      interruptores={MEJORAS_FRANJA}
      permitirUrl={process.env.VERCEL_ENV !== "production"}
    >
      <EntradaFranja>
        <div
          className={estilos.franja}
          style={estiloFranja(color)}
          data-tinta={coloresFranja(color).tinta === "#ffffff" ? "clara" : "oscura"}
        >
          <span className={estilos.fondo} aria-hidden="true" />
          <span className={estilos.trama} aria-hidden="true" />
          {foto ? (
            <span className={estilos.foto} aria-hidden="true">
              <Image
                src={foto.url}
                alt=""
                fill
                sizes="(min-width: 768px) 320px, 180px"
                className={estilos.fotoImagen}
                style={{ objectPosition: foto.posicion }}
              />
            </span>
          ) : null}
          {logo ? (
            <span className={estilos.cajaLogo}>
              <LogoMarca logo={logo} alt={logo.alt} sizes="140px" className={estilos.logo} />
            </span>
          ) : null}
          <div className={`${estilos.texto} ${foto ? estilos.textoConFoto : ""}`}>
            <h2 id={id} className={`${estilos.titulo} texto-titulo-bloque`}>
              {titulo}
            </h2>
            {conMeta ? (
              <p className={`${estilos.meta} texto-etiqueta`}>
                {modelos !== undefined ? <span>{textoModelos(modelos)}</span> : null}
                {marca ? (
                  <Link href={marca.href} className={estilos.verMarca}>
                    Ver la marca<span className="sr-only"> {marca.nombre}</span>{" "}
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
      </EntradaFranja>
    </ZonaAnimada>
  );
}
