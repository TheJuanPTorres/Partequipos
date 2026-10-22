import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { IndiceTarjetas } from "@/components/indices/IndiceTarjetas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import {
  SLUG_ADITAMENTOS,
  tarjetasDeTiposNueva,
  tarjetasIndiceNueva,
} from "@/lib/nueva/indiceTipos";
import { DESCRIPCION_NUEVA, TITULO_NUEVA } from "@/lib/nueva/listado";
import { getListadoNueva, getMarcasMaquinaria } from "@/lib/queries/getMaquinaria";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { fondoDeRespaldo } from "@/lib/repuestos/categoria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

// El mismo título y la misma descripción que el antiguo listado: el SEO no cambia.
const TITULO = TITULO_NUEVA;
const DESCRIPCION = DESCRIPCION_NUEVA;

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.nueva(), descripcion: DESCRIPCION });
}

const ANCLA = "nueva-tarjetas";

/**
 * ÍNDICE DE MAQUINARIA NUEVA, SIN MARKETPLACE (2026-10-22, dirección: el marketplace es solo
 * para usados). La plantilla de índices de Andrés, como `/maquinaria-pesada/`: la cabecera y DOS
 * tarjetas, «Por marca» y «Por tipo de máquina» (`src/lib/nueva/indiceTipos.ts`), centradas por
 * la regla de tarjetas (1–2 centradas). Las URL del antiguo listado (`pagina/<n>/`) dan 301 aquí;
 * con filtros en la query, la canónica es la de siempre, sin query.
 */
export default async function NuevaIndexPage() {
  const [listado, marcasNueva, global, marcas] = await Promise.all([
    getListadoNueva(),
    getMarcasMaquinaria(),
    getRepuestosMarca(),
    getMarcas(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
  ];

  const vista = vistaEncabezadoDeIndice(null, TITULO, fondoDeRespaldo(marcas));
  // «Por marca»: la foto de tarjeta de la primera marca que la tenga (sin «Aditamentos», que
  // no sale en el índice de marcas).
  const fotoMarcas =
    marcasNueva
      .filter((m) => m.slug !== SLUG_ADITAMENTOS)
      .map((m) => imagenDeMedia(m.imagenTarjeta, ""))
      .find((f) => f !== null) ?? null;

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <IndiceTarjetas
        id={ANCLA}
        vista={{ ...vista, descripcion: vista.descripcion || DESCRIPCION }}
        tarjetas={tarjetasIndiceNueva(fotoMarcas, tarjetasDeTiposNueva(listado))}
        verTodo={global.verTodoTexto?.trim() || "Ver todo"}
        etiqueta="Maquinaria pesada nueva por marca o por tipo"
      />
    </main>
  );
}
