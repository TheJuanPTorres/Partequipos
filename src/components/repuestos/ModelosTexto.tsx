import type { LogoMarca } from "@/lib/marca/logoMarca";
import { textoDeBusqueda } from "@/lib/repuestos/fichaModelo";
import type { GrupoDeModelos } from "@/lib/repuestos/series";
import type { ModeloEnlace } from "@/lib/repuestos/tipo";

import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

import { AyudaModelo } from "./AyudaModelo";
import { BarraSeries } from "./BarraSeries";
import { BuscadorModelos } from "./BuscadorModelos";
import estilos from "./marca.module.css";
import estilosTexto from "./modelosTexto.module.css";
import { TarjetaModelo } from "./TarjetaModelo";
import estilosTarjeta from "./tarjetaModelo.module.css";

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
  sinFranja = false,
  logo = null,
}: {
  id: string;
  titulo: string;
  modelos: ModeloEnlace[];
  grupos?: GrupoDeModelos<ModeloEnlace>[] | null;
  vacio: string;
  /** R2. */
  barraSeries?: boolean;
  /** Bajo la cabecera roja (sin la franja de color que la sección solapaba). */
  sinFranja?: boolean;
  /** R4: el formulario que abre «¿No encuentras tu modelo?». */
  ayuda?: { formulario: ConfigFormulario; anclaContacto: string } | null;
  /** El logo de la marca (una marca, un solo logo) para las tarjetas de modelo. */
  logo?: LogoMarca | null;
}) {
  const idTitulo = `${id}-titulo`;
  const series = (grupos ?? []).flatMap((g) =>
    g.ancla ? [{ ancla: g.ancla, titulo: g.titulo, total: g.modelos.length }] : [],
  );
  const conBarra = barraSeries && series.length >= 2;

  return (
    <section
      id={id}
      className={`${estilos.tarjetas} ${estilosTexto.seccion} ${conBarra ? estilos.conBarraSeries : ""} ${sinFranja ? estilosTexto.sinFranja : ""}`}
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
                <RejillaModelos modelos={g.modelos} logo={logo} />
              </div>
            ))
          ) : (
            <div className={estilosTexto.grupo} data-grupo-modelos="">
              <RejillaModelos modelos={modelos} logo={logo} />
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

export function RejillaModelos({
  modelos,
  logo = null,
}: {
  modelos: ModeloEnlace[];
  logo?: LogoMarca | null;
}) {
  return (
    <ul className={estilosTarjeta.rejilla}>
      {modelos.map((m) => (
        <li key={m.id} className={estilosTexto.tarjeta} data-modelo-busqueda={textoDeBusqueda(m)}>
          {/* El nombre completo como nombre accesible: «Excavadora Hitachi EX120-2», no solo el código. */}
          <TarjetaModelo
            modelo={m.corto ?? m.nombre}
            detalle={m.serie ? `Serie ${m.serie}` : null}
            nombreCompleto={m.nombre}
            href={m.href}
            logo={logo}
          />
        </li>
      ))}
    </ul>
  );
}
