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
  const delCliente = useFormFields(([campos]) => campos?.videoDelCliente?.value);
  if (autorizado === true || delCliente === true) return null;
  return (
    <Aviso tono="aviso">
      <p>
        Para publicarlo, primero marca en «Autorización de uso» que tienes la autorización firmada
        de la persona (o, si es un vídeo que el cliente ya publicó en su canal, la casilla «Vídeo ya
        publicado por el cliente»).
      </p>
    </Aviso>
  );
}
