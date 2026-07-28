import type { JsonLdObject } from "@/lib/seo/jsonLd";

/**
 * Inyecta un bloque `<script type="application/ld+json">`.
 *
 * Server Component: los datos estructurados deben estar en el HTML de origen
 * para que los rastreadores los vean (CLAUDE.md §3.1 y §3.4).
 *
 * Seguridad: se escapa `<` como `<`. Así, aunque un texto del CMS
 * contenga `</script>`, no puede cerrar la etiqueta ni inyectar marcado.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // El contenido es JSON serializado y escapado, nunca marcado del usuario.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
