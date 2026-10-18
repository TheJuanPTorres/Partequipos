import type { Metadata } from "next";

import { SeccionTestimonios } from "@/components/portada/diferidos";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { ModelosTipo } from "@/components/repuestos/ModelosTipo";
import estilos from "@/components/repuestos/marca.module.css";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getModelosDeTipo } from "@/lib/queries/getModelos";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import { enlacesDeModelos, gruposDeModelos, vistaEncabezadoTipo } from "@/lib/repuestos/tipo";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { Marca, TiposEquipo } from "@/payload-types";

/*
 * El CONTENIDO de la página de tipo de repuestos, común a sus dos rutas:
 * `[marca]/[tipo]` y, para un tipo anidado (la «Excavadora» de CASE,
 * `src/lib/repuestos/anidado.ts`), `[marca]/[tipo]/[modelo]`.
 */

/** Metadatos de la página de un tipo de repuestos. */
export async function metadataTipoRepuestos(marca: Marca, tipo: TiposEquipo): Promise<Metadata> {
  return metadataDe({
    nombre: tituloPorDefecto.tipoRepuesto(tipo.nombre, marca.nombre),
    path: rutas.tipo(marca.slug, segmentoDeTipo(tipo)),
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
export async function PaginaTipoRepuestos({ marca, tipo }: { marca: Marca; tipo: TiposEquipo }) {
  const seg = segmentoDeTipo(tipo);
  const padre = poblado<TiposEquipo>(tipo.tipoPadre);
  const [global, modelos, testimonios, empresa] = await Promise.all([
    getRepuestosMarca(),
    getModelosDeTipo(tipo.id),
    getTestimoniosDePortada(),
    getEmpresa(),
  ]);

  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const enlaces = enlacesDeModelos(marca, tipo, modelos);
  const nombreTipo = tipo.nombre.toLowerCase();
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
    { nombre: marca.nombre, path: rutas.marca(marca.slug) },
    // Un tipo anidado (la «Excavadora» de CASE) cuelga de otro: también en las migas.
    ...(padre && tipo.slugPadre
      ? [{ nombre: padre.nombre, path: rutas.tipo(marca.slug, tipo.slugPadre) }]
      : []),
    { nombre: tipo.nombre, path: rutas.tipo(marca.slug, seg) },
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

      <ContactoMarca
        titulo={texto(global.contactoTitulo)}
        subtitulo={texto(global.contactoSubtitulo)}
        boton={texto(global.contactoBoton)}
        origen={rutas.tipo(marca.slug, seg)}
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
