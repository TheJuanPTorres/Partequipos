import Image from "next/image";
import type { DefaultServerCellComponentProps } from "payload";
import { cache } from "react";

import { primeraImagen } from "@/lib/panel/miniatura";

/*
 * Una consulta por imagen y petición (`cache`): solo `url`, `filename` y las
 * medidas, sin poblar nada. Media es de lectura pública.
 */
const leerImagen = cache(
  async (payload: DefaultServerCellComponentProps["payload"], id: number | string) => {
    try {
      return await payload.findByID({
        collection: "media",
        id,
        depth: 0,
        // `filename` hace falta: `url` es virtual y sale de él (sin él, llega null).
        select: { url: true, filename: true, width: true, height: true },
      });
    } catch {
      return null;
    }
  },
);

/**
 * Celda de lista con la MINIATURA de la primera imagen (galería o imagen
 * destacada), pequeña y diferida (F3, decisiones-panel.md §24). Componente de
 * servidor; `next/image` la pide a 40 px (1x y 2x) con `loading="lazy"`.
 * Decorativa (`alt=""`): el nombre de la fila ya dice qué es.
 */
export default async function CeldaMiniatura({
  cellData,
  payload,
}: DefaultServerCellComponentProps) {
  const id = primeraImagen(cellData);
  const imagen = id !== null ? await leerImagen(payload, id) : null;
  if (!imagen?.url) {
    return <span className="pq-miniatura pq-miniatura--vacia">Sin foto</span>;
  }
  return (
    <span className="pq-miniatura">
      <Image
        alt=""
        height={40}
        loading="lazy"
        sizes="40px"
        src={imagen.url}
        style={{ objectFit: "cover" }}
        width={40}
      />
    </span>
  );
}
