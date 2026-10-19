import Image from "next/image";

import type { VistaPorQue } from "@/lib/repuestos/plantillaTipo";

import estilos from "./plantillaTipo.module.css";

/**
 * «¿POR QUÉ ELEGIRNOS?» de la plantilla de Andrés (2026-10-19): sobre el gris de la página, una
 * foto a la izquierda (40 %) con velo oscuro y, a la derecha (60 %), el título, los puntos, la
 * frase de cierre y el botón «Solicita asesoría», que baja al formulario de contacto.
 *
 * Componente de SERVIDOR. Los textos y la foto salen del global de repuestos (editables); sin
 * título ni sin foto no se pinta (dirección, 2026-10-19). En móvil, la foto va
 * arriba como una banda y el texto debajo.
 */
export function PorQueElegirnos({
  id,
  vista,
  anclaContacto,
}: {
  id: string;
  vista: VistaPorQue | null;
  anclaContacto: string;
}) {
  if (!vista) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.porQue} aria-labelledby={idTitulo}>
      <div className={estilos.porQueTarjeta}>
        <div className={estilos.porQueFoto}>
          <Image
            src={vista.imagen.url}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 40vw"
            className={estilos.porQueFotoImg}
          />
        </div>
        <div className={estilos.porQueTexto}>
          <h2 id={idTitulo} className={estilos.porQueTitulo}>
            {vista.titulo}
          </h2>
          {vista.puntos.length > 0 ? (
            <ul className={estilos.porQuePuntos}>
              {vista.puntos.map((p) => (
                <li key={p.clave}>
                  <strong>{p.titulo}:</strong> {p.texto}
                </li>
              ))}
            </ul>
          ) : null}
          {vista.cierre ? <p className={estilos.porQueCierre}>{vista.cierre}</p> : null}
          {vista.boton ? (
            <a href={`#${anclaContacto}`} className={estilos.porQueBoton}>
              {vista.boton}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
