import { IconMapPin } from "@tabler/icons-react";

import { urlGoogleMaps, type SedeLista } from "@/lib/portada/sedes";

import estilos from "./plantillaTipo.module.css";

/**
 * SEDES de la plantilla de Andrés (2026-10-19): una tarjeta redondeada por sede, con el icono de
 * ubicación, la ciudad y, por cada línea (maquinaria, repuestos, almacén…), su dirección y su
 * teléfono. Salen de la colección de sedes (la de la portada), no del JSON de la plantilla.
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
            <div>
              <h3 className={estilos.sedeCiudad}>{s.ciudad}</h3>
              {s.lineas.map((l) => (
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
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
