import { IconBrandWhatsapp } from "@tabler/icons-react";
import Image from "next/image";

import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./modelo.module.css";

/**
 * «ESTAMOS AQUÍ PARA AYUDARLO» (la tarjeta de WordPress de cada modelo, textos
 * tal cual): foto de fondo con velo, título, «Escríbenos» y el botón de
 * WhatsApp. Sin número de WhatsApp, no se pinta (sería un botón muerto).
 *
 * Se aparta de WordPress: el botón es verde OSCURO con texto blanco (el verde
 * de WhatsApp con texto blanco no llega a AA).
 */
export function AyudaWhatsApp({
  titulo,
  texto,
  boton,
  href,
  fondo,
}: {
  titulo: string;
  texto: string;
  boton: string;
  href: string | null;
  fondo: ImagenLista | null;
}) {
  if (!href) return null;
  return (
    <section className={estilos.ayuda} aria-labelledby="modelo-ayuda">
      {fondo ? (
        <Image src={fondo.url} alt="" fill sizes="100vw" className={estilos.ayudaFondo} />
      ) : null}
      <div className={estilos.ayudaVelo} aria-hidden="true" />
      <div className={estilos.ayudaContenido}>
        <h2 id="modelo-ayuda" className={estilos.ayudaTitulo}>
          {titulo}
        </h2>
        <p className={estilos.ayudaTexto}>{texto}</p>
        <a href={href} className={estilos.ayudaBoton} target="_blank" rel="noopener noreferrer">
          <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
          {boton}
          <span className="sr-only"> (abre WhatsApp)</span>
        </a>
      </div>
    </section>
  );
}
