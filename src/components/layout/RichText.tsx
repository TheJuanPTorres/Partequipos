import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

/**
 * Renderiza el contenido richText de Payload (Lexical).
 *
 * Envuelve el renderizador oficial para tener un único punto donde aplicar los
 * estilos tipográficos del contenido editorial. El estilo es deliberadamente
 * sobrio: el diseño definitivo se aplicará encima.
 */
export function RichText({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;

  return (
    <div className="max-w-2xl space-y-4 text-gray-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-gray-900 [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-gray-900 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
      <LexicalRichText data={data as SerializedEditorState} />
    </div>
  );
}
