import { IconBrandWhatsapp, IconCirclePlus } from "@tabler/icons-react";
import Image from "next/image";

import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./modelo.module.css";

/**
 * PRESENTACIÓN DEL MODELO (página de modelo de repuestos, diseño propio del
 * 2026-10-19), en PANTALLA PARTIDA: la foto del modelo a sangre a un lado y el
 * párrafo de WordPress (tal cual) al otro, separados por una división diagonal
 * de borde orgánico —una máscara SVG con trazos de pincel, desenfocada— que se
 * funde con el blanco del texto. En móvil, la foto arriba con el mismo borde,
 * fundido hacia abajo. Los botones son los de la ficha V2.
 *
 * Sin foto del modelo, el lado de la imagen es un panel oscuro con un brillo
 * del color de la marca y su logo en blanco, en grande, con el mismo borde:
 * sin una mitad vacía.
 *
 * Sin animación. El borde es una máscara CSS: no mueve nada (sin CLS) y no
 * descarga nada (el SVG va en el propio CSS).
 */
export function PresentacionModelo({
  texto,
  foto,
  logo,
  solicitarHref,
  whatsapp,
}: {
  texto: string;
  foto: ImagenLista | null;
  /** El logo de la marca, para el panel sin foto. */
  logo: ImagenLista | null;
  solicitarHref: string;
  whatsapp: string | null;
}) {
  return (
    <section className={estilos.presentacion} aria-label="Presentación del modelo">
      <div className={estilos.partida}>
        <div className={estilos.lado} data-sin-foto={foto ? undefined : ""}>
          {foto ? (
            <Image
              src={foto.url}
              alt={foto.alt}
              fill
              sizes="(min-width: 1025px) 56vw, 100vw"
              className={estilos.foto}
            />
          ) : logo ? (
            <span className={estilos.logoGrande} aria-hidden="true">
              <Image
                src={logo.url}
                alt=""
                width={logo.width}
                height={logo.height}
                sizes="420px"
                className={estilos.logoGrandeImg}
              />
            </span>
          ) : null}
        </div>

        <div className={estilos.columnaTexto}>
          {texto ? <p className={estilos.parrafo}>{texto}</p> : null}
          <div className={estilos.botones}>
            <a href={solicitarHref} className={estilos.boton}>
              <IconCirclePlus aria-hidden="true" stroke={1.75} />
              Solicitar repuestos
            </a>
            {whatsapp ? (
              <a
                href={whatsapp}
                className={`${estilos.boton} ${estilos.botonOscuro}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
                Habla con un experto
                <span className="sr-only"> (abre WhatsApp)</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
