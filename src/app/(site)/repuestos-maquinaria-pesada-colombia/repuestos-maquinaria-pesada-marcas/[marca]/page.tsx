import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { SeccionTestimonios } from "@/components/portada/diferidos";
import { CategoriasMarca } from "@/components/repuestos/CategoriasMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getMarcaPorSlug, getMarcas } from "@/lib/queries/getMarcas";
import {
  getCategoriasParaMarca,
  getRepuestosMarca,
  getTiposDeMarcaConImagen,
} from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { categoriasDeMarca, tarjetasDeLaPagina, vistaEncabezado } from "@/lib/repuestos/marca";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

type Params = { marca: string };

export async function generateStaticParams(): Promise<Params[]> {
  const marcas = await getMarcas();
  return marcas.map((marca) => ({ marca: marca.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { marca: marcaSlug } = await params;
  const marca = await getMarcaPorSlug(marcaSlug);
  if (!marca) return METADATA_404;

  return metadataDe({
    nombre: `Repuestos para maquinaria pesada ${marca.nombre}`,
    path: rutas.marca(marca.slug),
    descripcion: marca.descripcion,
    imageUrl: imagenDeMedia(marca.logo, marca.nombre)?.url,
  });
}

/** Ancla de la franja de categorías: a ella baja el icono de ratón del encabezado. */
const ANCLA_CATEGORIAS = "categorias-repuestos";

export default async function MarcaPage({ params }: { params: Promise<Params> }) {
  const { marca: marcaSlug } = await params;
  const marca = await getMarcaPorSlug(marcaSlug);
  if (!marca) notFound();

  const [global, tipos, categorias, testimonios, empresa] = await Promise.all([
    getRepuestosMarca(),
    getTiposDeMarcaConImagen(marca.id),
    getCategoriasParaMarca(),
    getTestimoniosDePortada(),
    getEmpresa(),
  ]);

  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
    { nombre: marca.nombre, path: rutas.marca(marca.slug) },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca vista={vistaEncabezado(marca, global)} anclaSiguiente={ANCLA_CATEGORIAS} />

      <CategoriasMarca
        id={ANCLA_CATEGORIAS}
        titulo={texto(global.tituloCategorias)}
        categorias={categoriasDeMarca(categorias)}
      />

      <TarjetasMarca
        id="repuestos-marca-tipos"
        titulo={texto(global.tituloTipos)}
        verTodo={texto(global.verTodoTexto)}
        tarjetas={tarjetasDeLaPagina(marca, tipos, global)}
      />

      <ContactoMarca
        titulo={texto(global.contactoTitulo)}
        subtitulo={texto(global.contactoSubtitulo)}
        boton={texto(global.contactoBoton)}
        origen={rutas.marca(marca.slug)}
        siteKey={turnstileSiteKey()}
        whatsapp={empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined}
        marca={marca.nombre}
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
