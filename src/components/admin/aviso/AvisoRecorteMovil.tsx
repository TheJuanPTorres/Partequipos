"use client";

import { useFormFields } from "@payloadcms/ui";
import type { UIFieldClientProps } from "payload";

import { filaDeDiapositiva, tieneSubida } from "@/lib/panel/avisos";

import { Aviso } from "./Aviso";

/**
 * Aviso en vivo en una diapositiva del hero que tiene «Imagen de fondo» pero no
 * «Imagen de fondo para móvil». Sin ese recorte, en un teléfono en vertical
 * el fondo cubre todo el alto del hero y se pide la foto de escritorio a 3840
 * px. Pasó en el sitio publicado el 2026-10-14: 320 KiB en la primera
 * diapositiva y un LCP de 7 s en móvil (con recorte, ~3 s; CLAUDE.md §10.36).
 * En la primera es «aviso» (es lo primero que se pinta); en las demás,
 * «info». Campo `ui`: no guarda nada (F4, decisiones-panel.md §22).
 */
export default function AvisoRecorteMovil({ path }: UIFieldClientProps) {
  const fila = filaDeDiapositiva(path);
  const prefijo = fila?.prefijo ?? "";
  const fondo = useFormFields(([campos]) => campos?.[`${prefijo}.imagenFondo`]?.value);
  const movil = useFormFields(([campos]) => campos?.[`${prefijo}.imagenFondoMovil`]?.value);

  if (!fila || !tieneSubida(fondo) || tieneSubida(movil)) return null;
  if (fila.indice === 0) {
    return (
      <Aviso titulo="La primera diapositiva no tiene imagen para móvil." tono="aviso">
        <p>
          En los teléfonos se descarga la foto de escritorio en grande, y es lo primero que se ve:
          la portada tarda mucho más en cargar. Sube abajo un recorte vertical de la misma foto (por
          ejemplo, 1080 × 1620).
        </p>
      </Aviso>
    );
  }
  return (
    <Aviso titulo="Esta diapositiva no tiene imagen para móvil." tono="info">
      <p>
        En los teléfonos se descarga la foto de escritorio en grande. Para que pese menos, sube
        abajo un recorte vertical de la misma foto (por ejemplo, 1080 × 1620).
      </p>
    </Aviso>
  );
}
