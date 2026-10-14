import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import Image from "next/image";

import { DialogoYouTube } from "@/components/portada/DialogoYouTube";
import type { VistaVideoYoutube as Datos } from "@/lib/bloques/vista";

import estilos from "./videoYoutube.module.css";

/**
 * BLOQUE «VÍDEO DE YOUTUBE» — título y texto a un lado; al otro, la imagen de
 * portada con el botón de reproducir. Componente de SERVIDOR: el único trozo
 * de cliente es `DialogoYouTube`, el mismo de la portada (decisiones-home-ux9.md
 * §27.6). Nada de YouTube se carga hasta pulsar reproducir, y siempre desde
 * youtube-nocookie.com.
 */
export function BloqueVideoYoutube({ antetitulo, titulo, texto, video, miniatura }: Datos) {
  return (
    <section className={estilos.seccion}>
      <div className={estilos.columnaTexto}>
        {antetitulo ? (
          <p className={`${estilos.antetitulo} texto-destacado-negrita`}>{antetitulo}</p>
        ) : null}
        <h2 className={`${estilos.titulo} texto-titulo-seccion`}>{titulo}</h2>
        {texto ? (
          <div className={`${estilos.texto} texto-cuerpo`}>
            <LexicalRichText data={texto} />
          </div>
        ) : null}
      </div>
      <div className={estilos.columnaVideo}>
        <DialogoYouTube
          video={video}
          etiqueta={`Ver el vídeo: ${titulo}`}
          titulo={titulo}
          miniatura={miniatura}
          className={estilos.portada}
        >
          {miniatura ? (
            <Image
              src={miniatura.url}
              alt=""
              fill
              sizes="(max-width: 767px) 94vw, 47vw"
              className={estilos.imagen}
              style={{ objectPosition: miniatura.posicion }}
            />
          ) : null}
          <span className={estilos.play} aria-hidden="true">
            <IconPlayerPlayFilled focusable="false" />
          </span>
        </DialogoYouTube>
      </div>
    </section>
  );
}
