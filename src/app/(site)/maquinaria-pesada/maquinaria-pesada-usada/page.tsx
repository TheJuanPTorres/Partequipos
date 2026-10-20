import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { IndiceTarjetas } from "@/components/indices/IndiceTarjetas";
import estilos from "@/components/repuestos/marca.module.css";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import { JsonLd } from "@/components/seo/JsonLd";
import { vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import {
  getCategoriasUsada,
  getInventarioUsados,
  getMarcasUsada,
} from "@/lib/queries/getMaquinaria";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { fondoDeRespaldo } from "@/lib/repuestos/categoria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { tarjetasDeCategoriasUsada, tarjetasDeMarcasUsada } from "@/lib/usados/indice";
import { separarCategorias, tarjetaOtros } from "@/lib/usados/otros";
import { indiceDeLogos } from "@/lib/marca/logoMarca";

const TITULO = "Maquinaria pesada usada";
const DESCRIPCION =
  "Inventario de equipos usados disponibles, organizados por categoría. La disponibilidad cambia: consulta antes de decidir.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.usada(), descripcion: DESCRIPCION });
}

const ANCLA = "usada-categorias";

/**
 * ÍNDICE DE USADOS con la «Plantilla 1» de Andrés (2026-10-18, petición del
 * cliente), el mismo componente que el índice de Maquinaria (`IndiceTarjetas`):
 * la cabecera con los textos del global `paginas-indice` (grupo «usada»; vacíos,
 * los de siempre), una tarjeta por categoría con unidades y, debajo, el bloque
 * «Marcas» con una tarjeta por marca con unidades y su número. Las marcas sin
 * unidades no salen (D4). Fotos: `lib/usados/indice.ts`.
 *
 * Categorías como en WordPress (cliente, 2026-10-19): solo las de primer nivel
 * (Excavadoras y Aditamentos) y la tarjeta «Otros», que lleva a la página de
 * las agrupadas (`lib/usados/otros.ts`). Una de primer nivel sin unidades sale
 * con «Sin unidades por ahora», como antes.
 */
export default async function UsadaIndexPage() {
  const [categorias, marcasUsada, inventario, indice, global, marcas] = await Promise.all([
    getCategoriasUsada(),
    getMarcasUsada(),
    getInventarioUsados(),
    getPaginasIndice(),
    getRepuestosMarca(),
    getMarcas(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Usada", path: rutas.usada() },
  ];

  const vista = vistaEncabezadoDeIndice(indice.usada, TITULO, fondoDeRespaldo(marcas));
  const verTodo = global.verTodoTexto?.trim() || "Ver todo";
  const { primerNivel, agrupadas } = separarCategorias(categorias);
  const otros = tarjetaOtros(
    agrupadas,
    inventario,
    indice.usadaOtros?.imagenTarjeta,
    `${rutas.usadaOtros()}/`,
  );

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <IndiceTarjetas
        id={ANCLA}
        vista={{ ...vista, descripcion: vista.descripcion || DESCRIPCION }}
        tarjetas={[
          ...tarjetasDeCategoriasUsada(primerNivel, inventario, rutas.categoriaUsada, {
            incluirVacias: true,
          }),
          ...(otros ? [otros] : []),
        ]}
        verTodo={verTodo}
        etiqueta="Categorías de maquinaria usada"
      />
      <TarjetasMarca
        id="usada-marcas"
        titulo="Marcas"
        indice
        verTodo={verTodo}
        tarjetas={tarjetasDeMarcasUsada(
          marcasUsada,
          inventario,
          rutas.marcaUsada,
          indiceDeLogos(marcas),
        )}
      />
    </main>
  );
}
