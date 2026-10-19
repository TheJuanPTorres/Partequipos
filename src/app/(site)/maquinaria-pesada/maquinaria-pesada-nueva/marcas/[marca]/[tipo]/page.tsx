import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { ModelosTipo } from "@/components/repuestos/ModelosTipo";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { estiloDeMarca } from "@/lib/marca/colorMarca";
import {
  enlacesDeEquipos,
  gruposDeEnlaces,
  tituloFranja,
  vistaEncabezadoTipoNueva,
} from "@/lib/nueva/paginaTipo";
import { gruposDeSubtipos, subtiposDe } from "@/lib/nueva/subtipos";
import {
  getEquiposDeTipo,
  getEquiposDeTipos,
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
import { poblado } from "@/lib/utils/relations";
import type { MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";
import { METADATA_404 } from "@/lib/seo/noEncontrada";

type Params = { marca: string; tipo: string };

/** Ancla de la franja de equipos: a ella baja el icono de ratón del encabezado. */
const ANCLA_MODELOS = "modelos-nueva";

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

/**
 * Los equipos que lista la página: los del tipo o, si es un tipo «paraguas»
 * (con `subtipos`, auditoría de estructura del 2026-10-17), los de sus
 * subtipos, por grupos.
 */
async function equiposDePagina(tipo: TiposMaquinaria) {
  const subtipos = subtiposDe(tipo);
  if (subtipos.length === 0) return { grupos: null, equipos: await getEquiposDeTipo(tipo.id) };
  const equipos = await getEquiposDeTipos(subtipos.map((s) => s.id));
  return { grupos: gruposDeSubtipos(subtipos, equipos), equipos };
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
  const { equipos } = await equiposDePagina(tipo);
  return equipos.length > 0 ? base : metadataSinIndexar(base, indexacionPermitida());
}

export default async function TipoMaquinariaPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();

  const { marca, tipo } = data;
  const { grupos, equipos } = await equiposDePagina(tipo);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: rutas.marcaMaquinaria(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipoMaquinaria(marca.slug, tipo.slug) },
  ];

  // La ficha cuelga del tipo del equipo (en un paraguas, su subtipo).
  const modelos = grupos
    ? grupos.flatMap((g) => enlacesDeEquipos(marca, g.tipo.slug, g.equipos))
    : enlacesDeEquipos(marca, tipo.slug, equipos);

  return (
    <main className={estilos.pagina} style={estiloDeMarca(marca.colorMarca)}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={vistaEncabezadoTipoNueva(marca, tipo, equipos)}
        anclaSiguiente={ANCLA_MODELOS}
        bajaSinFoto
      />

      <ModelosTipo
        id={ANCLA_MODELOS}
        titulo={tituloFranja(marca, tipo)}
        modelos={modelos}
        grupos={grupos ? gruposDeEnlaces(marca, grupos) : null}
        vacio={`Todavía no hay equipos publicados para ${tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre)}.`}
      />
    </main>
  );
}
