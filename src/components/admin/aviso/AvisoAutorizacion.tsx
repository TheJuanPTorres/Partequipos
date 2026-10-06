"use client";

import { useFormFields } from "@payloadcms/ui";

import { Aviso } from "./Aviso";

/**
 * Ayuda junto a «Publicado» en los testimonios: sin la autorización firmada no
 * se puede publicar (lo valida `validarPublicacionTestimonio`), y antes solo se
 * sabía al guardar, por el error. Desaparece en cuanto se marca. Campo `ui` (F4).
 */
export default function AvisoAutorizacion() {
  const autorizado = useFormFields(([campos]) => campos?.autorizacionUso?.value);
  if (autorizado === true) return null;
  return (
    <Aviso tono="aviso">
      <p>
        Para publicarlo, primero marca en «Autorización de uso» que tienes la autorización firmada
        de la persona.
      </p>
    </Aviso>
  );
}
