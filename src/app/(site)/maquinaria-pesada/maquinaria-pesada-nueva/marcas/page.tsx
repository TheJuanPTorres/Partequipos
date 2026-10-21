import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BaldosasMarcas } from "@/components/repuestos/BaldosasMarcas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { placasDeMarcasNueva } from "@/lib/nueva/indiceMarcas";
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
 * ÍNDICE DE MARCAS DE MAQUINARIA NUEVA: el «Mostrar marcas» de Andrés (plantilla
 * 4017), el mismo componente que el índice de marcas de repuestos
 * (`BaldosasMarcas`), con las marcas que tienen equipos; sin «Aditamentos» (dirección, 2026-10-20).
 * Sin franja de color: es un índice general. Sin el hero grande (dirección,
 * 2026-10-20): la cabecera es la caja baja de las baldosas, con el `<h1>`.
 */
export default async function MarcasMaquinariaPage() {
  const [marcas, equipos, logos] = await Promise.all([
    getMarcasMaquinaria(),
    getEquiposNuevos(),
    getLogosMarca(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <BaldosasMarcas
        id={ANCLA}
        marcas={placasDeMarcasNueva(marcas, equipos, logos)}
        h1={{ antetitulo: "Maquinaria pesada nueva", titulo: "Marcas" }}
        cuatroEnUnaFila
      />
    </main>
  );
}
