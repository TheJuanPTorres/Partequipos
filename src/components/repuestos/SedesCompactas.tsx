import { IconMapPin } from "@tabler/icons-react";

import { urlGoogleMaps, type SedeLista } from "@/lib/portada/sedes";

import estilos from "./sedesCompactas.module.css";

/** Lo que dice una sede sin líneas todavía (sin dirección en el panel), para que no quede vacía. */
export const SEDE_SIN_DATOS = "Próximamente más información.";

/**
 * SEDES de la plantilla de Andrés (2026-10-19): una tarjeta redondeada por sede, con el icono de
 * ubicación, «Sede <nombre>», si es principal o secundaria y, por cada línea (maquinaria,
 * repuestos, almacén…), su dirección y su teléfono. Salen de la colección de sedes (la de la
 * portada y su mapa), en su orden, no del JSON de la plantilla.
 *
 * Ronda 18, t5: tarjetas uniformes (mismo alto por fila, última fila centrada, techo de ancho) y
 * un texto discreto en las sedes sin dirección. Lo usan Aditamentos y las páginas de marca, tipo,
 * categoría técnica y subcategoría de repuestos.
 *
 * Componente de SERVIDOR, sin globo ni mapa: es la versión compacta de la sección de la portada,
 * para páginas donde las sedes cierran la página. Título solo para lectores.
 */
export function SedesCompactas({ id, sedes }: { id: string; sedes: SedeLista[] }) {
  if (sedes.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.sedes} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="sr-only">
        Nuestras sedes
      </h2>
      <ul className={estilos.sedesLista}>
        {sedes.map((s) => (
          <li key={s.id} className={estilos.sede}>
            <IconMapPin
              className={estilos.sedeIcono}
              aria-hidden="true"
              focusable="false"
              stroke={1.6}
              size={34}
            />
            <div className={estilos.sedeCuerpo}>
              <div className={estilos.sedeCabecera}>
                <h3 className={estilos.sedeTitulo}>{s.titulo}</h3>
                <p
                  className={`${estilos.sedeTipo} ${s.tipo === "principal" ? estilos.sedeTipoPrincipal : ""}`}
                >
                  {s.tipo === "principal" ? "Principal" : "Secundaria"}
                </p>
              </div>
              {s.lineas.length === 0 ? (
                <p className={estilos.sedeProximamente}>{SEDE_SIN_DATOS}</p>
              ) : (
                s.lineas.map((l) => (
                  <p key={`${l.etiqueta}-${l.direccion}`} className={estilos.sedeLinea}>
                    <strong>{l.etiqueta}:</strong>
                    <br />
                    <a
                      href={urlGoogleMaps(l.direccion, s.ciudad)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={estilos.sedeDireccion}
                    >
                      {l.direccion}
                      <span className="sr-only"> (se abre en una pestaña nueva)</span>
                    </a>
                    {l.telefono ? (
                      <>
                        <br />
                        <a href={l.telefono.href} className={estilos.sedeTelefono}>
                          {l.telefono.texto}
                        </a>
                      </>
                    ) : null}
                  </p>
                ))
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
