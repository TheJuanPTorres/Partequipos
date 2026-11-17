"use client";

import { useFormFields } from "@payloadcms/ui";
import { useEffect, useState } from "react";

import { AVISO_EQUIPOS_NO_PUBLICADOS, normalizarEnlaceExterno } from "@/lib/nueva/enlaceExterno";

import { Aviso } from "./Aviso";

/**
 * Aviso en vivo (#475, dirección 2026-11-17) en una marca de maquinaria nueva con «Enlace externo»
 * y en sus equipos nuevos: esos equipos no salen en la web (`DE_MARCA_CON_PAGINA` en
 * `conEquipoVisible`). En la marca lee el campo del formulario; en el equipo, el de su marca, con
 * la sesión del panel. Campo `ui`: no cambia el esquema.
 */
export default function AvisoMarcaEnlaceExterno() {
  // En la marca existe el campo «Enlace externo»; en el equipo, no (se lee el de su marca).
  const enMarca = useFormFields(([campos]) => Boolean(campos && "enlaceExterno" in campos));
  const enlaceDeLaMarca = useFormFields(([campos]) => campos?.enlaceExterno?.value);
  const marca = useFormFields(([campos]) => campos?.marca?.value);
  const idMarca =
    !enMarca && (typeof marca === "number" || typeof marca === "string") ? String(marca) : null;
  const [leido, setLeido] = useState<{ id: string; enlace: string | null } | null>(null);

  useEffect(() => {
    if (idMarca === null) return;
    let vigente = true;
    fetch(`/api/marcas-maquinaria/${idMarca}/?depth=0&select[enlaceExterno]=true`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: { enlaceExterno?: string | null } | null) => {
        if (vigente) setLeido({ id: idMarca, enlace: doc?.enlaceExterno ?? null });
      })
      .catch(() => {
        if (vigente) setLeido({ id: idMarca, enlace: null });
      });
    return () => {
      vigente = false;
    };
  }, [idMarca]);

  const enlace = enMarca
    ? (enlaceDeLaMarca as string | null | undefined)
    : leido && leido.id === idMarca
      ? leido.enlace
      : null;
  if (!normalizarEnlaceExterno(enlace)) return null;
  return (
    <Aviso titulo={`${AVISO_EQUIPOS_NO_PUBLICADOS}.`} tono="aviso">
      <p>
        Sus equipos nuevos no aparecen en los listados, el buscador, el menú, la portada ni el
        sitemap, y sus fichas no existen en la web. Vacía el «Enlace externo» de la marca para
        volver a publicarlos.
      </p>
    </Aviso>
  );
}
