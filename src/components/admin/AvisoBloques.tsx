"use client";

import { useFormFields } from "@payloadcms/ui";

import { cuantasFilas } from "@/lib/panel/avisos";

import { Aviso } from "./aviso/Aviso";

type Props = { texto?: string };

/**
 * DESCRIPCIÓN de «Contenido» y «Secciones con ancla» en las páginas
 * institucionales. Si la página tiene BLOQUES, se compone con ellos y estos
 * dos campos NO se pintan: el aviso lo dice en el momento, para que nadie
 * escriba texto que no se va a ver (decisión de dirección, 2026-10-02).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE: lee el estado del formulario en vivo.
 */
export default function AvisoBloques({ texto }: Props) {
  const filas = useFormFields(([campos]) => campos?.bloques?.value);
  const conBloques = cuantasFilas(filas) > 0;

  return (
    <div className="field-description">
      {texto ? <p style={{ margin: 0 }}>{texto}</p> : null}
      {conBloques ? (
        // Desde la F4, con el aviso común (tono de advertencia).
        <Aviso className="pq-aviso--en-campo" tono="aviso">
          <p>
            Esta página tiene bloques: se compone con ellos y este campo no se muestra en el sitio.
          </p>
        </Aviso>
      ) : null}
    </div>
  );
}
