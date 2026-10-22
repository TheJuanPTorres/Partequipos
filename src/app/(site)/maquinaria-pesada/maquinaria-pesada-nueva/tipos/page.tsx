import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { IndiceTarjetas } from "@/components/indices/IndiceTarjetas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import { tarjetasDeTiposNueva } from "@/lib/nueva/indiceTipos";
import { getListadoNueva } from "@/lib/queries/getMaquinaria";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { fondoDeRespaldo } from "@/lib/repuestos/categoria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Tipos de maquinaria pesada nueva";
const DESCRIPCION =
  "Excavadoras, retrocargadoras, minicargadores, motoniveladoras, compactadores y más: elige el tipo de máquina nueva que necesitas.";

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
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Tipos", path: rutas.nuevaTipos() },
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
        etiqueta="Tipos de maquinaria pesada nueva"
      />
    </main>
  );
}
