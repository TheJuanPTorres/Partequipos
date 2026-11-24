"use client";

import { toast } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import type { DefaultCellComponentProps } from "payload";
import { useState } from "react";

/**
 * Interruptor DIRECTO en la lista (tanda 21, tarea 3, punto 2): cambia una casilla de la fila sin
 * abrir la ficha. Guarda con la API REST del propio panel, con la sesión del editor (el control de
 * acceso es el de siempre), y refresca la lista para que el estado de la fila cambie a la vez.
 *
 * Sin valor cuenta como marcado, como en el resto del panel.
 */
export default function CeldaInterruptor({
  cellData,
  rowData,
  field,
  collectionSlug,
}: DefaultCellComponentProps) {
  const router = useRouter();
  const nombre = "name" in field ? field.name : "";
  const etiqueta = "label" in field && typeof field.label === "string" ? field.label : nombre;
  const id = (rowData as { id?: unknown } | undefined)?.id;
  const nombreFila = String((rowData as { nombre?: unknown } | undefined)?.nombre ?? "");
  const [valor, setValor] = useState(cellData !== false);
  const [guardando, setGuardando] = useState(false);

  async function cambiar() {
    if (guardando || (typeof id !== "number" && typeof id !== "string")) return;
    const nuevo = !valor;
    setValor(nuevo);
    setGuardando(true);
    try {
      const r = await fetch(`/api/${collectionSlug}/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [nombre]: nuevo }),
      });
      if (!r.ok) throw new Error(String(r.status));
      toast.success(`${etiqueta}: ${nuevo ? "sí" : "no"} · ${nombreFila}`);
      router.refresh();
    } catch {
      setValor(!nuevo);
      toast.error(`No se pudo guardar «${etiqueta}». Inténtalo otra vez desde la ficha.`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <button
      aria-checked={valor}
      aria-label={`${etiqueta}: ${nombreFila}`}
      className="pq-interruptor"
      disabled={guardando}
      onClick={(e) => {
        // La fila no debe abrir la ficha al pulsar el interruptor.
        e.stopPropagation();
        void cambiar();
      }}
      role="switch"
      type="button"
    >
      <span aria-hidden="true" className="pq-interruptor__pista">
        <span className="pq-interruptor__bola" />
      </span>
      <span className="pq-interruptor__texto">{valor ? "Sí" : "No"}</span>
    </button>
  );
}
