import { IconArrowRight } from "@tabler/icons-react";

import type { TarjetaMarca } from "@/lib/repuestos/marca";

import estilos from "./marca.module.css";
import estilosTexto from "./modelosTexto.module.css";

/**
 * «REPUESTOS SEGÚN TIPO DE MÁQUINA» de la página de marca, SIN FOTOS (Ronda 17, 2026-11-09: el
 * cliente vende repuestos, no máquinas). El mismo listado de antes —una entrada por tipo, o por
 * serie en los tipos con series—, pero como las tarjetas de texto de la lista de modelos
 * (`ModelosTexto`, #433): el nombre en grande, cuántos modelos tiene, la franja fina del color de
 * la marca y una flecha. Toda la tarjeta es el enlace a la página del tipo (o al ancla de la
 * serie). 4 por fila en escritorio, 3 en tablet y 2 en móvil.
 */
export function TiposTexto({
  id,
  titulo,
  tarjetas,
}: {
  id: string;
  titulo: string;
  tarjetas: TarjetaMarca[];
}) {
  if (!titulo || tarjetas.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${estilos.tarjetas} ${estilosTexto.seccion} ${estilosTexto.sinFranja}`}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      <div className={estilosTexto.grupo}>
        <ul className={estilosTexto.rejilla}>
          {tarjetas.map((t) => {
            const contenido = (
              <>
                <span className={estilosTexto.nombre}>{t.titulo}</span>
                {t.panel ? (
                  <span className={estilosTexto.detalle}>
                    {t.panel.total} {t.panel.total === 1 ? "modelo" : "modelos"}
                  </span>
                ) : null}
                {t.href ? (
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
              <li key={t.clave} className={estilosTexto.tarjeta}>
                {t.href ? (
                  <a href={t.href} className={estilosTexto.enlace}>
                    {contenido}
                  </a>
                ) : (
                  <div className={`${estilosTexto.enlace} ${estilosTexto.sinPagina}`}>
                    {contenido}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
