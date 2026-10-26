import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { EmblemaKit } from "@/components/nueva/kit/EmblemaKit";
import { SeccionTestimonios } from "@/components/portada/diferidos";
import { BienvenidaMarca } from "@/components/repuestos/BienvenidaMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { PorQueElegirnos } from "@/components/repuestos/PorQueElegirnos";
import { SedesCompactas } from "@/components/repuestos/SedesCompactas";
import { TarjetasGrupos } from "@/components/repuestos/TarjetasGrupos";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { colorDeMarca, estiloDeMarca } from "@/lib/marca/colorMarca";
import { conAlt, logoPropio } from "@/lib/marca/logoMarca";
import { sedesDePortada } from "@/lib/portada/sedes";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import {
  getCategoriasRepuestos,
  getSubcategoriaRepuestos,
} from "@/lib/queries/getCategoriasRepuestos";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getSedesDePortada } from "@/lib/queries/getSedes";
import { getEmpresa } from "@/lib/queries/getSeo";
import { fondoDeRespaldo, vistaEncabezadoCategoria } from "@/lib/repuestos/categoria";
import { gruposDeCategoria } from "@/lib/repuestos/grupos";
import { vistaBienvenida, vistaPorQuePropia } from "@/lib/repuestos/paginaMarca";
import { vistaPorQue } from "@/lib/repuestos/plantillaTipo";
import { esCategoriaPrincipal, rutaDeCategoriaTecnica } from "@/lib/repuestos/subcategorias";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

import type { CategoriasTecnica } from "@/payload-types";

type Params = { categoria: string; subcategoria: string };

/** Las páginas que cuelgan de una categoría técnica (Filtros Donaldson, 2026-10-26). */
export async function generateStaticParams(): Promise<Params[]> {
  const todas = await getCategoriasRepuestos();
  return todas.flatMap((c) => {
    const padre = poblado<CategoriasTecnica>(c.padre);
    if (esCategoriaPrincipal(c) || !padre?.slug) return [];
    return [{ categoria: padre.slug, subcategoria: c.slug }];
  });
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria: padreSlug, subcategoria: slug } = await params;
  const sub = await getSubcategoriaRepuestos(padreSlug, slug);
  if (!sub) return METADATA_404;
  return metadataDe({
    nombre: tituloPorDefecto.categoriaRepuestos(sub.nombre),
    path: rutas.subcategoriaRepuestos(padreSlug, sub.slug),
    descripcion: sub.descripcion,
    seo: sub.seo,
    imageUrl: imagenDeMedia(sub.imagen, sub.nombre)?.url,
  });
}

/** Ancla de los tipos de producto: a ella baja el icono de ratón del encabezado. */
const ANCLA_GRUPOS = "productos-subcategoria";
const ANCLA_CONTACTO = "contacto-repuestos";

/**
 * PÁGINA DENTRO DE UNA CATEGORÍA TÉCNICA (2026-10-26, dirección: «Filtros Donaldson» dentro de
 * «Filtración», en su URL de WordPress), con la MISMA plantilla 4007 que las categorías: la
 * cabecera (con el logo de la marca sobre el título), una tarjeta por tipo de producto con su
 * foto, su descripción y «Cotizar», la presentación con su carrusel (2026-10-26), el contacto,
 * los testimonios, «¿Por qué elegirnos?» (el propio si lo tiene) y las sedes. Las migas pasan por su categoría. Solo responde bajo la categoría de la que cuelga.
 */
export default async function SubcategoriaRepuestosPage({ params }: { params: Promise<Params> }) {
  const { categoria: padreSlug, subcategoria: slug } = await params;
  const sub = await getSubcategoriaRepuestos(padreSlug, slug);
  const padre = poblado<CategoriasTecnica>(sub?.padre);
  if (!sub || !padre) notFound();

  const [global, marcas, testimonios, empresa, sedes] = await Promise.all([
    getRepuestosMarca(),
    getMarcas(),
    getTestimoniosDePortada(),
    getEmpresa(),
    getSedesDePortada(),
  ]);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const nombre = sub.nombre.trim();
  const origen = rutaDeCategoriaTecnica(sub) ?? rutas.subcategoriaRepuestos(padreSlug, sub.slug);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Categorías", path: rutas.categoriasRepuestos() },
    { nombre: padre.nombre.trim(), path: rutas.categoriaRepuestos(padre.slug) },
    { nombre, path: origen },
  ];
  const formulario = configContactoMarca({
    origen,
    siteKey: turnstileSiteKey(),
    whatsapp: empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined,
    boton: texto(global.contactoBoton),
    marca: nombre.toLowerCase(),
  });
  const bienvenida = vistaBienvenida(sub);
  const encabezado = vistaEncabezadoCategoria(sub, global, fondoDeRespaldo(marcas));
  const vista = {
    ...encabezado,
    // Con texto de bienvenida propio, la cabecera no lo repite (la «Descripción» sigue en buscadores).
    descripcion: bienvenida?.texto ? "" : encabezado.descripcion,
    // El logo de la marca sobre el título, en su cuadrado blanco (como las marcas de repuestos).
    logo: conAlt(logoPropio({ nombre, logo: sub.logo ?? null }), `Logo de ${nombre}`),
  };

  // COLOR Y EMBLEMA DE LA MARCA (2026-10-26, dirección), como las páginas de marca de nueva: el
  // «Color de la marca» tiñe la franja de la cabecera y los botones, y el «Icono de la marca» es
  // el emblema de fondo, grande y gris, que gira despacio con el scroll (`EmblemaKit`). Sin color
  // ni icono, la página de siempre.
  const color = colorDeMarca(sub.colorMarca);
  const emblema = imagenDeMedia(sub.iconoMarca, "") ?? null;

  return (
    <main
      className={`${estilos.pagina} ${color ? estilos.paginaConColor : ""}`}
      style={estiloDeMarca(sub.colorMarca)}
    >
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca vista={vista} anclaSiguiente={ANCLA_GRUPOS} franja={Boolean(color)} />

      <EmblemaKit
        emblema={emblema}
        className={estilos.zonaEmblema}
        // El icono es más alto que ancho: más estrecho que el águila de Case, para que quepa.
        ancho="min(520px, 70vw)"
      >
        <TarjetasGrupos
          id={ANCLA_GRUPOS}
          titulo={`Nuestra línea de ${nombre}`}
          categoria={nombre}
          grupos={gruposDeCategoria(sub)}
          formulario={formulario}
          anclaContacto={ANCLA_CONTACTO}
        />
        <BienvenidaMarca id="presentacion-marca" vista={bienvenida} />
      </EmblemaKit>

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
        vista={vistaPorQuePropia(sub, global) ?? vistaPorQue(global, null)}
        anclaContacto={ANCLA_CONTACTO}
        formulario={formulario}
      />

      <SedesCompactas id="sedes-repuestos" sedes={sedesDePortada(sedes)} />
    </main>
  );
}
