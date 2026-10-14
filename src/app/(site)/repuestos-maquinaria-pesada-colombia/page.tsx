import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CategoriasMarca } from "@/components/repuestos/CategoriasMarca";
import { CierreRepuestos } from "@/components/repuestos/CierreRepuestos";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { PlacasMarcas } from "@/components/repuestos/PlacasMarcas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategoriasRepuestos } from "@/lib/queries/getCategoriasRepuestos";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa, getHorario, getLogo } from "@/lib/queries/getSeo";
import { fondoDeRespaldo, placasDeMarcas, vistaEncabezadoIndice } from "@/lib/repuestos/categoria";
import { categoriasDeMarca } from "@/lib/repuestos/marca";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd, buildOrganizationJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Repuestos para maquinaria pesada en Colombia";
const DESCRIPCION =
  "Catálogo de repuestos para maquinaria pesada: excavadoras, bulldozers, retrocargadoras, motoniveladoras y más, organizados por marca y tipo de equipo.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.repuestos(), descripcion: DESCRIPCION });
}

const ANCLA = "repuestos-por-marca";

/**
 * PÁGINA PRINCIPAL DE REPUESTOS — PROVISIONAL hasta el diseño de Andrés
 * (docs/diseno/decisiones-repuestos-marca.md §7). Enlaza DIRECTAMENTE a cada
 * marca y a cada categoría técnica (y a sus dos índices), no solo al índice.
 */
export default async function RepuestosIndexPage() {
  const [global, marcas, categorias, horario, empresa, logo] = await Promise.all([
    getRepuestosMarca(),
    getMarcas(),
    getCategoriasRepuestos(),
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

      <HeroMarca
        vista={vistaEncabezadoIndice(
          global.tituloHero?.trim() || "Repuestos para maquinaria pesada",
          "En Colombia",
          DESCRIPCION,
          fondoDeRespaldo(marcas),
        )}
        anclaSiguiente={ANCLA}
      />

      <PlacasMarcas
        id={ANCLA}
        titulo="Repuestos por marca"
        marcas={placasDeMarcas(marcas)}
        enlaceTodas={{ href: rutas.marcas(), texto: "Ver todas las marcas" }}
      />

      <CategoriasMarca
        id="repuestos-por-categoria"
        titulo={global.tituloCategorias?.trim() || "Nuestras categorías de repuestos"}
        categorias={categoriasDeMarca(categorias)}
        fondo="gris"
        enlaceTodas={{ href: rutas.categoriasRepuestos(), texto: "Ver todas las categorías" }}
      />

      <CierreRepuestos origen={rutas.repuestos()} sobre="repuestos" />
    </main>
  );
}
