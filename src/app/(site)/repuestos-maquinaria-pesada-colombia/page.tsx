import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { IndiceTarjetas } from "@/components/indices/IndiceTarjetas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { tarjetasDeIndice, vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa, getHorario, getLogo } from "@/lib/queries/getSeo";
import { fondoDeRespaldo } from "@/lib/repuestos/categoria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd, buildOrganizationJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Repuestos para maquinaria pesada en Colombia";
const DESCRIPCION =
  "Catálogo de repuestos para maquinaria pesada: excavadoras, bulldozers, retrocargadoras, motoniveladoras y más, organizados por marca y tipo de equipo.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.repuestos(), descripcion: DESCRIPCION });
}

const ANCLA = "repuestos-tarjetas";

/**
 * PÁGINA PRINCIPAL DE REPUESTOS — plantilla «Repuestos para maquinaria pesada»
 * de Andrés (docs/diseno/decisiones-indices-contacto.md): la misma que la de
 * maquinaria. Seis tarjetas con enlaces a las marcas, las categorías técnicas y
 * los lubricantes; el contenido sale del global `paginas-indice`.
 */
export default async function RepuestosIndexPage() {
  const [indice, global, marcas, horario, empresa, logo] = await Promise.all([
    getPaginasIndice(),
    getRepuestosMarca(),
    getMarcas(),
    getHorario(),
    getEmpresa(),
    getLogo(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd
        data={[
          buildOrganizationJsonLd(horario, empresa, logo.buscadores),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <IndiceTarjetas
        id={ANCLA}
        vista={vistaEncabezadoDeIndice(
          indice.repuestos,
          "Repuestos para Maquinaria pesada",
          fondoDeRespaldo(marcas),
        )}
        tarjetas={tarjetasDeIndice(indice.repuestos)}
        verTodo={global.verTodoTexto?.trim() || "Ver todo"}
      />
    </main>
  );
}
