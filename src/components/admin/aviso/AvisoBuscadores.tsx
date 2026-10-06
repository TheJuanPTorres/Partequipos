import { indexacionPermitida } from "@/lib/seo/config";

import { Aviso } from "./Aviso";

/**
 * Aviso arriba de «SEO y datos de la empresa» mientras el sitio esté cerrado a
 * buscadores (CLAUDE.md §10.6, `NEXT_PUBLIC_PERMITIR_INDEXACION`). Sin él, quien
 * edita títulos y descripciones esperaría verlos en Google ya. Desaparece solo
 * el día que se abra el sitio. Campo `ui` de servidor (F4).
 */
export default function AvisoBuscadores() {
  if (indexacionPermitida()) return null;
  return (
    <Aviso titulo="El sitio todavía está cerrado a buscadores." tono="info">
      <p>
        Lo que cambies aquí ya se usa en las páginas, pero Google no las muestra hasta el día del
        lanzamiento.
      </p>
    </Aviso>
  );
}
