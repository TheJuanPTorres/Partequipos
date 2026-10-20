import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BaldosasMarcas } from "@/components/repuestos/BaldosasMarcas";
import { CierreRepuestos } from "@/components/repuestos/CierreRepuestos";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { fondoDeRespaldo, placasDeMarcas, vistaEncabezadoIndice } from "@/lib/repuestos/categoria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Marcas de repuestos para maquinaria pesada";
const DESCRIPCION =
  "Encuentra repuestos por marca de maquinaria pesada. Cada marca reúne sus tipos de equipo y los modelos disponibles.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.marcas(), descripcion: DESCRIPCION });
}

const ANCLA = "marcas-repuestos";

/**
 * ÍNDICE DE MARCAS DE REPUESTOS: encabezado, las marcas con «Mostrar marcas» de
 * Andrés (plantilla 4017: baldosas del color de cada marca en un recuadro blanco,
 * docs/diseno/decisiones-repuestos-marca.md §8), contacto y testimonios. Sin la
 * franja amarilla: es un índice general, no la página de una marca.
 */
export default async function MarcasIndexPage() {
  const [global, marcas] = await Promise.all([getRepuestosMarca(), getMarcas()]);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={vistaEncabezadoIndice(
          global.tituloHero?.trim() || "Repuestos para maquinaria pesada",
          "Marcas",
          DESCRIPCION,
          fondoDeRespaldo(marcas),
        )}
        anclaSiguiente={ANCLA}
        franja={false}
      />

      <BaldosasMarcas id={ANCLA} marcas={placasDeMarcas(marcas)} />

      <CierreRepuestos origen={rutas.marcas()} sobre="repuestos por marca" />
    </main>
  );
}
