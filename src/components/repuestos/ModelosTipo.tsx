import { VerTodosEquipos } from "@/components/nueva/VerTodosEquipos";
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
 *
 * LARGO (dirección, 2026-10-21): de cada serie (o de la lista entera, sin series) se ven solo
 * las 2 PRIMERAS FILAS (6 tarjetas en escritorio, 4 en tablet, 2 en móvil) y debajo «Ver todos
 * (N)», que abre el mismo panel de la marca con la serie completa. Si cabe en 2 filas, no hay
 * botón. Solo CSS, con `@media (scripting: enabled)`: sin JavaScript (o en un navegador que no
 * conoce esa consulta) se ven todas y el botón no sale. Las tarjetas ocultas siguen en el HTML.
 */
export function ModelosTipo({
  id,
  titulo,
  tipo,
  modelos,
  vacio,
  grupos,
  verTodo,
  tituloPanel,
}: {
  id: string;
  titulo: string;
  /** Título del panel «Ver todos» (sin series, el de la lista entera; con series, + la serie). */
  tituloPanel: string;
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
            <RejillaRecortada
              id={`${id}-${g.ancla ?? "otros"}`}
              tipo={tipo}
              modelos={g.modelos}
              verTodo={verTodo}
              tituloPanel={`${tituloPanel}: ${g.titulo}`}
              destino={g.ancla ?? id}
              nivel="h4"
            />
          </div>
        ))
      ) : (
        <RejillaRecortada
          id={id}
          tipo={tipo}
          modelos={modelos}
          verTodo={verTodo}
          tituloPanel={tituloPanel}
          destino={id}
          nivel="h3"
        />
      )}
      {modelos.length > 0 ? <RecuadrosConScroll /> : null}
    </section>
  );
}

/** La rejilla de una serie con sus 2 primeras filas a la vista y «Ver todos (N)» al panel. */
function RejillaRecortada({
  id,
  tipo,
  modelos,
  verTodo,
  tituloPanel,
  destino,
  nivel,
}: {
  id: string;
  tipo: TiposEquipo;
  modelos: ModeloEnlace[];
  verTodo: string;
  tituloPanel: string;
  /** El ancla de la serie (o de la sección): el `href` del botón. */
  destino: string;
  nivel: "h3" | "h4";
}) {
  const n = modelos.length;
  // En qué tamaños no cabe en 2 filas (móvil 2, tablet 4, escritorio 6): ahí sale el botón.
  const clases = [
    estilos.recorteModelos,
    n > 2 ? estilos.recorteMovil : "",
    n > 4 ? estilos.recorteTablet : "",
    n > 6 ? estilos.recorteEscritorio : "",
  ].join(" ");
  return (
    <div className={clases}>
      <RejillaTarjetas
        id={id}
        tarjetas={tarjetasDeModelos(tipo, modelos)}
        verTodo={verTodo}
        indice
        nivel={nivel}
      />
      {n > 2 ? (
        <div className={estilos.verTodosModelos}>
          <VerTodosEquipos
            titulo={tituloPanel}
            // Sin JavaScript el botón no se ve; si llegara a usarse, se queda en la lista.
            href={`#${destino}`}
            total={n}
            equipos={modelos.map(({ id: clave, nombre, href }) => ({ id: clave, nombre, href }))}
            className={estilos.botonTarjeta}
          />
        </div>
      ) : null}
    </div>
  );
}
