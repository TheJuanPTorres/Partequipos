import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { SeccionTestimonios } from "@/components/portada/diferidos";
import { CategoriasMarca } from "@/components/repuestos/CategoriasMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { InterruptorMejoras } from "@/components/repuestos/InterruptorMejoras";
import { PorQueElegirnos } from "@/components/repuestos/PorQueElegirnos";
import { SedesCompactas } from "@/components/repuestos/SedesCompactas";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getMarcaPorSlug, getMarcas } from "@/lib/queries/getMarcas";
import { getModelosDeMarca, getModelosPorIds } from "@/lib/queries/getModelos";
import {
  getCategoriasParaMarca,
  getRepuestosMarca,
  getTiposDeMarcaConImagen,
} from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { estiloDeMarca } from "@/lib/marca/colorMarca";
import { categoriasDeMarca, tarjetasDeTipos, vistaEncabezado } from "@/lib/repuestos/marca";
import { idsDeOtrasEntradas, listaDeModelos } from "@/lib/repuestos/tipo";
import { MEJORAS_ACTIVAS } from "@/lib/repuestos/mejoras";
import { vistaPorQue } from "@/lib/repuestos/plantillaTipo";
import { sedesDePortada } from "@/lib/portada/sedes";
import { getSedesDePortada } from "@/lib/queries/getSedes";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { turnstileSiteKey } from "@/lib/turnstile";
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

  // Título y descripción del bloque SEO de la marca o, vacíos, los de
  // siempre. Imagen al compartir: la del bloque o, sin ella, la del sitio por
  // defecto. El logo ya no: los del cliente son blancos y transparentes, y en
  // WhatsApp o LinkedIn no se verían (2026-10-13).
  return metadataDe({
    nombre: tituloPorDefecto.marcaRepuesto(marca.nombre),
    path: rutas.marca(marca.slug),
    descripcion: marca.descripcion,
    seo: marca.seo,
  });
}

/** Ancla de la franja de categorías: a ella baja el icono de ratón del encabezado. */
const ANCLA_CATEGORIAS = "categorias-repuestos";
const ANCLA_CONTACTO = "contacto-repuestos";

export default async function MarcaPage({ params }: { params: Promise<Params> }) {
  const { marca: marcaSlug } = await params;
  const marca = await getMarcaPorSlug(marcaSlug);
  if (!marca) notFound();

  const [global, tipos, categorias, testimonios, empresa, sedes, modelos] = await Promise.all([
    getRepuestosMarca(),
    getTiposDeMarcaConImagen(marca.id),
    getCategoriasParaMarca(),
    getTestimoniosDePortada(),
    getEmpresa(),
    getSedesDePortada(),
    getModelosDeMarca(marca.id),
  ]);
  // El panel «Ver todo» de cada tarjeta lista lo mismo que la página del tipo, con las
  // «otras entradas» de WordPress (dirección, 2026-10-21).
  const enlazados = await getModelosPorIds(idsDeOtrasEntradas(tipos));
  const modelosDe = (tipo: (typeof tipos)[number]) =>
    listaDeModelos(
      marca,
      tipo,
      modelos.filter((m) => (typeof m.tipo === "number" ? m.tipo : m.tipo?.id) === tipo.id),
      enlazados,
    );

  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
    { nombre: marca.nombre, path: rutas.marca(marca.slug) },
  ];

  return (
    <main className={estilos.pagina} style={estiloDeMarca(marca.colorMarca)}>
      <InterruptorMejoras />
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
        tarjetas={tarjetasDeTipos(marca, tipos, modelosDe)}
        // El estilo «difuminado» de las tarjetas del sitio (dirección, 2026-10-21).
        indice
        panelR5={MEJORAS_ACTIVAS.R5}
      />

      <ContactoMarca
        id={ANCLA_CONTACTO}
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

      <PorQueElegirnos
        id="por-que-elegirnos"
        vista={vistaPorQue(global, marca)}
        anclaContacto={ANCLA_CONTACTO}
        formulario={configContactoMarca({
          origen: rutas.marca(marca.slug),
          siteKey: turnstileSiteKey(),
          whatsapp: empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined,
          boton: texto(global.contactoBoton),
          marca: marca.nombre,
        })}
      />

      <SedesCompactas id="sedes-repuestos" sedes={sedesDePortada(sedes)} />
    </main>
  );
}
