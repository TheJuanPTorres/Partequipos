import Image from "next/image";
import {
  type JSXConvertersFunction,
  RichText as LexicalRichText,
} from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import type { Media } from "@/payload-types";

/*
 * Ancho máximo del texto (`max-w-2xl`, 672 px): las imágenes del cuerpo nunca
 * se pintan más anchas, así que `sizes` no pide más que eso.
 */
const SIZES_CUERPO = "(min-width: 704px) 672px, calc(100vw - 32px)";

/**
 * Las imágenes del cuerpo con `next/image` (formato y ancho a medida, carga
 * diferida) en vez del `<img>` del original de Payload. `width` y `height`
 * reservan la caja, así que no hay CLS; `max-w-full h-auto` las encoge sin
 * deformarlas y no estira las que son más estrechas que el texto.
 */
const convertidores: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
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
    return (
      <Image
        src={media.url}
        alt={media.alt || ""}
        width={media.width}
        height={media.height}
        sizes={SIZES_CUERPO}
        className="h-auto max-w-full rounded-lg"
      />
    );
  },
});

/**
 * Texto enriquecido del panel. Arreglo mínimo de la plantilla (2026-10-06),
 * sin rediseño: espacio entre bloques, títulos por encima del texto e imágenes
 * con `next/image`; las URL largas escritas como texto se parten en vez de
 * desbordar. Sin el contenedor de Payload, para que el espaciado llegue
 * a los párrafos, que de otro modo quedan un nivel más abajo.
 */
export function RichText({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;
  return (
    <div className="max-w-2xl space-y-4 leading-relaxed break-words text-gray-700 [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:leading-snug [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:leading-snug [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-gray-900 [&_li]:ml-5 [&_li+li]:mt-1 [&_ol]:list-decimal [&_ul]:list-disc">
      <LexicalRichText
        data={data as SerializedEditorState}
        converters={convertidores}
        disableContainer
      />
    </div>
  );
}
