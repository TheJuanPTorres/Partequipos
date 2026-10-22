import Image from "next/image";
import {
  type JSXConvertersFunction,
  RichText as LexicalRichText,
} from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { createElement } from "react";

import { convertidores } from "@/components/layout/RichText";
import { idsUnicos } from "@/lib/blog/titulos";
import type { Media } from "@/payload-types";

import estilos from "./articuloPropio.module.css";

type NodoTexto = { text?: string; children?: NodoTexto[] };
function textoDe(n: NodoTexto): string {
  if (typeof n.text === "string") return n.text;
  return (n.children ?? []).map(textoDe).join("");
}

/** Los alt que escribió el importador del blog («Ilustración: …») no valen de pie de foto. */
function pieDeFoto(alt: string | null | undefined): string | null {
  const texto = alt?.trim();
  if (!texto || texto.length < 5 || /^ilustraci[oó]n/i.test(texto)) return null;
  return texto;
}

/**
 * El cuerpo del artículo con el diseño propio (2026-10-21). Mismo contenido que
 * el `RichText` de siempre, con tres diferencias:
 * - cada h2 y h3 lleva su ancla (`id`), la misma que lista el índice fijo
 *   (`titulosDeLexical`: mismo orden, mismos ids);
 * - las tablas van en una región con desplazamiento propio y accesible por
 *   teclado, para que en móvil no ensanchen la página;
 * - las imágenes van en `<figure>` y, si el texto alternativo describe algo, con
 *   su pie visible.
 */
export function CuerpoArticulo({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;

  const convertidoresArticulo: JSXConvertersFunction = (args) => {
    const base = convertidores(args);
    // Los ids se reparten en el orden en que se pintan los títulos.
    const textos: string[] = [];
    const raiz = (
      data as { root?: NodoTexto & { children?: (NodoTexto & { type?: string; tag?: string })[] } }
    ).root;
    const recoger = (n: NodoTexto & { type?: string; tag?: string }) => {
      if (n.type === "heading" && (n.tag === "h2" || n.tag === "h3")) {
        const t = textoDe(n).replace(/\s+/g, " ").trim();
        if (t) textos.push(t);
      }
      (n.children as (NodoTexto & { type?: string; tag?: string })[] | undefined)?.forEach(recoger);
    };
    if (raiz) recoger(raiz);
    const ids = idsUnicos(textos);
    let siguiente = 0;

    return {
      ...base,
      heading: ({ node, nodesToJSX }) => {
        const etiqueta = (node as { tag: string }).tag;
        const hijos = nodesToJSX({ nodes: node.children });
        const t = textoDe(node as NodoTexto)
          .replace(/\s+/g, " ")
          .trim();
        const id = (etiqueta === "h2" || etiqueta === "h3") && t ? ids[siguiente++] : undefined;
        return createElement(etiqueta, { id }, hijos);
      },
      table: ({ node, nodesToJSX }) => (
        <div
          className={estilos.tabla}
          role="region"
          tabIndex={0}
          aria-label="Tabla (se desplaza de lado en pantallas estrechas)"
        >
          <table className="lexical-table">
            <tbody>{nodesToJSX({ nodes: node.children })}</tbody>
          </table>
        </div>
      ),
      upload: ({ node }) => {
        const doc = (node as { value?: unknown }).value;
        if (!doc || typeof doc !== "object") return null;
        const media = doc as Media;
        if (!media.url) return null;
        if (!media.mimeType?.startsWith("image") || !media.width || !media.height) {
          return (
            <a href={media.url} rel="noopener noreferrer">
              {media.filename}
            </a>
          );
        }
        const pie = pieDeFoto(media.alt);
        return (
          <figure className={estilos.figura}>
            <Image
              src={media.url}
              alt={pie ? "" : (media.alt ?? "")}
              width={media.width}
              height={media.height}
              sizes="(min-width: 1025px) 720px, calc(100vw - 40px)"
              className={estilos.imagenCuerpo}
            />
            {pie ? <figcaption>{pie}</figcaption> : null}
          </figure>
        );
      },
    };
  };

  return (
    <div className={estilos.cuerpo}>
      <LexicalRichText
        data={data as SerializedEditorState}
        converters={convertidoresArticulo}
        disableContainer
      />
    </div>
  );
}
