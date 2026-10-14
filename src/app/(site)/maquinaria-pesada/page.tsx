import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { IndiceTarjetas } from "@/components/indices/IndiceTarjetas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { tarjetasDeIndice, vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { fondoDeRespaldo } from "@/lib/repuestos/categoria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Maquinaria pesada";
const DESCRIPCION =
  "Maquinaria pesada nueva y usada para construcción, infraestructura y agroindustria, con respaldo técnico y repuestos.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.maquinaria(), descripcion: DESCRIPCION });
}

const ANCLA = "maquinaria-tarjetas";

/**
 * PÁGINA PRINCIPAL DE MAQUINARIA — plantilla «Categoría principal» de Andrés
 * (docs/diseno/decisiones-indices-contacto.md): LA MISMA que la de repuestos.
 * Seis tarjetas con enlaces a maquinaria nueva y usada, aditamentos, repuestos,
 * lubricantes y servicio técnico; el contenido sale del global `paginas-indice`.
 */
export default async function MaquinariaIndexPage() {
  const [indice, global, marcas] = await Promise.all([
    getPaginasIndice(),
    getRepuestosMarca(),
    getMarcas(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: TITULO, path: rutas.maquinaria() },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <IndiceTarjetas
        id={ANCLA}
        vista={vistaEncabezadoDeIndice(
          indice.maquinaria,
          "Encuentra Maquinaria y Repuestos Rápido y Fácil",
          fondoDeRespaldo(marcas),
        )}
        tarjetas={tarjetasDeIndice(indice.maquinaria)}
        verTodo={global.verTodoTexto?.trim() || "Ver todo"}
      />
    </main>
  );
}
