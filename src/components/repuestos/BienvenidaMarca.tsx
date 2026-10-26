import type { VistaBienvenida } from "@/lib/repuestos/paginaMarca";

import estilos from "./bienvenida.module.css";
import { CarruselFotos } from "./CarruselFotos";

/**
 * PRESENTACIÓN de una página de marca dentro de una categoría (Filtros Donaldson, 2026-10-26,
 * dirección): el antetítulo, el título y el texto de bienvenida de su página de WordPress, con
 * su carrusel de fotos al lado (debajo en el teléfono). Sin nada que pintar, no sale.
 */
export function BienvenidaMarca({ id, vista }: { id: string; vista: VistaBienvenida | null }) {
  if (!vista) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={estilos.bienvenida}
      aria-labelledby={vista.titulo ? idTitulo : undefined}
    >
      <div className={estilos.texto}>
        {vista.antetitulo ? <p className={estilos.antetitulo}>{vista.antetitulo}</p> : null}
        {vista.titulo ? (
          <h2 id={idTitulo} className={estilos.titulo}>
            {vista.titulo}
          </h2>
        ) : null}
        {vista.texto ? <p className={estilos.parrafo}>{vista.texto}</p> : null}
      </div>
      {vista.fotos.length > 0 ? (
        <CarruselFotos fotos={vista.fotos} etiqueta={vista.titulo || "Fotos"} />
      ) : null}
    </section>
  );
}
