import { IconBrandWhatsapp, IconTruck } from "@tabler/icons-react";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";

import estilos from "./catalogo.module.css";

/**
 * SECCIÓN 8 DE LA PORTADA — llamada a la acción tras «Nuestra Compañía» (ux-9).
 *
 * Componente de SERVIDOR: título y dos botones. Va DEBAJO del vídeo de
 * «Nuestra Compañía», nunca encima (§27.5). En móvil sube sobre el final del
 * recorrido fijado para que el título entre bajo el vídeo encogido en la misma
 * pantalla (`catalogo.module.css`, dirección 2026-10-06).
 *
 * Lo que se aparta (docs/diseno/decisiones-home-ux9.md §19):
 * - D1: título en `<h2>` (en ux-9, `<div>`).
 * - D6: iconos de Tabler (en ux-9, Font Awesome).
 * - D16: «Catálogo» (en ux-9, «Catálgo»).
 * - D22: SIN vídeo (producción), a 768 px o menos no sube: el título oscuro
 *   quedaría sobre la tarjeta oscura, ilegible.
 */
export type TextosCatalogo = {
  titulo: string;
  catalogoTexto: string;
  catalogoEnlace: string;
  whatsappTexto: string;
};

type Props = { whatsapp: string; textos: TextosCatalogo };

export function SeccionCatalogo({ whatsapp, textos }: Props) {
  return (
    <section className={estilos.seccion} aria-labelledby="portada-catalogo-titulo">
      {textos.titulo ? (
        <Revelado
          como="h2"
          id="portada-catalogo-titulo"
          texto={textos.titulo}
          ritmo="titulo"
          disparo={0.95}
          className={`${estilos.titulo} texto-titulo-seccion`}
        />
      ) : null}
      <div className={estilos.botones}>
        {textos.catalogoTexto && textos.catalogoEnlace ? (
          <Link href={textos.catalogoEnlace} className={`${estilos.boton} texto-etiqueta`}>
            <IconTruck aria-hidden="true" focusable="false" stroke={1.75} />
            {textos.catalogoTexto}
          </Link>
        ) : null}
        {textos.whatsappTexto ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`${estilos.boton} texto-etiqueta`}
          >
            <IconBrandWhatsapp aria-hidden="true" focusable="false" stroke={1.75} />
            {textos.whatsappTexto}
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
