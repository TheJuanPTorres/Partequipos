import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CierreRepuestos } from "@/components/repuestos/CierreRepuestos";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { PlacasMarcas } from "@/components/repuestos/PlacasMarcas";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategoriasRepuestos } from "@/lib/queries/getCategoriasRepuestos";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { fondoDeRespaldo, placasDeMarcas, vistaEncabezadoIndice } from "@/lib/repuestos/categoria";
import { tarjetasDeCategorias } from "@/lib/repuestos/plantillaTipo";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

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
 * Andrés (docs/diseno/decisiones-repuestos-marca.md §7): encabezado, las
 * categorías, las marcas con las que trabajamos, contacto y testimonios.
 *
 * Desde el 2026-10-20 (dirección), las categorías son las TARJETAS de las páginas
 * índice (`TarjetasMarca`, variante `indice`: foto, recuadro blanco con el título y
 * «Ver todo»), con la «Imagen de la tarjeta» de cada una, en lugar de las píldoras
 * con icono. El encabezado lleva su propia foto («Páginas índice y contacto»);
 * vacía, la de respaldo de siempre.
 */
export default async function CategoriasRepuestosIndexPage() {
  const [global, categorias, marcas, indice] = await Promise.all([
    getRepuestosMarca(),
    getCategoriasRepuestos(),
    getMarcas(),
    getPaginasIndice(),
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
          imagenDeMedia(indice.categoriasRepuestos?.fondo, "") ?? fondoDeRespaldo(marcas),
        )}
        anclaSiguiente={ANCLA}
      />

      <TarjetasMarca
        id={ANCLA}
        titulo={global.tituloCategorias?.trim() || "Nuestras categorías de repuestos"}
        verTodo="Ver todo"
        tarjetas={tarjetasDeCategorias(categorias)}
        indice
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
