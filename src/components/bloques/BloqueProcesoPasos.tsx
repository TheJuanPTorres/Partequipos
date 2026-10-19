import { useId } from "react";

import type { VistaProcesoPasos as Datos } from "@/lib/bloques/vista";

import { BotonBloque } from "./BotonBloque";
import estilos from "./procesoPasos.module.css";

/**
 * BLOQUE «PROCESO PASO A PASO» (2026-10-19) en una página de bloques: título,
 * entradilla y los pasos numerados (01, 02…) en tarjetas. De servidor, sin
 * JavaScript. El diseño «Servicio técnico» lo pinta a su manera
 * (`PlantillaServicioTecnico`); este es el de cualquier otra página.
 */
export function BloqueProcesoPasos({ antetitulo, titulo, entradilla, pasos, boton }: Datos) {
  const idTitulo = useId();
  return (
    <section className={estilos.seccion} aria-labelledby={idTitulo}>
      {antetitulo ? (
        <p className={`${estilos.antetitulo} texto-destacado-negrita`}>{antetitulo}</p>
      ) : null}
      <h2 id={idTitulo} className={`${estilos.titulo} texto-titulo-seccion`}>
        {titulo}
      </h2>
      {entradilla ? <p className={`${estilos.entradilla} texto-cuerpo`}>{entradilla}</p> : null}
      {pasos.length ? (
        <ol className={estilos.pasos}>
          {pasos.map((p, i) => (
            <li key={p.id ?? p.etiqueta} className={estilos.paso}>
              <span className={estilos.numero} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={estilos.etiqueta}>{p.etiqueta}</h3>
              <p className="texto-cuerpo">{p.texto}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {boton ? <BotonBloque boton={boton} className={estilos.boton} /> : null}
    </section>
  );
}
