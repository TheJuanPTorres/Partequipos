import { IconBrandWhatsapp, IconCirclePlus } from "@tabler/icons-react";
import Image from "next/image";

import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./modelo.module.css";

/**
 * PRESENTACIÓN DEL MODELO (página de modelo de repuestos, diseño propio del
 * 2026-10-19): el párrafo de WordPress, tal cual, con los botones de la ficha
 * V2 («Solicitar repuestos» baja al formulario; «Habla con un experto» abre
 * WhatsApp) y la foto del modelo en su caja, sobre una copia desenfocada de sí
 * misma que la rellena (como la galería de la ficha). Sin foto, el texto solo.
 *
 * Va sobre la franja del color de la marca, entre la cabecera y las categorías.
 */
export function PresentacionModelo({
  texto,
  foto,
  solicitarHref,
  whatsapp,
}: {
  texto: string;
  foto: ImagenLista | null;
  solicitarHref: string;
  whatsapp: string | null;
}) {
  return (
    <section className={estilos.presentacion} aria-label="Presentación del modelo">
      <div className={estilos.tarjeta} data-sin-foto={foto ? undefined : ""}>
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
        {foto ? (
          <div className={estilos.caja}>
            <Image
              src={foto.url}
              alt=""
              fill
              sizes="64px"
              className={estilos.fotoFondo}
              aria-hidden="true"
            />
            <Image
              src={foto.url}
              alt={foto.alt}
              fill
              sizes="(min-width: 1025px) 46vw, 92vw"
              className={estilos.foto}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
