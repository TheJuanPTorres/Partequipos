"use client";

import { TextField, useField, useFormFields } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";
import { useEffect, useState } from "react";

import { modelosSugeridos } from "@/lib/panel/fichaUsada";

const idDe = (v: unknown): number | null =>
  typeof v === "number"
    ? v
    : v && typeof v === "object" && "id" in v && typeof v.id === "number"
      ? v.id
      : null;

/**
 * «Modelo» de una máquina usada con SUGERENCIAS de la marca elegida (tanda 21, tarea 3, punto 7;
 * PROTOTIPO, sin esquema). En usadas la marca es libre y el modelo es texto, así que no hay lista
 * que filtrar: se sugieren los modelos que ya llevan otras unidades de esa marca, como botones
 * debajo del campo. Pulsar uno lo escribe; se puede escribir otro cualquiera.
 */
export default function CampoModeloUsada(props: TextFieldClientProps) {
  const marca = idDe(useFormFields(([campos]) => campos?.marcaUsada?.value));
  const { value, setValue } = useField<string>({ path: props.path });
  const [sugeridos, setSugeridos] = useState<{ marca: number | null; lista: string[] }>({
    marca: null,
    lista: [],
  });

  useEffect(() => {
    if (marca === null) return;
    const control = new AbortController();
    const q = new URLSearchParams({ depth: "0", limit: "200", "select[modelo]": "true" });
    q.set("where[marcaUsada][equals]", String(marca));
    fetch(`/api/equipos-usados?${q}`, { credentials: "include", signal: control.signal })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs?: { modelo?: unknown }[] }) =>
        setSugeridos({
          marca,
          lista: modelosSugeridos((d.docs ?? []).map((x) => x.modelo)).slice(0, 12),
        }),
      )
      .catch(() => undefined);
    return () => control.abort();
  }, [marca]);

  const actual = (value ?? "").trim().toLowerCase();
  const lista = marca !== null && sugeridos.marca === marca ? sugeridos.lista : [];
  const visibles = lista.filter((m) => m.toLowerCase() !== actual);

  return (
    <div className="pq-campo-modelo">
      <TextField {...props} />
      {visibles.length > 0 ? (
        <div className="pq-sugerencias" role="group" aria-label="Modelos ya usados con esta marca">
          <span className="pq-sugerencias__titulo">Ya usados con esta marca:</span>
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
