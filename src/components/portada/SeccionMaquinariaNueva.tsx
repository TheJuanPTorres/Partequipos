import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";
import type { TarjetaMarca } from "@/lib/portada/secciones";

import { CarruselMarcas } from "./diferidos";
import estilos from "./maquinariaNueva.module.css";

/**
 * SECCIÓN 2 DE LA PORTADA — «Maquinaria pesada nueva» (ux-9).
 *
 * Componente de SERVIDOR: el título, el antetítulo y el botón van en el HTML;
 * solo el carrusel es de cliente. Los textos salen del panel (página
 * «inicio», grupo de la sección); las tarjetas, de `marcas-maquinaria`.
 *
 * D1: el título va en `<h2>` (en ux-9 es un `<div>`).
 */
export type TextosNueva = {
  antetitulo: string;
  titulo: string;
  botonTexto: string;
  botonEnlace: string;
};

export function SeccionMaquinariaNueva({
  tarjetas,
  textos,
}: {
  tarjetas: TarjetaMarca[];
  textos: TextosNueva;
}) {
  if (tarjetas.length === 0) return null;
  return (
    <section className={estilos.seccion} aria-labelledby="portada-nueva-titulo">
      <div className={estilos.cabecera}>
        {textos.antetitulo ? (
          <p className={`${estilos.antetitulo} texto-etiqueta`}>{textos.antetitulo}</p>
        ) : null}
        {textos.titulo ? (
          <Revelado
            adelanto={ADELANTOS.alto}
            como="h2"
            id="portada-nueva-titulo"
            texto={textos.titulo}
            ritmo="titulo"
            disparo={0.95}
            className={`${estilos.titulo} texto-titulo-seccion`}
          />
        ) : null}
        <CarruselMarcas tarjetas={tarjetas} etiqueta="Marcas de maquinaria nueva" />
      </div>
      {textos.botonTexto && textos.botonEnlace ? (
        <div className={estilos.pie}>
          <Link href={textos.botonEnlace} className={`${estilos.boton} texto-etiqueta`}>
            <IconSettings aria-hidden="true" focusable="false" stroke={1.75} />
            {textos.botonTexto}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
