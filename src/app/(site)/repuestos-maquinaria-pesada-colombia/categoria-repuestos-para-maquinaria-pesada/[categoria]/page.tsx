import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { SeccionTestimonios } from "@/components/portada/diferidos";
import { CategoriasMarca } from "@/components/repuestos/CategoriasMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { PorQueElegirnos } from "@/components/repuestos/PorQueElegirnos";
import { SedesCompactas } from "@/components/repuestos/SedesCompactas";
import { TarjetasGrupos } from "@/components/repuestos/TarjetasGrupos";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { sedesDePortada } from "@/lib/portada/sedes";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import {
  getCategoriaRepuestosPorSlug,
  getCategoriasRepuestos,
} from "@/lib/queries/getCategoriasRepuestos";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getCategoriasParaMarca, getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getSedesDePortada } from "@/lib/queries/getSedes";
import { getEmpresa } from "@/lib/queries/getSeo";
import { fondoDeRespaldo, vistaEncabezadoCategoria } from "@/lib/repuestos/categoria";
import { gruposDeCategoria } from "@/lib/repuestos/grupos";
import { categoriasDeMarca } from "@/lib/repuestos/marca";
import { vistaPorQue } from "@/lib/repuestos/plantillaTipo";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

type Params = { categoria: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categorias = await getCategoriasRepuestos();
  return categorias.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaRepuestosPorSlug(slug);
  if (!categoria) return METADATA_404;

  return metadataDe({
    nombre: tituloPorDefecto.categoriaRepuestos(categoria.nombre),
    path: rutas.categoriaRepuestos(categoria.slug),
    descripcion: categoria.descripcion,
    seo: categoria.seo,
    imageUrl: imagenDeMedia(categoria.imagen, categoria.nombre)?.url,
  });
}

/** Ancla de «Nuestras categorías de repuestos»: a ella baja el icono de ratón del encabezado. */
const ANCLA_CATEGORIAS = "categorias-repuestos";
const ANCLA_CONTACTO = "contacto-repuestos";

/**
 * PÁGINA DE CATEGORÍA TÉCNICA DE REPUESTOS con la PLANTILLA 4007 de Andrés, la de la marca de
 * repuestos (dirección, 2026-10-22; docs/diseno/decisiones-repuestos-marca.md §12), adaptada:
 *
 * - sin el color de una marca: «Nuestras categorías de repuestos» va sobre el gris (no en la
 *   franja de color) y sin la categoría de la propia página;
 * - sin «Marcas con las que trabajamos»;
 * - en lugar de los tipos de máquina, lo que INCLUYE la categoría: una tarjeta difuminada por
 *   grupo, con su foto de WordPress, «Cotizar» (ventana con el grupo escrito) y «Ver productos»
 *   (`TarjetasGrupos`);
 * - el resto como la marca: contacto, testimonios, «¿Por qué elegirnos?» (sin foto no sale) y
 *   sedes. URL, SEO y migas, como antes.
 */
export default async function CategoriaRepuestosPage({ params }: { params: Promise<Params> }) {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaRepuestosPorSlug(slug);
  if (!categoria) notFound();

  const [global, marcas, categorias, testimonios, empresa, sedes] = await Promise.all([
    getRepuestosMarca(),
    getMarcas(),
    getCategoriasParaMarca(),
    getTestimoniosDePortada(),
    getEmpresa(),
    getSedesDePortada(),
  ]);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const nombre = categoria.nombre.trim();
  const origen = rutas.categoriaRepuestos(categoria.slug);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Categorías", path: rutas.categoriasRepuestos() },
    { nombre, path: origen },
  ];
  const formulario = configContactoMarca({
    origen,
    siteKey: turnstileSiteKey(),
    whatsapp: empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined,
    boton: texto(global.contactoBoton),
    marca: nombre.toLowerCase(),
  });

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={vistaEncabezadoCategoria(categoria, global, fondoDeRespaldo(marcas))}
        anclaSiguiente={ANCLA_CATEGORIAS}
      />

      <CategoriasMarca
        id={ANCLA_CATEGORIAS}
        titulo={texto(global.tituloCategorias)}
        categorias={categoriasDeMarca(categorias.filter((c) => c.id !== categoria.id))}
        fondo="gris"
      />

      <TarjetasGrupos
        id="que-incluye"
        titulo={`Qué incluye ${nombre.toLowerCase()}`}
        categoria={nombre}
        grupos={gruposDeCategoria(categoria)}
        formulario={formulario}
        anclaContacto={ANCLA_CONTACTO}
      />

      <ContactoMarca
        id={ANCLA_CONTACTO}
        titulo={texto(global.contactoTitulo)}
        subtitulo={texto(global.contactoSubtitulo)}
        boton={texto(global.contactoBoton)}
        origen={origen}
        siteKey={turnstileSiteKey()}
        whatsapp={empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined}
        marca={nombre.toLowerCase()}
      />

      <SeccionTestimonios
        tarjetas={tarjetasDeTestimonios(testimonios)}
        textos={{
          titulo: texto(global.testimoniosTitulo),
          verVideoTexto: texto(global.verVideoTexto),
        }}
      />

      <PorQueElegirnos
        id="por-que-elegirnos"
        vista={vistaPorQue(global, null)}
        anclaContacto={ANCLA_CONTACTO}
        formulario={formulario}
      />

      <SedesCompactas id="sedes-repuestos" sedes={sedesDePortada(sedes)} />
    </main>
  );
}
