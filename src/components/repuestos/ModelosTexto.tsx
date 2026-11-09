import { IconArrowRight } from "@tabler/icons-react";

import { textoDeBusqueda } from "@/lib/repuestos/fichaModelo";
import type { GrupoDeModelos } from "@/lib/repuestos/series";
import type { ModeloEnlace } from "@/lib/repuestos/tipo";

import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

import { AyudaModelo } from "./AyudaModelo";
import { BarraSeries } from "./BarraSeries";
import { BuscadorModelos } from "./BuscadorModelos";
import estilos from "./marca.module.css";
import estilosTexto from "./modelosTexto.module.css";

/**
 * «MODELOS DE <TIPO> <MARCA>» de la página de tipo, SIN FOTOS (Ronda 12, 2026-11-08: el cliente
 * vende repuestos, no máquinas). Un campo «Busca tu modelo» que filtra al escribir y, debajo,
 * tarjetas compactas de texto: el modelo en grande, su serie, una franja fina del color de la
 * marca arriba y una flecha. Toda la tarjeta es el enlace a la ficha. 4 por fila en escritorio,
 * 3 en tablet y 2 en móvil.
 *
 * Con SERIES (Hitachi), un subtítulo por serie con su ancla, a la que baja la tarjeta de la
 * serie en la página de la marca, y la barra de series fija (R2) con dos o más. Una entrada que
 * WordPress nombra sin página (`href` nulo) va como tarjeta sin enlace ni flecha.
 *
 * Reemplaza a `ModelosTipo` (tarjetas con foto y «Ver todos») en esta página; el panel «Ver
 * todos» de la página de la marca no cambia.
 */
export function ModelosTexto({
  id,
  titulo,
  modelos,
  grupos,
  vacio,
  barraSeries = false,
  ayuda = null,
}: {
  id: string;
  titulo: string;
  modelos: ModeloEnlace[];
  grupos?: GrupoDeModelos<ModeloEnlace>[] | null;
  vacio: string;
  /** R2. */
  barraSeries?: boolean;
  /** R4: el formulario que abre «¿No encuentras tu modelo?». */
  ayuda?: { formulario: ConfigFormulario; anclaContacto: string } | null;
}) {
  const idTitulo = `${id}-titulo`;
  const series = (grupos ?? []).flatMap((g) =>
    g.ancla ? [{ ancla: g.ancla, titulo: g.titulo, total: g.modelos.length }] : [],
  );
  const conBarra = barraSeries && series.length >= 2;

  return (
    <section
      id={id}
      className={`${estilos.tarjetas} ${estilosTexto.seccion} ${conBarra ? estilos.conBarraSeries : ""}`}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      {modelos.length === 0 ? (
        <p className={estilos.modelosVacio}>{vacio}</p>
      ) : (
        <>
          <BuscadorModelos idSeccion={id} total={modelos.length} />
          {conBarra ? <BarraSeries series={series} /> : null}
          {grupos ? (
            grupos.map((g) => (
              <div
                key={g.ancla ?? "otros"}
                id={g.ancla ?? undefined}
                className={`${estilos.modelosGrupo} ${estilosTexto.grupo}`}
                data-grupo-modelos=""
              >
                <h3 className={estilosTexto.serie}>{g.titulo}</h3>
                <Rejilla modelos={g.modelos} />
              </div>
            ))
          ) : (
            <div className={estilosTexto.grupo} data-grupo-modelos="">
              <Rejilla modelos={modelos} />
            </div>
          )}
        </>
      )}
      {ayuda && modelos.length > 0 ? (
        <AyudaModelo formulario={ayuda.formulario} anclaContacto={ayuda.anclaContacto} />
      ) : null}
    </section>
  );
}

function Rejilla({ modelos }: { modelos: ModeloEnlace[] }) {
  return (
    <ul className={estilosTexto.rejilla}>
      {modelos.map((m) => {
        // El modelo en grande (su código: «EX120-2»); debajo, su serie, si la tiene.
        const contenido = (
          <>
            <span className={estilosTexto.nombre}>{m.corto ?? m.nombre}</span>
            {m.serie ? <span className={estilosTexto.detalle}>Serie {m.serie}</span> : null}
            {m.href ? (
              <IconArrowRight
                aria-hidden="true"
                focusable="false"
                size={22}
                stroke={2}
                className={estilosTexto.flecha}
              />
            ) : null}
          </>
        );
        return (
          <li key={m.id} className={estilosTexto.tarjeta} data-modelo-busqueda={textoDeBusqueda(m)}>
            {m.href ? (
              // El nombre completo como nombre accesible: «Excavadora Hitachi EX120-2», no solo el código.
              <a href={m.href} aria-label={m.nombre} className={estilosTexto.enlace}>
                {contenido}
              </a>
            ) : (
              <div className={`${estilosTexto.enlace} ${estilosTexto.sinPagina}`}>{contenido}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
