import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { RichText } from "@/components/layout/RichText";
import { SeccionesLubricante } from "@/components/lubricantes/SeccionesLubricante";
import estilosLubricantes from "@/components/lubricantes/lubricantes.module.css";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { seccionesDeCategorias } from "@/lib/lubricantes/marca";
import {
  getCategoriasDeMarcaLubricante,
  getMarcaLubricantePorSlug,
  getMarcasLubricante,
} from "@/lib/queries/getLubricantes";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

type Params = { marca: string };

/** Ancla de la primera sección bajo la cabecera y del formulario. */
const ANCLA_LINEAS = "lineas";
const ANCLA_CONTACTO = "contacto";

export async function generateStaticParams(): Promise<Params[]> {
  const marcas = await getMarcasLubricante();
  return marcas.map((m) => ({ marca: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { marca: slug } = await params;
  const marca = await getMarcaLubricantePorSlug(slug);
  if (!marca) return METADATA_404;

  return metadataDe({
    nombre: tituloPorDefecto.marcaLubricante(marca.nombre),
    path: rutas.marcaLubricante(marca.slug),
    descripcion: marca.entradilla,
    seo: marca.seo,
    imageUrl: (imagenDeMedia(marca.imagenCabecera, "") ?? imagenDeMedia(marca.logo, marca.nombre))
      ?.url,
  });
}

/**
 * PÁGINA DE UNA MARCA DE LUBRICANTES (`/lubricantes/lubricantes-eni/`) —
 * PROVISIONAL hasta el diseño de Andrés, con el lenguaje de la página de marca
 * de repuestos de D: su cabecera y sus tarjetas, y el formulario al final.
 *
 * Las 4 subpáginas de WordPress (auto liviano, auto pesado, engranajes, motos y
 * scooter) son SECCIONES de esta página desde el 2026-10-14, con su `slug`
 * como ancla y un 301 desde la URL antigua (decisión de dirección; detalle en
 * docs/diseno/decisiones-servicio-lubricantes.md).
 */
export default async function MarcaLubricantePage({ params }: { params: Promise<Params> }) {
  const { marca: slug } = await params;
  const marca = await getMarcaLubricantePorSlug(slug);
  if (!marca) notFound();

  const [categorias, empresa] = await Promise.all([
    getCategoriasDeMarcaLubricante(marca.id),
    getEmpresa(),
  ]);
  const secciones = seccionesDeCategorias(categorias);
  const titulo = `Lubricantes ${marca.nombre}`;

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: titulo, path: rutas.marcaLubricante(marca.slug) },
  ];

  return (
    <main>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <HeroMarca
        vista={{
          linea1: "Lubricantes",
          linea2: marca.nombre,
          descripcion: marca.entradilla?.trim() ?? "",
          fondo: imagenDeMedia(marca.imagenCabecera, ""),
          logo: imagenDeMedia(marca.logo, marca.nombre),
        }}
        anclaSiguiente={ANCLA_LINEAS}
      />

      <TarjetasMarca
        id={ANCLA_LINEAS}
        titulo="Líneas de producto"
        verTodo="Ver productos"
        tarjetas={secciones.map((s) => ({
          clave: s.ancla,
          titulo: s.nombre,
          href: `#${s.ancla}`,
          imagen: s.imagen,
          soloEscritorio: false,
        }))}
      />

      {marca.descripcion ? (
        <div className={`${estilosLubricantes.descripcion} texto-cuerpo`}>
          <RichText data={marca.descripcion} />
        </div>
      ) : null}

      <SeccionesLubricante secciones={secciones} anclaContacto={ANCLA_CONTACTO} />

      <section
        id={ANCLA_CONTACTO}
        className={estilosMarca.contacto}
        aria-labelledby={`${ANCLA_CONTACTO}-titulo`}
        style={{ scrollMarginTop: 110 }}
      >
        <h2 id={`${ANCLA_CONTACTO}-titulo`} className={estilosMarca.tituloContacto}>
          Más información sobre {titulo}
        </h2>
        <div className={estilosMarca.formulario}>
          <FormularioSolicitud
            tipo="contacto"
            origen={`${rutas.marcaLubricante(marca.slug)}/`}
            siteKey={turnstileSiteKey()}
            whatsapp={enlaceWhatsApp(empresa.whatsapp)}
            // Nombre propio para su región: con el mismo que la sección que lo
            // aloja, axe marca landmark-unique (auditoría de D, 2026-10-14).
            titulo={`Formulario de contacto sobre ${titulo}`}
            textoBoton="Obtener más información"
            variante="plano"
          />
        </div>
      </section>
    </main>
  );
}
