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
            <a href={m.href as string} className={estilos.otroEnlace}>
              {m.nombre}
              {m.codigo ? <span className={estilos.otroCodigo}>{m.codigo}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
