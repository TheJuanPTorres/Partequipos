import { IconBrandWhatsapp, IconMail } from "@tabler/icons-react";
import Image from "next/image";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { EngranajeMarca } from "@/components/ficha/EngranajeMarca";
import estilos from "@/components/ficha/ficha.module.css";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { ImagenLista } from "@/lib/utils/relations";

/**
 * «CONTÁCTANOS PARA RECIBIR ASESORÍA» de las fichas (ux-9): el recuadro gris con
 * el título, «Contáctanos» (abre el formulario en una ventana emergente) y
 * «WhatsApp», y la foto del global «Ficha de producto». Lo comparten la ficha
 * V2 (usada) y la ficha de maquinaria nueva de Andrés (2026-10-21); el `<h2>`
 * lleva el id `asesoria`, al que apunta la sección que lo envuelve.
 */
export function RecuadroAsesoria({
  formulario,
  hrefFormulario,
  experto,
  imagenContacto,
  contactoEsFoto,
}: {
  formulario: ConfigFormulario;
  /** Destino de «Contáctanos» sin JavaScript: el formulario de la página. */
  hrefFormulario: string;
  experto?: { href: string } | null;
  imagenContacto: ImagenLista | null;
  /** Un PNG es el recorte de ux-9 (sobresale del recuadro); otra cosa, una foto que lo llena. */
  contactoEsFoto: boolean;
}) {
  return (
    <div className={estilos.recuadroContacto}>
      <div className={estilos.textoContacto}>
        <h2 id="asesoria" className={`${estilos.tituloContacto} texto-titulo-seccion`}>
          Contáctanos para recibir asesoría
        </h2>
        <div className={estilos.botonesContacto}>
          <BotonFormulario
            href={hrefFormulario}
            className={`${estilos.boton} texto-etiqueta`}
            formulario={formulario}
          >
            <IconMail aria-hidden="true" stroke={1.75} />
            Contáctanos
          </BotonFormulario>
          {experto ? (
            <a
              href={experto.href}
              className={`${estilos.boton} texto-etiqueta`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
              WhatsApp<span className="sr-only"> (abre WhatsApp)</span>
            </a>
          ) : null}
        </div>
      </div>
      {imagenContacto && contactoEsFoto ? (
        <div className={`${estilos.imagenContacto} ${estilos.imagenContactoFoto}`}>
          <Image
            src={imagenContacto.url}
            alt=""
            width={imagenContacto.width}
            height={imagenContacto.height}
            sizes="(min-width: 768px) 46vw, 90vw"
            className={estilos.fotoContactoLlena}
            style={{ objectPosition: imagenContacto.posicion }}
          />
        </div>
      ) : (
        <div className={estilos.imagenContacto}>
          <EngranajeMarca className={estilos.engranaje} />
          {imagenContacto ? (
            <Image
              src={imagenContacto.url}
              alt=""
              width={imagenContacto.width}
              height={imagenContacto.height}
              sizes="(min-width: 1025px) 430px, (min-width: 768px) 305px, 210px"
              className={estilos.fotoContacto}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
