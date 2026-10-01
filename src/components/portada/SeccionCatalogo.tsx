import { IconBrandWhatsapp, IconTruck } from "@tabler/icons-react";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { RUTA_CATALOGO } from "@/lib/portada/seccionesF";

import estilos from "./catalogo.module.css";

/**
 * SECCIÓN 8 DE LA PORTADA — llamada a la acción tras «Nuestra Compañía» (ux-9).
 *
 * Componente de SERVIDOR: título y dos botones. Sube 180 px sobre la sección
 * anterior, como ux-9 (`margin-top: -180px`). Por encima de 768 px el recorrido
 * del vídeo deja ese hueco libre; a 768 o menos el título queda SOBRE el final
 * del vídeo, como en ux-9.
 *
 * Lo que se aparta (docs/diseno/decisiones-home-ux9.md §19):
 * - D1: título en `<h2>` (en ux-9, `<div>`).
 * - D6: iconos de Tabler (en ux-9, Font Awesome).
 * - D16: «Catálogo» (en ux-9, «Catálgo»).
 * - D22: SIN vídeo (producción), a 768 px o menos no sube: el título oscuro
 *   quedaría sobre la tarjeta oscura, ilegible.
 */
type Props = { whatsapp: string; sobreVideo: boolean };

export function SeccionCatalogo({ whatsapp, sobreVideo }: Props) {
  return (
    <section
      className={estilos.seccion}
      aria-labelledby="portada-catalogo-titulo"
      data-sin-video={sobreVideo ? undefined : ""}
    >
      <Revelado
        como="h2"
        id="portada-catalogo-titulo"
        texto="Encuentra la maquinaria que tu operación necesita"
        ritmo="titulo"
        disparo={0.95}
        className={`${estilos.titulo} texto-titulo-seccion`}
      />
      <div className={estilos.botones}>
        <Link href={RUTA_CATALOGO} className={`${estilos.boton} texto-etiqueta`}>
          <IconTruck aria-hidden="true" focusable="false" stroke={1.75} />
          Catálogo
        </Link>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={`${estilos.boton} texto-etiqueta`}
        >
          <IconBrandWhatsapp aria-hidden="true" focusable="false" stroke={1.75} />
          WhatsApp
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>
      </div>
    </section>
  );
}
