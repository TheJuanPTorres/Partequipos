"use client";

import { useFormFields } from "@payloadcms/ui";

import { Aviso } from "./Aviso";

/**
 * Aviso en vivo arriba de un equipo usado con «Disponible» desmarcado: no sale
 * en su categoría ni en la portada (las consultas del sitio filtran por
 * `disponible`, `src/lib/queries/getMaquinaria.ts`). Campo `ui` (F4).
 */
export default function AvisoNoDisponible() {
  const disponible = useFormFields(([campos]) => campos?.disponible?.value);
  if (disponible !== false) return null;
  return (
    <Aviso titulo="Este equipo no sale en el sitio." tono="info">
      <p>
        Mientras «Disponible» esté desmarcado, no aparece en su categoría ni en la portada. Márcalo
        de nuevo para volver a mostrarlo.
      </p>
    </Aviso>
  );
}
