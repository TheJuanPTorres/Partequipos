import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react";
import Image from "next/image";

import { Revelado } from "@/components/movimiento/Revelado";
import type { VistaPresentacionImagen as Datos } from "@/lib/bloques/vista";

import { AnimacionLottie } from "./AnimacionLottie";
import { BotonBloque } from "./BotonBloque";
import estilos from "./presentacionImagen.module.css";

/** ux-9: los dos títulos de este bloque van más rápidos que el ritmo por defecto. */
const RITMO = { escalon: 0.08, duracion: 0.75 } as const;

const SIZES = "(max-width: 767px) 92vw, 455px";

/**
 * BLOQUE «PRESENTACIÓN CON IMAGEN» — imagen a un lado, antetítulo, título,
 * texto y botón al otro (Nosotros de ux-9, contenedor `acca276`). Componente
 * de SERVIDOR.
 *
 * En ux-9 la imagen es una animación Lottie del mapa de sedes. Aquí, si el
 * bloque tiene animación, se reproduce encima de la imagen fija (su último
 * fotograma) con `AnimacionLottie`, que solo se carga en el navegador al
 * acercarse; la imagen queda para movimiento reducido, fallos y lectores de
 * pantalla (decisiones-nosotros.md §4). Sin animación, la imagen sola, como
 * antes. Como transmite información (las sedes), lleva texto alternativo: NO
 * es decorativa.
 *
 * D1: el antetítulo es un `<p>` (en ux-9, un `<h2>` más).
 */
export function BloquePresentacionImagen({
  imagen,
  animacion,
  antetitulo,
  titulo,
  texto,
  boton,
}: Datos) {
  return (
    <section className={estilos.seccion}>
      <div className={estilos.columnaImagen}>
        {animacion ? (
          <AnimacionLottie
            src={animacion.url}
            proporcion={imagen ? imagen.width / imagen.height : animacion.ancho / animacion.alto}
            que="la animación del mapa"
          >
            {imagen ? (
              <Image
                src={imagen.url}
                alt={imagen.alt}
                width={imagen.width}
                height={imagen.height}
                sizes={SIZES}
                className={estilos.imagenEnCaja}
              />
            ) : null}
          </AnimacionLottie>
        ) : imagen ? (
          <Image
            src={imagen.url}
            alt={imagen.alt}
            width={imagen.width}
            height={imagen.height}
            sizes={SIZES}
            className={estilos.imagen}
          />
        ) : null}
      </div>
      <div className={estilos.columnaTexto}>
        {antetitulo ? (
          <Revelado
            como="p"
            texto={antetitulo}
            {...RITMO}
            className={`${estilos.antetitulo} texto-destacado-negrita`}
          />
        ) : null}
        <Revelado
          como="h2"
          texto={titulo}
          {...RITMO}
          className={`${estilos.titulo} texto-titulo-seccion`}
        />
        {texto ? (
          <div className={`${estilos.texto} texto-cuerpo`}>
            <LexicalRichText data={texto} />
          </div>
        ) : null}
        {boton ? <BotonBloque boton={boton} /> : null}
      </div>
    </section>
  );
}
