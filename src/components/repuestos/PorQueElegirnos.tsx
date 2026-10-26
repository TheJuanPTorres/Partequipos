import Image from "next/image";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { VistaPorQue } from "@/lib/repuestos/plantillaTipo";

import estilos from "./plantillaTipo.module.css";

/**
 * «¿POR QUÉ ELEGIRNOS?» de la plantilla de Andrés (2026-10-19): sobre el gris de la página, una
 * foto a la izquierda (40 %) con velo oscuro y, a la derecha (60 %), el título, los puntos, la
 * frase de cierre y el botón «Solicita asesoría», que baja al formulario de contacto.
 *
 * Componente de SERVIDOR. Los textos y la foto salen del global de repuestos (editables); sin
 * título ni sin foto no se pinta (dirección, 2026-10-19). La página de aditamentos (2026-10-20)
 * lo usa para «Nuestro compromiso…»: sin foto, solo su imagen no se pinta y el texto ocupa la tarjeta. En móvil, la foto va
 * arriba como una banda y el texto debajo.
 */
export function PorQueElegirnos({
  id,
  vista,
  anclaContacto,
  formulario,
}: {
  id: string;
  vista: VistaPorQue | null;
  anclaContacto: string;
  /** El formulario de contacto de la página: el botón lo abre en una ventana. */
  formulario: ConfigFormulario;
}) {
  if (!vista) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.porQue} aria-labelledby={idTitulo}>
      <div className={estilos.porQueTarjeta}>
        {vista.imagen ? (
          <div className={estilos.porQueFoto}>
            <Image
              src={vista.imagen.url}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 40vw"
              className={estilos.porQueFotoImg}
            />
          </div>
        ) : null}
        <div className={`${estilos.porQueTexto} ${vista.imagen ? "" : estilos.porQueTextoSolo}`}>
          <h2 id={idTitulo} className={estilos.porQueTitulo}>
            {vista.titulo}
          </h2>
          {vista.entradilla || vista.texto ? (
            <div className={estilos.porQueCierre}>
              {vista.entradilla ? (
                <p className={estilos.porQueEntradilla}>
                  <strong>{vista.entradilla}</strong>
                </p>
              ) : null}
              {vista.texto ? <p>{vista.texto}</p> : null}
            </div>
          ) : null}
          {vista.compromiso ? (
            <p className={estilos.porQueCompromiso}>
              <strong>{vista.compromiso.titulo}</strong>
              {vista.compromiso.texto ? (
                <>
                  <br />
                  {vista.compromiso.texto}
                </>
              ) : null}
            </p>
          ) : null}
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
            <BotonFormulario
              href={`#${anclaContacto}`}
              className={estilos.porQueBoton}
              formulario={formulario}
            >
              {vista.boton}
            </BotonFormulario>
          ) : null}
        </div>
      </div>
    </section>
  );
}
