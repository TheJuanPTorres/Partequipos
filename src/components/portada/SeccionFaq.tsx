import { IconMessageQuestion } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Pregunta } from "@/lib/portada/seccionesH";
import { buildFaqJsonLd } from "@/lib/seo/jsonLd";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./faq.module.css";

/**
 * SECCIÓN 11 DE LA PORTADA — preguntas frecuentes (ux-9).
 *
 * Componente de SERVIDOR: el acordeón es `<details>` nativo con `name`
 * compartido, así que al abrir una se cierra la anterior sin JavaScript, como
 * el widget de ux-9. Todas empiezan cerradas, como en ux-9.
 *
 * Lo que se aparta (docs/diseno/decisiones-home-ux9.md §20):
 * - D1: el título de cada pregunta va en el `<summary>`, no en un `<div>`.
 * - D6: icono de Tabler (en ux-9, un SVG del kit) y +/− dibujados con CSS (en
 *   ux-9, Font Awesome).
 * - JSON-LD `FAQPage` con las mismas preguntas.
 */
export type TextosFaq = { titulo: string; intro: string; botonTexto: string; botonEnlace: string };

type Props = { preguntas: Pregunta[]; imagen: ImagenLista | null; textos: TextosFaq };

export function SeccionFaq({ preguntas, imagen, textos }: Props) {
  if (preguntas.length === 0) return null;
  const jsonLd = buildFaqJsonLd(preguntas);
  return (
    <section className={estilos.seccion} aria-labelledby="portada-faq-titulo">
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      {imagen ? (
        <Image
          src={imagen.url}
          alt=""
          width={imagen.width}
          height={imagen.height}
          sizes="64vw"
          className={estilos.maquina}
        />
      ) : null}
      <div className={estilos.fila}>
        <div className={estilos.izq}>
          {textos.titulo ? (
            <Revelado
              adelanto={ADELANTOS.bajo}
              como="h2"
              id="portada-faq-titulo"
              texto={textos.titulo}
              ritmo="titulo"
              curva="back.out"
              disparo={0.85}
              className={`${estilos.titulo} texto-titulo-seccion`}
            />
          ) : null}
          {textos.intro ? <p className={`${estilos.intro} texto-cuerpo`}>{textos.intro}</p> : null}
          {textos.botonTexto && textos.botonEnlace ? (
            <div>
              <Link href={textos.botonEnlace} className={`${estilos.boton} texto-etiqueta`}>
                {textos.botonTexto}
              </Link>
            </div>
          ) : null}
        </div>
        <div className={estilos.der}>
          {preguntas.map((p) => (
            <details key={p.id} name="portada-faq" className={estilos.item}>
              <summary className={estilos.cabecera}>
                <span className={estilos.icono} aria-hidden="true">
                  <IconMessageQuestion focusable="false" stroke={1.75} />
                </span>
                <span className={`${estilos.pregunta} texto-destacado`}>{p.pregunta}</span>
                <span className={estilos.indicador} aria-hidden="true" />
              </summary>
              <div className={`${estilos.respuesta} texto-cuerpo`}>{p.respuesta}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
