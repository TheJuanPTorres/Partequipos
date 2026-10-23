"use client";

import { TextareaField, TextField, useConfig, useFormFields } from "@payloadcms/ui";
import type { TextareaFieldClientProps, TextFieldClientProps } from "payload";
import { useEffect, useState } from "react";

import { esDeAditamentos } from "@/lib/usados/aditamentos";

/** Dirección web de cada categoría ya consultada, para no repetir la petición. */
const slugPorId = new Map<number, string | null>();

const idDe = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && "id" in v && typeof v.id === "number"
      ? v.id
      : null;

/**
 * «Serial» y «Descripción corta» de un equipo usado: el campo de siempre, pero
 * SOLO si la categoría elegida es Aditamentos (2026-10-23, dirección). La
 * condición de Payload no puede, porque el formulario solo tiene el id de la
 * categoría: se pide su dirección web a la API con la sesión del panel.
 * Cambiar de categoría lo muestra u oculta en vivo; lo escrito no se borra (el
 * sitio solo lo pinta en Aditamentos, `camposDeAditamento`).
 */
export default function CampoSoloAditamentos(
  props: TextFieldClientProps | TextareaFieldClientProps,
) {
  const categoria = idDe(useFormFields(([campos]) => campos?.categoria?.value));
  const { config } = useConfig();
  // Cambia solo para volver a pintar cuando llega una respuesta; los datos están en `slugPorId`.
  const [, setRespuestas] = useState(0);
  const slug = categoria === null ? null : (slugPorId.get(categoria) ?? null);

  useEffect(() => {
    if (categoria === null || slugPorId.has(categoria)) return;
    const control = new AbortController();
    fetch(`${config.serverURL}${config.routes.api}/categorias-usada/${categoria}?depth=0`, {
      credentials: "include",
      signal: control.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: { slug?: unknown } | null) => {
        slugPorId.set(categoria, typeof doc?.slug === "string" ? doc.slug : null);
        setRespuestas((n) => n + 1);
      })
      .catch(() => {});
    return () => control.abort();
  }, [categoria, config.serverURL, config.routes.api]);

  if (!esDeAditamentos(slug)) return null;
  return props.field.type === "textarea" ? (
    <TextareaField {...(props as TextareaFieldClientProps)} />
  ) : (
    <TextField {...(props as TextFieldClientProps)} />
  );
}
