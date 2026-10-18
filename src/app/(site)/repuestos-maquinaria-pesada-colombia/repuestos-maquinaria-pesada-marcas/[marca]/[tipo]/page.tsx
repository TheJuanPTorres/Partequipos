import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { SeccionTestimonios } from "@/components/portada/diferidos";
import { CategoriasMarca } from "@/components/repuestos/CategoriasMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { ModelosTipo } from "@/components/repuestos/ModelosTipo";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getMarcaPorSlug } from "@/lib/queries/getMarcas";
import { getModelosDeTipo, getModelosPorIds } from "@/lib/queries/getModelos";
import { getCategoriasParaMarca, getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { getTipoPorSlug, getTipos } from "@/lib/queries/getTipos";
import { categoriasDeMarca } from "@/lib/repuestos/marca";
import {
  conOtrasEntradas,
  enlacesDeModelos,
  gruposDeModelos,
  vistaEncabezadoTipo,
} from "@/lib/repuestos/tipo";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { turnstileSiteKey } from "@/lib/turnstile";
import { poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { Marca, TiposEquipo } from "@/payload-types";

type Params = { marca: string; tipo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const tipos = await getTipos();

  return tipos.flatMap((tipo) => {
    const marca = poblado<Marca>(tipo.marca);
    // Sin marca poblada no se puede construir la ruta: se omite.
    return marca ? [{ marca: marca.slug, tipo: tipo.slug }] : [];
  });
}

/**
 * Resuelve marca + tipo validando que el tipo pertenezca REALMENTE a la marca
 * del path. Devuelve null ante cualquier combinación incoherente.
 */
async function resolver(params: Params) {
  const marca = await getMarcaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoPorSlug(marca.id, params.tipo);
  if (!tipo) return null;

  return { marca, tipo };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  if (!data) return METADATA_404;

  const { marca, tipo } = data;
  return metadataDe({
    nombre: tituloPorDefecto.tipoRepuesto(tipo.nombre, marca.nombre),
    path: rutas.tipo(marca.slug, tipo.slug),
    descripcion: tipo.descripcion,
    seo: tipo.seo,
  });
}

/** Ancla de la franja de modelos: a ella baja el icono de ratón del encabezado. */
const ANCLA_MODELOS = "modelos-repuestos";

/**
 * PÁGINA DE TIPO — PROVISIONAL hasta el diseño de Andrés
 * (docs/diseno/decisiones-repuestos-marca.md §6): el mismo lenguaje visual que
 * la página de marca (encabezado, franja amarilla, contacto y testimonios),
 * con los modelos del tipo como enlaces a sus fichas.
 */
export default async function TipoPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();

  const { marca, tipo } = data;
  const [global, modelos, categorias, testimonios, empresa] = await Promise.all([
    getRepuestosMarca(),
    getModelosDeTipo(tipo.id),
    getCategoriasParaMarca(),
    getTestimoniosDePortada(),
    getEmpresa(),
  ]);

  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  // Las fichas a las que enlazan las «otras entradas» de la lista (pueden ser de otro tipo).
  const enlazados = await getModelosPorIds(
    (tipo.otrasEntradas ?? []).flatMap((e) =>
      typeof e.modelo === "number" ? [e.modelo] : e.modelo ? [e.modelo.id] : [],
    ),
  );
  const enlaces = conOtrasEntradas(tipo, enlacesDeModelos(marca, tipo, modelos), (id) => {
    const m = enlazados.find((x) => x.id === id);
    const mMarca = poblado<Marca>(m?.marca);
    const mTipo = poblado<TiposEquipo>(m?.tipo);
    return m && mMarca && mTipo ? rutas.modelo(mMarca.slug, mTipo.slug, m.slug) : null;
  });
  const nombreTipo = tipo.nombre.toLowerCase();
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
    { nombre: marca.nombre, path: rutas.marca(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipo(marca.slug, tipo.slug) },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca vista={vistaEncabezadoTipo(marca, tipo, global)} anclaSiguiente={ANCLA_MODELOS} />

      <ModelosTipo
        id={ANCLA_MODELOS}
        titulo={`Modelos de ${nombreTipo} ${marca.nombre}`}
        modelos={enlaces}
        grupos={gruposDeModelos(tipo, enlaces)}
        vacio={`Todavía no hay modelos publicados para ${nombreTipo} ${marca.nombre}.`}
      />

      <CategoriasMarca
        id="categorias-repuestos"
        titulo={texto(global.tituloCategorias)}
        categorias={categoriasDeMarca(categorias)}
        fondo="gris"
      />

      <ContactoMarca
        titulo={texto(global.contactoTitulo)}
        subtitulo={texto(global.contactoSubtitulo)}
        boton={texto(global.contactoBoton)}
        origen={rutas.tipo(marca.slug, tipo.slug)}
        siteKey={turnstileSiteKey()}
        whatsapp={empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined}
        marca={`${nombreTipo} ${marca.nombre}`}
      />

      <SeccionTestimonios
        tarjetas={tarjetasDeTestimonios(testimonios)}
        textos={{
          titulo: texto(global.testimoniosTitulo),
          verVideoTexto: texto(global.verVideoTexto),
        }}
      />
    </main>
  );
}
