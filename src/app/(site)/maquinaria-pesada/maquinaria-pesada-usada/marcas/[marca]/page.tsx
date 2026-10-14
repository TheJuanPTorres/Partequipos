import type { Metadata } from "next";

import { ListadoUsados } from "@/components/catalog/ListadoUsados";
import type { ParametrosURL } from "@/lib/filtros";
import { cargarListadoUsado, metadataListadoUsado } from "@/lib/usados/listado";

/**
 * MARCA de maquinaria USADA (paso b del marketplace; decisión D1 de
 * dirección, 2026-10-13): la página 1 del listado de sus unidades
 * disponibles, filtrable por tipo de máquina, año, horas y peso. Crear una
 * marca en el panel crea esta página; sin unidades, no se indexa (D4).
 *
 * Dinámica, como las categorías (D3): lee la query; datos en caché.
 */
type Props = { params: Promise<{ marca: string }>; searchParams: Promise<ParametrosURL> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { marca } = await params;
  return metadataListadoUsado("marca", marca, 1, await searchParams);
}

export default async function MarcaUsadaPage({ params, searchParams }: Props) {
  const { marca } = await params;
  const { ambito, listado } = await cargarListadoUsado("marca", marca, 1, await searchParams);
  return <ListadoUsados ambito={ambito} pagina={1} listado={listado} />;
}
