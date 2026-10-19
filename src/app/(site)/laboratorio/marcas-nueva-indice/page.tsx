import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BandasMarcas } from "@/components/nueva/indiceMarcas/BandasMarcas";
import { CabeceraIndice } from "@/components/nueva/indiceMarcas/CabeceraIndice";
import estilos from "@/components/repuestos/marca.module.css";
import { marcasDelIndice } from "@/lib/nueva/indiceMarcas";
import {
  getEquiposNuevos,
  getMarcasMaquinaria,
  getTiposMaquinaria,
} from "@/lib/queries/getMaquinaria";

/**
 * Propuesta de cabecera «Índice editorial» del índice de marcas de nueva (2026-10-18,
 * diseño propio), con las bandas del concepto B debajo, para que dirección
 * elija. Datos reales del panel. 404 en producción y fuera del sitemap.
 */
export const metadata: Metadata = {
  title: "Cabecera «Índice editorial» · índice de marcas de nueva",
  robots: { index: false, follow: false },
};

export default async function LaboratorioIndiceEditorial() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const [marcas, tipos, equipos] = await Promise.all([
    getMarcasMaquinaria(),
    getTiposMaquinaria(),
    getEquiposNuevos(),
  ]);
  const vista = marcasDelIndice(marcas, tipos, equipos);
  return (
    <main className={estilos.pagina}>
      <CabeceraIndice
        marcas={vista}
        titulo="Marcas de maquinaria nueva"
        texto="Elige una marca para ir a sus equipos."
      />
      <BandasMarcas marcas={vista} />
    </main>
  );
}
