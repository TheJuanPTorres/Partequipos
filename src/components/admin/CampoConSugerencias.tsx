"use client";

import { TextField, useDocumentInfo, useField, useFormFields } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";
import { useEffect, useState } from "react";

import { valoresSugeridos } from "@/lib/panel/fichaProducto";

const idDe = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && "id" in v && typeof v.id === "number"
      ? v.id
      : null;

type Props = TextFieldClientProps & {
  /** Campo de la misma ficha por el que se filtran las sugerencias (p. ej. «marca»). */
  filtro?: string;
  /** El texto delante de las sugerencias. */
  titulo?: string;
};

/**
 * Campo de texto con SUGERENCIAS (tanda 21, tarea 3, punto 7; fase 2): debajo, como botones, los
 * valores que ya llevan otras fichas de la misma colección con el mismo `filtro` (en nuevas, los
 * códigos de la marca elegida). Pulsar uno lo escribe; se puede escribir otro cualquiera. Sin
 * `filtro` elegido, no sugiere nada.
 *
 * Se configura en la colección con `admin.components.Field: { path, clientProps: { filtro, titulo } }`.
 */
export default function CampoConSugerencias(props: Props) {
  const { filtro = "marca", titulo = "Ya usados con esta marca:", ...campo } = props;
  const { collectionSlug, id } = useDocumentInfo();
  const nombre = campo.field.name;
  const valorFiltro = idDe(useFormFields(([campos]) => campos?.[filtro]?.value));
  const { value, setValue } = useField<string>({ path: campo.path });
  const [sugeridos, setSugeridos] = useState<{ clave: string; lista: string[] }>({
    clave: "",
    lista: [],
  });
  const clave = valorFiltro === null || !collectionSlug ? "" : `${collectionSlug}:${valorFiltro}`;

  useEffect(() => {
    if (!clave || !collectionSlug) return;
    const control = new AbortController();
    const q = new URLSearchParams({ depth: "0", limit: "200", [`select[${nombre}]`]: "true" });
    q.set(`where[${filtro}][equals]`, String(valorFiltro));
    if (id !== undefined && id !== null) q.set("where[id][not_equals]", String(id));
    fetch(`/api/${collectionSlug}?${q}`, { credentials: "include", signal: control.signal })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs?: Record<string, unknown>[] }) =>
        setSugeridos({
          clave,
          lista: valoresSugeridos((d.docs ?? []).map((x) => x[nombre])).slice(0, 12),
        }),
      )
      .catch(() => undefined);
    return () => control.abort();
  }, [clave, collectionSlug, filtro, id, nombre, valorFiltro]);

  const actual = (value ?? "").trim().toLowerCase();
  const lista = clave && sugeridos.clave === clave ? sugeridos.lista : [];
  const visibles = lista.filter((m) => m.toLowerCase() !== actual);

  return (
    <div className="pq-campo-modelo">
      <TextField {...campo} />
      {visibles.length > 0 ? (
        <div className="pq-sugerencias" role="group" aria-label={titulo.replace(/:$/, "")}>
          <span className="pq-sugerencias__titulo">{titulo}</span>
          {visibles.map((m) => (
            <button
              className="pq-sugerencias__opcion"
              key={m}
              onClick={() => setValue(m)}
              type="button"
            >
              {m}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
