import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BaldosasColorMarcas } from "@/components/repuestos/BaldosasColorMarcas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { placasDeMarcasNueva } from "@/lib/nueva/indiceMarcas";
import { getBaldosasMarca } from "@/lib/queries/getBaldosasMarca";
import { getLogosMarca } from "@/lib/queries/getLogosMarca";
import { getEquiposNuevos, getMarcasMaquinaria } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Marcas de maquinaria pesada nueva";
const DESCRIPCION = "Marcas que distribuimos, con sus tipos de equipo y modelos disponibles.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({
    nombre: TITULO,
    path: rutas.marcasMaquinaria(),
    descripcion: DESCRIPCION,
  });
}

const ANCLA = "marcas-maquinaria";

/**
 * ÍNDICE DE MARCAS DE MAQUINARIA NUEVA: las baldosas de color del diseño del cliente (2026-11-04),
 * el mismo componente que el índice de marcas de repuestos (`BaldosasColorMarcas`, #417), con el
 * «Color de la marca» y el logo en blanco, para las marcas que tienen equipos; sin «Aditamentos»
 * (dirección, 2026-10-20). Sin franja de color: es un índice general. La cabecera es la roja del
 * diseño, como la del índice de marcas de repuestos (cliente, 2026-11-04: los dos índices iguales).
 */
export default async function MarcasMaquinariaPage() {
  const [marcas, equipos, logos, baldosas] = await Promise.all([
    getMarcasMaquinaria(),
    getEquiposNuevos(),
    getLogosMarca(),
    getBaldosasMarca(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nuevaTipos() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <BaldosasColorMarcas
        id={ANCLA}
        marcas={placasDeMarcasNueva(marcas, equipos, logos, baldosas)}
        h1={{ antetitulo: "Maquinaria pesada nueva", titulo: "Marcas" }}
        sobre="maquinaria"
      />
    </main>
  );
}
