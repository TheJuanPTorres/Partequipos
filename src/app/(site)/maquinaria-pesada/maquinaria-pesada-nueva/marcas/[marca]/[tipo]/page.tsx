import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getEquiposDeTipo,
  getMarcaMaquinariaPorSlug,
  getTipoMaquinariaPorSlug,
  getTiposMaquinaria,
} from "@/lib/queries/getMaquinaria";
import { metadataSinIndexar } from "@/lib/filtros/seo";
import { rutas } from "@/lib/routes";
import { indexacionPermitida } from "@/lib/seo/config";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import type { MarcasMaquinaria } from "@/payload-types";
import { METADATA_404 } from "@/lib/seo/noEncontrada";

type Params = { marca: string; tipo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const tipos = await getTiposMaquinaria();
  return tipos.flatMap((tipo) => {
    const marca = poblado<MarcasMaquinaria>(tipo.marca);
    return marca ? [{ marca: marca.slug, tipo: tipo.slug }] : [];
  });
}

/** Resuelve marca + tipo validando que el tipo pertenezca REALMENTE a la marca. */
async function resolver(params: Params) {
  const marca = await getMarcaMaquinariaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoMaquinariaPorSlug(marca.id, params.tipo);
  if (!tipo) return null;

  return { marca, tipo };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  if (!data) return METADATA_404;

  const { marca, tipo } = data;
  const base = await metadataDe({
    nombre: tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre),
    path: rutas.tipoMaquinaria(marca.slug, tipo.slug),
    descripcion: tipo.descripcion,
    seo: tipo.seo,
  });
  // D4 (dirección, 2026-10-14): sin equipos, no se indexa; vuelve sola con el
  // primero, que revalida esta página. La URL sigue en 200 con su estado vacío.
  const equipos = await getEquiposDeTipo(tipo.id);
  return equipos.length > 0 ? base : metadataSinIndexar(base, indexacionPermitida());
}

export default async function TipoMaquinariaPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();

  const { marca, tipo } = data;
  const equipos = await getEquiposDeTipo(tipo.id);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: rutas.marcaMaquinaria(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipoMaquinaria(marca.slug, tipo.slug) },
  ];

  const items = equipos.map((equipo) => {
    const primera = Array.isArray(equipo.imagenes) ? equipo.imagenes[0] : null;
    return {
      href: `${rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug)}/`,
      titulo: equipo.nombre,
      descripcion: equipo.entradilla ?? (equipo.codigo ? `Código ${equipo.codigo}` : null),
      imagen: imagenDeMedia(primera, equipo.nombre),
    };
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">
        {tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre)}
      </h1>

      {tipo.descripcion ? <p className="mt-3 max-w-2xl text-gray-600">{tipo.descripcion}</p> : null}

      <section className="mt-8" aria-labelledby="equipos-heading">
        <h2 id="equipos-heading" className="text-xl font-medium text-gray-900">
          Equipos disponibles
        </h2>
        <div className="mt-4">
          <ListaEnlaces
            items={items}
            vacio={`Todavía no hay equipos publicados para ${tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre)}.`}
          />
        </div>
      </section>
    </main>
  );
}
