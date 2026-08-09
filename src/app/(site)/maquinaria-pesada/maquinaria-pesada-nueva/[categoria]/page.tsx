import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategoriaMaquinariaPorSlug,
  getCategoriasMaquinaria,
  getEquiposDeTipos,
} from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import type { MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

/**
 * Categoría transversal de la línea nueva (`/…/nueva/excavadoras/`).
 *
 * Cruza marcas: reúne los equipos de todos los tipos declarados en
 * `tiposIncluidos`. Es una vista, no un nivel de la jerarquía — por eso las
 * migas vuelven a la línea, no a una marca concreta.
 */
type Params = { categoria: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categorias = await getCategoriasMaquinaria();
  return categorias.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaMaquinariaPorSlug(slug);
  if (!categoria) return {};

  return buildMetadata({
    nombre: `${categoria.nombre} nuevas`,
    path: rutas.categoriaNueva(categoria.slug),
    descripcion: categoria.descripcion,
    seo: categoria.seo,
  });
}

export default async function CategoriaNuevaPage({ params }: { params: Promise<Params> }) {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaMaquinariaPorSlug(slug);
  if (!categoria) notFound();

  const tipos = (categoria.tiposIncluidos ?? [])
    .map((t) => poblado<TiposMaquinaria>(t))
    .filter((t): t is TiposMaquinaria => t !== null);

  const equipos = await getEquiposDeTipos(tipos.map((t) => t.id));

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: categoria.nombre, path: rutas.categoriaNueva(categoria.slug) },
  ];

  const items = equipos.flatMap((equipo) => {
    const marca = poblado<MarcasMaquinaria>(equipo.marca);
    const tipo = poblado<TiposMaquinaria>(equipo.tipo);
    if (!marca || !tipo) return [];

    const primera = Array.isArray(equipo.imagenes) ? equipo.imagenes[0] : null;
    return [
      {
        href: `${rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug)}/`,
        titulo: equipo.nombre,
        // En una vista que cruza marcas, saber de qué marca es cada equipo importa.
        descripcion: marca.nombre,
        imagen: imagenDeMedia(primera, equipo.nombre),
      },
    ];
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{categoria.nombre} nuevas</h1>

      {categoria.descripcion ? (
        <p className="mt-3 max-w-2xl text-gray-600">{categoria.descripcion}</p>
      ) : null}

      <section className="mt-8" aria-labelledby="equipos-heading">
        <h2 id="equipos-heading" className="text-xl font-medium text-gray-900">
          Equipos de todas las marcas
        </h2>
        <div className="mt-4">
          <ListaEnlaces
            items={items}
            vacio={`Todavía no hay equipos publicados en ${categoria.nombre.toLowerCase()}.`}
          />
        </div>
      </section>
    </main>
  );
}
