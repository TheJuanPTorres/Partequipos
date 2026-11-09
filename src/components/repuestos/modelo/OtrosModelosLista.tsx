import type { ModeloEnlace } from "@/lib/repuestos/tipo";

import estilos from "./fichaModelo.module.css";

/**
 * «OTROS MODELOS DE {TIPO} {MARCA}» bajo la ficha (Ronda 12, 2026-11-08): los demás modelos del
 * mismo tipo en una lista compacta de enlaces de texto, sin fotos. Sin otros modelos, no se pinta.
 */
export function OtrosModelosLista({
  id,
  titulo,
  modelos,
}: {
  id: string;
  titulo: string;
  modelos: ModeloEnlace[];
}) {
  const conPagina = modelos.filter((m) => m.href);
  if (conPagina.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.otros} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={estilos.otrosTitulo}>
        {titulo}
      </h2>
      <ul className={estilos.otrosLista}>
        {conPagina.map((m) => (
          <li key={m.id}>
            {/* El modelo corto a la vista y el nombre completo como nombre accesible. */}
            <a href={m.href as string} aria-label={m.nombre} className={estilos.otroEnlace}>
              {m.corto ?? m.nombre}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
