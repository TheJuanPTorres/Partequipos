"use client";

import { useFormFields } from "@payloadcms/ui";

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
  const conBloques =
    (typeof filas === "number" ? filas : Array.isArray(filas) ? filas.length : 0) > 0;

  return (
    <div className="field-description">
      {texto ? <p style={{ margin: 0 }}>{texto}</p> : null}
      {conBloques ? (
        <p role="note" style={{ margin: texto ? "4px 0 0" : 0, fontWeight: 600 }}>
          Esta página tiene bloques: se compone con ellos y este campo NO se muestra en el sitio.
        </p>
      ) : null}
    </div>
  );
}
