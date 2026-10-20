import { IconBrandWhatsapp, IconCirclePlus } from "@tabler/icons-react";
import Image from "next/image";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { LogoMarca } from "@/components/marca/LogoMarca";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { LogoMarca as LogoMarcaDatos } from "@/lib/marca/logoMarca";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./modelo.module.css";

/**
 * PRESENTACIÓN DEL MODELO (página de modelo de repuestos, diseño propio del
 * 2026-10-19), en PANTALLA PARTIDA: la foto del modelo a sangre a un lado y el
 * párrafo de WordPress (tal cual) al otro, separados por una DIAGONAL LIMPIA
 * Y NÍTIDA (máscara SVG de un polígono, en el CSS). En tablet y móvil, la foto
 * arriba cortada por la misma diagonal en horizontal. Los botones son los de
 * la ficha V2.
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
  formulario,
  whatsapp,
}: {
  texto: string;
  foto: ImagenLista | null;
  /** El logo de la marca, para el panel sin foto. */
  logo: LogoMarcaDatos | null;
  solicitarHref: string;
  /** El formulario de la página de modelo: «Solicitar repuestos» lo abre en una ventana. */
  formulario: ConfigFormulario;
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
              <LogoMarca logo={logo} alt="" sizes="420px" className={estilos.logoGrandeImg} />
            </span>
          ) : null}
        </div>

        <div className={estilos.columnaTexto}>
          {texto ? <p className={estilos.parrafo}>{texto}</p> : null}
          <div className={estilos.botones}>
            <BotonFormulario href={solicitarHref} className={estilos.boton} formulario={formulario}>
              <IconCirclePlus aria-hidden="true" stroke={1.75} />
              Solicitar repuestos
            </BotonFormulario>
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
