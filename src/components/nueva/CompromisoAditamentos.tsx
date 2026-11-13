import Image from "next/image";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./compromisoAditamentos.module.css";

/**
 * «NUESTRO COMPROMISO…» DE LA PÁGINA DE ADITAMENTOS (dirección, 2026-11-13): a DOBLE COLUMNA, el
 * texto a la izquierda y la foto a la derecha (la de WordPress, editable en la marca: «Nuestro
 * compromiso»: foto). Sin foto, el texto ocupa la tarjeta. En móvil, apilado: texto y foto debajo.
 *
 * Componente de SERVIDOR. Sustituye al `PorQueElegirnos` de repuestos en esta página: aquel lleva
 * la foto a la izquierda y con velo, y es de la zona de repuestos.
 */
export function CompromisoAditamentos({
  id,
  titulo,
  entradilla,
  texto,
  boton,
  imagen,
  anclaContacto,
  formulario,
}: {
  id: string;
  titulo: string;
  entradilla: string;
  texto: string;
  boton: string;
  imagen: ImagenLista | null;
  anclaContacto: string;
  /** El formulario de contacto de la página: el botón lo abre en una ventana. */
  formulario: ConfigFormulario;
}) {
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.tarjeta} data-con-foto={imagen ? "" : undefined}>
        <div className={estilos.texto}>
          <h2 id={idTitulo} className={`${estilos.titulo} texto-titulo-seccion`}>
            {titulo}
          </h2>
          {entradilla ? (
            <p className={`${estilos.entradilla} texto-cuerpo`}>
              <strong>{entradilla}</strong>
            </p>
          ) : null}
          {texto ? <p className="texto-cuerpo">{texto}</p> : null}
          {boton ? (
            <BotonFormulario
              href={`#${anclaContacto}`}
              className={`${estilos.boton} texto-etiqueta`}
              formulario={formulario}
            >
              {boton}
            </BotonFormulario>
          ) : null}
        </div>
        {imagen ? (
          <div className={estilos.foto}>
            <Image
              src={imagen.url}
              alt={imagen.alt}
              width={imagen.width}
              height={imagen.height}
              sizes="(max-width: 767px) 92vw, (max-width: 1680px) 45vw, 760px"
              className={estilos.fotoImg}
              style={{ objectPosition: imagen.posicion }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
