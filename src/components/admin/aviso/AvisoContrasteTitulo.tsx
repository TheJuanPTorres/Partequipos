"use client";

import { useFormFields } from "@payloadcms/ui";
import type { UIFieldClientProps } from "payload";
import { useEffect, useState } from "react";

import { CONTRASTE_MINIMO, peorContraste, rgbDeHex, zonaDelTitulo } from "@/lib/portada/contraste";

import { Aviso } from "./Aviso";

/** Ancho de la miniatura con la que se estima (sobra para una media por zonas). */
const ANCHO_MUESTRA = 128;

type Muestra = { pixeles: Uint8ClampedArray; ancho: number; alto: number };

/** Id de un campo de subida, sea número, texto o el documento poblado. */
function idDeSubida(v: unknown): string | null {
  if (typeof v === "number" || (typeof v === "string" && v.trim())) return String(v);
  if (v && typeof v === "object" && "id" in v) return String((v as { id: unknown }).id);
  return null;
}

/**
 * Miniatura de la foto, leída en un `<canvas>`. Por el optimizador de
 * imágenes del propio sitio (`/_next/image`), que es del mismo origen que el
 * panel: así el navegador deja leer sus píxeles sin pedirle nada al Blob.
 */
async function muestraDeMedia(id: string, senal: AbortSignal): Promise<Muestra | null> {
  const r = await fetch(`/api/media/${encodeURIComponent(id)}?depth=0`, {
    credentials: "include",
    signal: senal,
  });
  if (!r.ok) return null;
  const { url } = (await r.json()) as { url?: string };
  if (!url) return null;
  const img = new Image();
  img.decoding = "async";
  img.src = `/_next/image?url=${encodeURIComponent(url)}&w=${ANCHO_MUESTRA}&q=50`;
  await img.decode();
  if (senal.aborted || !img.naturalWidth) return null;
  const lienzo = document.createElement("canvas");
  lienzo.width = img.naturalWidth;
  lienzo.height = img.naturalHeight;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  return { pixeles: data, ancho: lienzo.width, alto: lienzo.height };
}

/**
 * AVISO DE CONTRASTE del título del hero (2026-10-17): si se elige un color y,
 * sobre la foto de fondo y su velo, puede quedar por debajo de 3:1 (el mínimo
 * de WCAG para texto grande) en la zona del título, lo dice. NO BLOQUEA: es
 * una estimación con una miniatura (`src/lib/portada/contraste.ts`). Mira la
 * foto de escritorio con la posición de escritorio y, si hay recorte para
 * móvil, también ese con la de móvil. Campo `ui`: no guarda nada.
 */
export default function AvisoContrasteTitulo({ path }: UIFieldClientProps) {
  const m = /^(.*\bdiapositivas\.\d+)\.tipografia\.[^.]+$/.exec(path);
  const fila = m?.[1] ?? "";
  const grupo = `${fila}.tipografia`;
  const color = useFormFields(([c]) => c?.[`${grupo}.color`]?.value);
  const fondo = useFormFields(([c]) => c?.[`${fila}.imagenFondo`]?.value);
  const movil = useFormFields(([c]) => c?.[`${fila}.imagenFondoMovil`]?.value);
  const xe = useFormFields(([c]) => c?.[`${grupo}.posicionXEscritorio`]?.value);
  const ye = useFormFields(([c]) => c?.[`${grupo}.posicionYEscritorio`]?.value);
  const xm = useFormFields(([c]) => c?.[`${grupo}.posicionXMovil`]?.value);
  const ym = useFormFields(([c]) => c?.[`${grupo}.posicionYMovil`]?.value);

  const idFondo = idDeSubida(fondo);
  const idMovil = idDeSubida(movil);
  const [muestras, setMuestras] = useState<{ fondo: Muestra | null; movil: Muestra | null }>({
    fondo: null,
    movil: null,
  });

  useEffect(() => {
    const control = new AbortController();
    Promise.all([
      idFondo ? muestraDeMedia(idFondo, control.signal).catch(() => null) : null,
      idMovil ? muestraDeMedia(idMovil, control.signal).catch(() => null) : null,
    ]).then(([f, mv]) => {
      if (!control.signal.aborted) setMuestras({ fondo: f, movil: mv });
    });
    return () => control.abort();
  }, [idFondo, idMovil]);

  const rgb = typeof color === "string" ? rgbDeHex(color) : null;
  if (!m || !rgb) return null;

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const casos = [
    { muestra: muestras.fondo, zona: zonaDelTitulo(num(xe), num(ye)), donde: "en escritorio" },
    { muestra: muestras.movil, zona: zonaDelTitulo(num(xm), num(ym)), donde: "en móvil" },
  ].flatMap(({ muestra, zona, donde }) => {
    if (!muestra) return [];
    const c = peorContraste(muestra.pixeles, muestra.ancho, muestra.alto, zona, rgb);
    return c !== null && c < CONTRASTE_MINIMO ? [{ c, donde }] : [];
  });
  if (casos.length === 0) return null;

  const peor = casos.reduce((a, b) => (a.c < b.c ? a : b));
  return (
    <Aviso titulo="El título puede leerse mal sobre esta foto." tono="aviso" rol="estado">
      <p>
        Con este color, en la zona del título el contraste con la foto puede bajar a{" "}
        {peor.c.toFixed(1).replace(".", ",")}:1 {casos.map((x) => x.donde).join(" y ")} (lo mínimo
        recomendable para un título es 3:1). Prueba un color más claro u oscuro, u otra posición. Es
        una estimación: no impide guardar.
      </p>
    </Aviso>
  );
}
