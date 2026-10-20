import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { IndiceTarjetas } from "@/components/indices/IndiceTarjetas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { metadataSinIndexar } from "@/lib/filtros/seo";
import { vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import { getCategoriasUsada, getInventarioUsados } from "@/lib/queries/getMaquinaria";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { fondoDeRespaldo } from "@/lib/repuestos/categoria";
import { rutas } from "@/lib/routes";
import { indexacionPermitida } from "@/lib/seo/config";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { tarjetasDeCategoriasUsada } from "@/lib/usados/indice";
import {
  DESCRIPCION_OTROS,
  ETIQUETA_OTROS,
  TITULO_OTROS,
  separarCategorias,
} from "@/lib/usados/otros";

/**
 * «OTROS» DE USADOS (cliente, 2026-10-19, como en WordPress): la página de las
 * categorías que no van en el primer nivel (casilla «Agrupar en «Otros»»),
 * con la misma «Plantilla 1» que el índice de usados: una tarjeta por
 * categoría con su número de unidades, y las vacías detrás, con «Sin unidades
 * por ahora». Los textos, del grupo «Otros» del global `paginas-indice`.
 *
 * `otros` es un segmento fijo: gana a `[categoria]`, y por eso está reservada
 * como dirección de categoría. Sin ninguna categoría agrupada, 404; sin
 * unidades en ninguna, no se indexa ni va al sitemap (como D4).
 */
const ANCLA = "usada-otros";

async function datos() {
  const [categorias, inventario, indice] = await Promise.all([
    getCategoriasUsada(),
    getInventarioUsados(),
    getPaginasIndice(),
  ]);
  const { agrupadas } = separarCategorias(categorias);
  const ids = new Set(agrupadas.map((c) => c.id));
  const conUnidades = inventario.some((u) => ids.has(u.categoria));
  return { agrupadas, inventario, grupo: indice.usadaOtros, conUnidades };
}

export async function generateMetadata(): Promise<Metadata> {
  const { grupo, conUnidades } = await datos();
  const base = await metadataDe({
    nombre: grupo?.titulo?.trim() || TITULO_OTROS,
    path: rutas.usadaOtros(),
    descripcion: grupo?.texto?.trim() || DESCRIPCION_OTROS,
  });
  return conUnidades ? base : metadataSinIndexar(base, indexacionPermitida());
}

export default async function UsadaOtrosPage() {
  const [{ agrupadas, inventario, grupo }, global, marcas] = await Promise.all([
    datos(),
    getRepuestosMarca(),
    getMarcas(),
  ]);
  if (agrupadas.length === 0) notFound();

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Usada", path: rutas.usada() },
    { nombre: ETIQUETA_OTROS, path: rutas.usadaOtros() },
  ];

  const vista = vistaEncabezadoDeIndice(grupo, TITULO_OTROS, fondoDeRespaldo(marcas));

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <IndiceTarjetas
        id={ANCLA}
        vista={{ ...vista, descripcion: vista.descripcion || DESCRIPCION_OTROS }}
        tarjetas={tarjetasDeCategoriasUsada(agrupadas, inventario, rutas.categoriaUsada, {
          incluirVacias: true,
        })}
        verTodo={global.verTodoTexto?.trim() || "Ver todo"}
        etiqueta="Otras categorías de maquinaria usada"
      />
    </main>
  );
}
