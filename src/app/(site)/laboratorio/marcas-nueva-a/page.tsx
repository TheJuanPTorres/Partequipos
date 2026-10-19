import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConceptoA } from "@/components/nueva/indiceMarcas/ConceptoA";
import estilos from "@/components/repuestos/marca.module.css";
import { vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import { marcasDelIndice, totalesDelIndice } from "@/lib/nueva/indiceMarcas";
import {
  getEquiposNuevos,
  getMarcasMaquinaria,
  getTiposMaquinaria,
} from "@/lib/queries/getMaquinaria";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";

/**
 * CONCEPTO A del índice de marcas de maquinaria nueva (2026-10-18, diseño
 * propio): para que dirección elija entre dos. Datos reales del panel. 404 en
 * producción y fuera del sitemap, como el laboratorio de movimiento.
 */
export const metadata: Metadata = {
  title: "Concepto A · índice de marcas de nueva",
  robots: { index: false, follow: false },
};

export default async function ConceptoIndiceMarcasA() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const [marcas, tipos, equipos, indice] = await Promise.all([
    getMarcasMaquinaria(),
    getTiposMaquinaria(),
    getEquiposNuevos(),
    getPaginasIndice(),
  ]);
  const vista = marcasDelIndice(marcas, tipos, equipos);
  return (
    <main className={estilos.pagina}>
      <ConceptoA
        marcas={vista}
        totales={totalesDelIndice(vista)}
        titulo="Marcas de maquinaria pesada nueva"
        antetitulo={vistaEncabezadoDeIndice(indice.maquinaria, "", null).antetitulo ?? ""}
        texto="Marcas que distribuimos, con sus tipos de equipo y modelos disponibles."
      />
    </main>
  );
}
