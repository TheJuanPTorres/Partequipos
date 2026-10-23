import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { IndiceTarjetas } from "@/components/indices/IndiceTarjetas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import { DESCRIPCION_NUEVA, TITULO_NUEVA, tarjetasDeTiposNueva } from "@/lib/nueva/indiceTipos";
import { getListadoNueva } from "@/lib/queries/getMaquinaria";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { fondoDeRespaldo } from "@/lib/repuestos/categoria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

// La página principal de maquinaria nueva (2026-10-23, cliente): el título y la descripción del
// antiguo índice de nueva, que da 301 aquí, para que su SEO pase a esta URL.
const TITULO = TITULO_NUEVA;
const DESCRIPCION = DESCRIPCION_NUEVA;

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.nuevaTipos(), descripcion: DESCRIPCION });
}

const ANCLA = "nueva-tipos";

/**
 * ÍNDICE DE TIPOS DE MAQUINARIA NUEVA (2026-10-22, dirección; URL NUEVA, `…/nueva/tipos/`): no
 * existía ni aquí ni en WordPress, donde el propio índice de nueva hacía de índice de tipos. La
 * plantilla de índices de Andrés con una tarjeta por tipo: los de varias marcas, a su categoría
 * transversal; los de una sola marca, a la página de su tipo en esa marca; y «Aditamentos»
 * (`src/lib/nueva/indiceTipos.ts`).
 *
 * Desde el 2026-10-23 (cliente) es la PÁGINA PRINCIPAL de maquinaria nueva: la de «Por marca» /
 * «Por tipo de máquina» (`…/maquinaria-pesada-nueva/`) ya no se navega y da 301 aquí. Lleva su
 * título y su descripción; canónica, la propia; en las migas es «Nueva».
 */
export default async function NuevaTiposPage() {
  const [listado, global, marcas] = await Promise.all([
    getListadoNueva(),
    getRepuestosMarca(),
    getMarcas(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nuevaTipos() },
  ];

  const vista = vistaEncabezadoDeIndice(null, TITULO, fondoDeRespaldo(marcas));

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <IndiceTarjetas
        id={ANCLA}
        vista={{ ...vista, descripcion: vista.descripcion || DESCRIPCION }}
        tarjetas={tarjetasDeTiposNueva(listado)}
        verTodo={global.verTodoTexto?.trim() || "Ver todo"}
        etiqueta="Maquinaria pesada nueva por tipo de máquina"
      />
    </main>
  );
}
