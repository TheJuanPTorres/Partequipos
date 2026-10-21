import type { GrupoDeModelos } from "@/lib/repuestos/series";
import { tarjetasDeModelos, type ModeloEnlace } from "@/lib/repuestos/tipo";
import type { TiposEquipo } from "@/payload-types";

import estilos from "./marca.module.css";
import { RecuadrosConScroll } from "./RecuadrosConScroll";
import { RejillaTarjetas } from "./TarjetasMarca";

/**
 * «MODELOS DE <TIPO> <MARCA>» de la página de tipo: una TARJETA por modelo, con el estilo
 * «difuminado» de las páginas índice (dirección, 2026-10-21; antes, un botón por modelo en
 * la franja del color de la marca). Mismo contenido y mismos destinos: el nombre de la
 * lista, el código si lo hay y el botón a su ficha; una entrada que WordPress nombra sin
 * página va sin botón. Colocación, la regla de las tarjetas (`rejillaTarjetas`).
 *
 * Sin modelos publicados, un aviso en vez de una sección vacía.
 *
 * Con `grupos` (un tipo con SERIES, como Hitachi), un subtítulo por serie con su ancla,
 * a la que baja la tarjeta de la serie en la página de la marca, y su rejilla debajo.
 */
export function ModelosTipo({
  id,
  titulo,
  tipo,
  modelos,
  vacio,
  grupos,
  verTodo,
}: {
  id: string;
  titulo: string;
  tipo: TiposEquipo;
  modelos: ModeloEnlace[];
  vacio: string;
  grupos?: GrupoDeModelos<ModeloEnlace>[] | null;
  /** Texto del botón de cada tarjeta. */
  verTodo: string;
}) {
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${estilos.tarjetas} ${estilos.tarjetasIndice} ${estilos.modelosTarjetas}`}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      {modelos.length === 0 ? (
        <p className={estilos.modelosVacio}>{vacio}</p>
      ) : grupos ? (
        grupos.map((g) => (
          <div key={g.ancla ?? "otros"} id={g.ancla ?? undefined} className={estilos.modelosGrupo}>
            <h3 className={estilos.modelosSerie}>{g.titulo}</h3>
            <RejillaTarjetas
              id={`${id}-${g.ancla ?? "otros"}`}
              tarjetas={tarjetasDeModelos(tipo, g.modelos)}
              verTodo={verTodo}
              indice
              nivel="h4"
            />
          </div>
        ))
      ) : (
        <RejillaTarjetas
          id={id}
          tarjetas={tarjetasDeModelos(tipo, modelos)}
          verTodo={verTodo}
          indice
          nivel="h3"
        />
      )}
      {modelos.length > 0 ? <RecuadrosConScroll /> : null}
    </section>
  );
}
