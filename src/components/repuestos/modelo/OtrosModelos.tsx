import { VerTodosEquipos } from "@/components/nueva/VerTodosEquipos";
import estilos from "@/components/repuestos/marca.module.css";
import type { ElementoPanel } from "@/components/nueva/VerTodosEquipos";

import estilosModelo from "./modelo.module.css";

/**
 * «VER TODOS» DE LA PÁGINA DE MODELO (dirección, 2026-10-26), tras las baldosas de categorías:
 * abre el PANEL INFERIOR de la marca y del tipo (la rejilla del #355) con los modelos de su serie
 * (o de su tipo, si no tiene series), y el modelo de la página MARCADO (borde y fondo del color
 * de la marca, check y «página actual» para lectores de pantalla; lo decide el panel por la ruta).
 *
 * Sin JavaScript (o con Ctrl, ⌘…), el botón lleva a la página del tipo, al ancla de su serie.
 * Con un solo modelo no hay nada más que ver: no se pinta.
 */
export function OtrosModelos({
  id,
  titulo,
  tituloPanel,
  href,
  modelos,
  acento,
  buscador,
}: {
  id: string;
  titulo: string;
  tituloPanel: string;
  /** La página del tipo (con el ancla de la serie). */
  href: string;
  modelos: ElementoPanel[];
  acento: string | null;
  /** R5: buscador y orden natural en el panel. */
  buscador: boolean;
}) {
  if (modelos.length < 2) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.mostrarMarcas} aria-labelledby={idTitulo}>
      <div className={`${estilos.mostrarMarcasRecuadro} ${estilosModelo.otrosModelos}`}>
        <h2 id={idTitulo} className={estilosModelo.otrosModelosTitulo}>
          {titulo}
        </h2>
        <VerTodosEquipos
          titulo={tituloPanel}
          href={href}
          total={modelos.length}
          equipos={modelos}
          className={estilos.botonTarjeta}
          describedBy={idTitulo}
          acento={acento}
          buscador={buscador}
        />
      </div>
    </section>
  );
}
