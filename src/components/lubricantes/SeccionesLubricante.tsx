import { IconFileTypePdf } from "@tabler/icons-react";
import Image from "next/image";

import type { SeccionLubricante } from "@/lib/lubricantes/marca";

import estilos from "./lubricantes.module.css";

/**
 * LAS LÍNEAS DE PRODUCTO DE UNA MARCA DE LUBRICANTES, cada una en su sección
 * con ancla (`#auto-liviano`…): antes eran 4 páginas de WordPress, hoy son
 * secciones de esta (decisión de dirección del 2026-10-14; sus URL antiguas
 * llevan un 301 al ancla).
 *
 * PROVISIONAL hasta el diseño de Andrés, con el lenguaje de las páginas de
 * marca de repuestos. Componente de SERVIDOR, sin JavaScript. Cada producto:
 * foto del envase, nombre, grado y su ficha técnica en PDF; «Cotizar» lleva al
 * formulario del final de la página.
 */
export function SeccionesLubricante({
  secciones,
  anclaContacto,
}: {
  secciones: SeccionLubricante[];
  anclaContacto: string;
}) {
  return (
    <>
      {secciones.map((s) => {
        const idTitulo = `${s.ancla}-titulo`;
        return (
          <section
            key={s.ancla}
            id={s.ancla}
            className={estilos.seccion}
            aria-labelledby={idTitulo}
          >
            <div className={estilos.cabeceraSeccion}>
              <div>
                <h2 id={idTitulo} className={estilos.tituloSeccion}>
                  {s.nombre}
                </h2>
                {s.entradilla ? <p className={estilos.entradilla}>{s.entradilla}</p> : null}
              </div>
              <a href={`#${anclaContacto}`} className={estilos.cotizar}>
                Cotizar
              </a>
            </div>

            {s.grupos.map((g) => (
              <div key={g.clave} className={estilos.grupo}>
                {g.titulo ? <h3 className={estilos.tituloGrupo}>{g.titulo}</h3> : null}
                <ul className={estilos.productos}>
                  {g.productos.map((p) => (
                    <li key={p.clave} className={estilos.producto}>
                      <div className={estilos.fotoCaja}>
                        {p.imagen ? (
                          <Image
                            src={p.imagen.url}
                            alt={p.imagen.alt}
                            width={p.imagen.width}
                            height={p.imagen.height}
                            sizes="(max-width: 767px) 44vw, 220px"
                            className={estilos.foto}
                          />
                        ) : null}
                      </div>
                      <p className={estilos.nombre}>{p.nombre}</p>
                      {p.grado ? <p className={estilos.grado}>{p.grado}</p> : null}
                      {p.ficha ? (
                        <a
                          href={p.ficha}
                          className={estilos.ficha}
                          target="_blank"
                          rel="noopener"
                          aria-label={`Ficha técnica de ${p.nombre}${p.grado ? ` ${p.grado}` : ""} (PDF, se abre en otra pestaña)`}
                        >
                          <IconFileTypePdf aria-hidden="true" focusable="false" stroke={1.5} />
                          Ficha técnica
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
