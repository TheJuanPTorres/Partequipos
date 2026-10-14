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
import { fondoDeRespaldo, placasDeMarcas, vistaEncabezadoIndice } from "@/lib/repuestos/categoria";
import { categoriasDeMarca } from "@/lib/repuestos/marca";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Categorías de repuestos para maquinaria pesada";
const DESCRIPCION =
  "Repuestos para maquinaria pesada por categoría técnica: tren de rodaje, filtración, herramienta de corte, lubricantes, componentes mayores, motor diésel y más.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({
    nombre: TITULO,
    path: rutas.categoriasRepuestos(),
    descripcion: DESCRIPCION,
  });
}

const ANCLA = "categorias-repuestos";

/**
 * ÍNDICE DE CATEGORÍAS TÉCNICAS DE REPUESTOS — PROVISIONAL hasta el diseño de
 * Andrés (docs/diseno/decisiones-repuestos-marca.md §7): encabezado, la franja
 * de categorías, las marcas con las que trabajamos, contacto y testimonios.
 */
export default async function CategoriasRepuestosIndexPage() {
  const [global, categorias, marcas] = await Promise.all([
    getRepuestosMarca(),
    getCategoriasRepuestos(),
    getMarcas(),
  ]);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Categorías", path: rutas.categoriasRepuestos() },
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
          "Categorías técnicas",
          DESCRIPCION,
          fondoDeRespaldo(marcas),
        )}
        anclaSiguiente={ANCLA}
      />

      <CategoriasMarca
        id={ANCLA}
        titulo={global.tituloCategorias?.trim() || "Nuestras categorías de repuestos"}
        categorias={categoriasDeMarca(categorias)}
      />

      <PlacasMarcas
        id="marcas-repuestos"
        titulo="Marcas con las que trabajamos"
        marcas={placasDeMarcas(marcas)}
        franja="blanca"
      />

      <CierreRepuestos origen={rutas.categoriasRepuestos()} sobre="repuestos por categoría" />
    </main>
  );
}
