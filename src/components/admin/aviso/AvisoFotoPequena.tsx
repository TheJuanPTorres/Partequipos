"use client";

import { useFormFields } from "@payloadcms/ui";
import { useEffect, useMemo, useState } from "react";

import { ANCHO_MINIMO, fotosPequenas, idsDeSubida } from "@/lib/panel/fotoPequena";

import { Aviso } from "./Aviso";

type Props = { campos?: string[] };
type Medida = { id: number; filename?: string | null; width?: number | null };

/**
 * Aviso en vivo en la pestaña «Fotos» de una ficha (fase 2 del panel, 2026-11-18): si alguna foto
 * elegida tiene menos de 1.200 px de ancho, se verá borrosa en pantallas grandes. Lee las medidas
 * de «Imágenes» con la sesión del panel (la API ya no se lee sin sesión). Campo `ui`: no guarda
 * nada ni cambia el esquema. Los logos no cuentan (pueden ser vectoriales o pequeños a propósito).
 */
export default function AvisoFotoPequena({ campos = [] }: Props) {
  const valores = useFormFields(([estado]) =>
    campos.map((c) => JSON.stringify(estado?.[c]?.value ?? null)).join("|"),
  );
  const ids = useMemo(
    () => [...new Set(valores.split("|").flatMap((v) => idsDeSubida(JSON.parse(v || "null"))))],
    [valores],
  );
  const [pequenas, setPequenas] = useState<Medida[]>([]);

  useEffect(() => {
    if (ids.length === 0) {
      setPequenas([]);
      return;
    }
    const control = new AbortController();
    const consulta = new URLSearchParams({ depth: "0", limit: String(ids.length) });
    ids.forEach((id, i) => consulta.append(`where[id][in][${i}]`, String(id)));
    consulta.append("select[filename]", "true");
    consulta.append("select[width]", "true");
    fetch(`/api/media/?${consulta}`, { credentials: "include", signal: control.signal })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((r: { docs?: Medida[] }) => setPequenas(fotosPequenas(r.docs ?? [])))
      .catch(() => {});
    return () => control.abort();
  }, [ids]);

  if (pequenas.length === 0) return null;
  return (
    <Aviso
      titulo={
        pequenas.length === 1
          ? "Una foto es pequeña y se verá borrosa en pantallas grandes."
          : `${pequenas.length} fotos son pequeñas y se verán borrosas en pantallas grandes.`
      }
      tono="aviso"
    >
      <p>
        Tienen menos de {ANCHO_MINIMO.toLocaleString("es-CO")} px de ancho:{" "}
        {pequenas.map((p) => `${p.filename ?? `imagen ${p.id}`} (${p.width} px)`).join(", ")}. Si
        tienes el original, súbelo más grande.
      </p>
    </Aviso>
  );
}
