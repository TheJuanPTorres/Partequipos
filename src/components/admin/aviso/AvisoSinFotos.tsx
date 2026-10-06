"use client";

import { useFormFields } from "@payloadcms/ui";

import { cuantasFilas } from "@/lib/panel/avisos";

import { Aviso } from "./Aviso";

/**
 * Aviso en vivo arriba de la ficha (equipos nuevos y usados, modelos de
 * repuesto) cuando la galería `imagenes` está vacía: en el sitio la ficha sale
 * sin foto. Campo `ui`: no guarda nada (F4, decisiones-panel.md §22).
 */
export default function AvisoSinFotos() {
  const valor = useFormFields(([campos]) => campos?.imagenes?.value);
  if (cuantasFilas(valor) > 0) return null;
  return (
    <Aviso titulo="Esta ficha no tiene fotos." tono="aviso">
      <p>En el sitio sale sin imagen. Añade al menos una foto a la galería.</p>
    </Aviso>
  );
}
