import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { RUTA_MARCAS_NUEVA, type TarjetaMarca } from "@/lib/portada/secciones";

import { CarruselMarcas } from "./CarruselMarcas";
import estilos from "./maquinariaNueva.module.css";

/**
 * SECCIÓN 2 DE LA PORTADA — «Maquinaria pesada nueva» (ux-9).
 *
 * Componente de SERVIDOR: el título, el antetítulo y el botón van en el HTML;
 * solo el carrusel es de cliente. Los textos de la sección son de interfaz,
 * como los de la navegación; las tarjetas salen de `marcas-maquinaria`.
 *
 * D1: el título va en `<h2>` (en ux-9 es un `<div>`).
 */
export function SeccionMaquinariaNueva({ tarjetas }: { tarjetas: TarjetaMarca[] }) {
  if (tarjetas.length === 0) return null;
  return (
    <section className={estilos.seccion} aria-labelledby="portada-nueva-titulo">
      <div className={estilos.cabecera}>
        <p className={`${estilos.antetitulo} texto-etiqueta`}>Venta de maquinaria</p>
        <Revelado
          como="h2"
          id="portada-nueva-titulo"
          texto="Maquinaria pesada nueva"
          ritmo="titulo"
          disparo={0.95}
          className={`${estilos.titulo} texto-titulo-seccion`}
        />
        <CarruselMarcas tarjetas={tarjetas} etiqueta="Marcas de maquinaria nueva" />
      </div>
      <div className={estilos.pie}>
        <Link href={RUTA_MARCAS_NUEVA} className={`${estilos.boton} texto-etiqueta`}>
          <IconSettings aria-hidden="true" focusable="false" stroke={1.75} />
          Ver todo
        </Link>
      </div>
    </section>
  );
}
