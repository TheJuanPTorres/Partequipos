import Image from "next/image";
import type { CSSProperties } from "react";

import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./kit.module.css";

/** Lo que se necesita de una imagen para pintarla (el logo no lleva punto focal). */
type Imagen = Pick<ImagenLista, "url" | "alt" | "width" | "height">;

/**
 * CABECERA del «Kit de marca» (2026-10-25): banda partida (gris arriba, el color de la marca
 * abajo) con el panel de foto encima, la placa blanca con el logo, el `<h1>`, el texto y el
 * indicador de scroll. La foto es la propia de cada marca (panel); sin ella, el panel queda
 * oscuro liso. Alto mínimo de 70vh: el texto no mueve nada al llegar la fuente.
 */
export function CabeceraKit({
  id,
  titulo,
  texto,
  fondo,
  logo,
  destino,
}: {
  /** `id` del `<h1>`: la píldora lo usa para saber cuándo sale la cabecera de la pantalla. */
  id: string;
  titulo: string;
  texto: string;
  fondo: ImagenLista | null;
  logo: Imagen | null;
  destino: string;
}) {
  return (
    <section aria-labelledby={id} className={estilos.hero} data-cabecera-kit="">
      <div className={estilos.heroPanel}>
        {fondo ? (
          <Image
            src={fondo.url}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: fondo.posicion } as CSSProperties}
          />
        ) : null}
        <div aria-hidden="true" className={estilos.heroVelo} />

        <div className={estilos.heroContenido}>
          {logo ? (
            <div className={estilos.placa}>
              <Image
                src={logo.url}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                sizes="120px"
                priority
              />
            </div>
          ) : null}
          <h1 id={id} className={estilos.heroTitulo}>
            {titulo}
          </h1>
          {texto ? <p className={estilos.heroTexto}>{texto}</p> : null}
          <a href={destino} aria-label="Ir a la línea de equipos" className={estilos.raton}>
            <span aria-hidden="true" className={estilos.ratonCaja}>
              <span className={estilos.ratonRueda} />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
