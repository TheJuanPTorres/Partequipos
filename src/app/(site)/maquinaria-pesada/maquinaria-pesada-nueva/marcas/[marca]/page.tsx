import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { IndiceTarjetas } from "@/components/indices/IndiceTarjetas";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  equiposPorTipo,
  primeraFotoPorTipo,
  tarjetasDeTiposNueva,
  vistaEncabezadoMarcaNueva,
} from "@/lib/nueva/paginaMarca";
import {
  getEquiposDeTipos,
  getMarcaMaquinariaPorSlug,
  getMarcasMaquinaria,
  getTiposDeMarcaMaquinaria,
} from "@/lib/queries/getMaquinaria";
import { vistaEncabezadoDeIndice } from "@/lib/indices/paginasIndice";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";
import { METADATA_404 } from "@/lib/seo/noEncontrada";

type Params = { marca: string };

export async function generateStaticParams(): Promise<Params[]> {
  const marcas = await getMarcasMaquinaria();
  return marcas.map((m) => ({ marca: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { marca: slug } = await params;
  const marca = await getMarcaMaquinariaPorSlug(slug);
  if (!marca) return METADATA_404;

  return metadataDe({
    nombre: tituloPorDefecto.marcaMaquinaria(marca.nombre),
    path: rutas.marcaMaquinaria(marca.slug),
    descripcion: marca.descripcion,
    seo: marca.seo,
    imageUrl: imagenDeMedia(marca.logo, marca.nombre)?.url,
  });
}

const ANCLA = "tipos-de-la-marca";

/**
 * PÁGINA DE MARCA DE MAQUINARIA NUEVA (2026-10-17, petición del cliente): como
 * las páginas índice de Andrés (`IndiceTarjetas`): cabecera con la foto de la
 * marca, título y texto, y una tarjeta con foto por cada tipo de equipo.
 */
export default async function MarcaMaquinariaPage({ params }: { params: Promise<Params> }) {
  const { marca: slug } = await params;
  const marca = await getMarcaMaquinariaPorSlug(slug);
  if (!marca) notFound();

  const [tipos, global, indice] = await Promise.all([
    getTiposDeMarcaMaquinaria(marca.id),
    getRepuestosMarca(),
    getPaginasIndice(),
  ]);
  // Los equipos de todos los tipos: cuántos tiene cada uno (los vacíos no se
  // pintan) y la foto de su primer equipo, para los que no tienen imagen propia.
  const equipos = await getEquiposDeTipos(tipos.map((t) => t.id));
  const fotos = primeraFotoPorTipo(equipos);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: rutas.marcaMaquinaria(marca.slug) },
  ];

  const tarjetas = tarjetasDeTiposNueva(marca, tipos, fotos, equiposPorTipo(equipos));

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <IndiceTarjetas
        id={ANCLA}
        vista={vistaEncabezadoMarcaNueva(
          marca,
          vistaEncabezadoDeIndice(indice.maquinaria, "", null).antetitulo,
        )}
        tarjetas={tarjetas}
        verTodo={global.verTodoTexto?.trim() || "Ver todo"}
        etiqueta={`Tipos de equipo ${marca.nombre}`}
        cabeceraBajaSinFoto
      />
      {tarjetas.length === 0 ? (
        <p id={ANCLA} className="mx-auto max-w-4xl px-4 py-10 text-gray-600">
          Todavía no hay tipos de equipo publicados para {marca.nombre}.
        </p>
      ) : null}
    </main>
  );
}
