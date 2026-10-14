import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CierreRepuestos } from "@/components/repuestos/CierreRepuestos";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { PlacasMarcas } from "@/components/repuestos/PlacasMarcas";
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
 * ÍNDICE DE MARCAS DE REPUESTOS — PROVISIONAL hasta el diseño de Andrés
 * (docs/diseno/decisiones-repuestos-marca.md §7): encabezado, una placa oscura
 * con el logo de cada marca (sus logos son blancos) con enlace a su página,
 * contacto y testimonios.
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
      />

      <PlacasMarcas id={ANCLA} titulo="Repuestos por marca" marcas={placasDeMarcas(marcas)} />

      <CierreRepuestos origen={rutas.marcas()} sobre="repuestos por marca" />
    </main>
  );
}
