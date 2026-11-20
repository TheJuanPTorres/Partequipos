"use client";

import { useSearchParams } from "next/navigation";

const FILTROS = [
  { texto: "Todas", estado: null },
  { texto: "Nuevas", estado: "nueva" },
  { texto: "Contactadas", estado: "contactada" },
  { texto: "Cerradas", estado: "cerrada" },
] as const;

/** Filtro rápido por estado y «Descargar Excel (CSV)» con el filtro actual de la lista. */
export function BarraSolicitudes() {
  const params = useSearchParams();
  const actual = params.get("where[estado][equals]");

  // El CSV lleva el mismo `where` que la lista (estado, búsqueda…), sin paginar.
  const para = new URLSearchParams();
  for (const [k, v] of params.entries()) if (k.startsWith("where[")) para.set(k, v);
  const exportar = `/api/solicitudes/exportar${para.size ? `?${para}` : ""}`;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        margin: "0 0 16px",
      }}
    >
      {FILTROS.map((f) => {
        const activo = (f.estado ?? null) === actual;
        const href = f.estado
          ? `?where[estado][equals]=${f.estado}`
          : "/admin/collections/solicitudes";
        return (
          <a
            key={f.texto}
            href={href}
            aria-current={activo ? "true" : undefined}
            className="btn btn--style-pill btn--size-small"
            style={{
              fontWeight: activo ? 700 : 400,
              textDecoration: activo ? "underline" : "none",
            }}
          >
            {f.texto}
          </a>
        );
      })}
      <a
        href={exportar}
        download
        className="btn btn--style-primary btn--size-small"
        style={{ marginLeft: "auto" }}
      >
        Descargar Excel (CSV)
      </a>
    </div>
  );
}
