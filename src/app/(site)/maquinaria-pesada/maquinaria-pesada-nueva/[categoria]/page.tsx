import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Revelado } from "@/components/movimiento/Revelado";
import { TarjetaEquipo } from "@/components/nueva/TarjetaEquipo";
import estilosTarjetas from "@/components/nueva/marcaNueva.module.css";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { metadataSinIndexar } from "@/lib/filtros/seo";
import { gruposPorMarcaYTipo, vistaEncabezadoCategoriaNueva } from "@/lib/nueva/paginaCategoria";
import { getEquiposDeTipos, getListadoNueva } from "@/lib/queries/getMaquinaria";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { indexacionPermitida } from "@/lib/seo/config";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { descripcionPorDefecto, tituloPorDefecto } from "@/lib/seo/porDefecto";
import { turnstileSiteKey } from "@/lib/turnstile";
import { enlaceWhatsApp } from "@/lib/whatsapp";

type Params = { categoria: string };

const ANCLA_MODELOS = "modelos-categoria-nueva";
const ANCLA_CONTACTO = "contacto-categoria-nueva";

export async function generateStaticParams(): Promise<Params[]> {
  const { categorias } = await getListadoNueva();
  return categorias.map((c) => ({ categoria: c.slug }));
}

/** La categoría y sus equipos (los de los tipos que incluye), por nombre. */
async function resolver(slug: string) {
  const { categorias } = await getListadoNueva();
  const categoria = categorias.find((c) => c.slug === slug);
  if (!categoria) return null;
  return { categoria, equipos: await getEquiposDeTipos(categoria.tipos) };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const datos = await resolver((await params).categoria);
  if (!datos) return METADATA_404;
  const { categoria, equipos } = datos;
  // El mismo título, descripción y canónica que el antiguo listado: el SEO no cambia.
  const base = await metadataDe({
    nombre: tituloPorDefecto.categoriaNueva(categoria.nombre),
    path: rutas.categoriaNueva(categoria.slug),
    descripcion:
      categoria.descripcion?.trim() || descripcionPorDefecto.categoriaNueva(categoria.nombre),
    seo: categoria.seo,
  });
  // Sin equipos, no se indexa (D4); vuelve sola con el primero.
  return equipos.length > 0 ? base : metadataSinIndexar(base, indexacionPermitida());
}

/**
 * CATEGORÍA QUE MEZCLA MARCAS de maquinaria nueva (`/…/nueva/excavadoras/`, cargadores y
 * compactadores), SIN MARKETPLACE (2026-10-22, dirección: en nueva no hay catálogo con filtros
 * en ninguna página). Como la página de tipo de nueva (#310): cabecera, las tarjetas de equipo
 * (`TarjetaEquipo`) agrupadas por marca y tipo con su subtítulo («Excavadoras Hitachi»), con la
 * regla de tarjetas, y el formulario al final. Las URL de su antigua paginación (`pagina/<n>/`)
 * dan 301 aquí; con filtros en la query, la canónica es la de siempre, sin query.
 */
export default async function CategoriaNuevaPage({ params }: { params: Promise<Params> }) {
  const datos = await resolver((await params).categoria);
  if (!datos) notFound();
  const { categoria, equipos } = datos;

  const titulo = tituloPorDefecto.categoriaNueva(categoria.nombre);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nuevaTipos() },
    { nombre: categoria.nombre, path: rutas.categoriaNueva(categoria.slug) },
  ];

  const [global, empresa] = await Promise.all([getRepuestosMarca(), getEmpresa()]);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const grupos = gruposPorMarcaYTipo(equipos);

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={vistaEncabezadoCategoriaNueva(titulo, categoria.descripcion, equipos)}
        anclaSiguiente={ANCLA_MODELOS}
        bajaSinFoto
      />

      <section
        id={ANCLA_MODELOS}
        className={estilosTarjetas.seccionTipo}
        aria-labelledby="modelos-categoria-nueva-t"
      >
        <Revelado
          como="h2"
          id="modelos-categoria-nueva-t"
          ritmo="titulo"
          texto={`Modelos de ${titulo.charAt(0).toLowerCase()}${titulo.slice(1)}`}
          className={estilosTarjetas.tituloTipo}
        />
        {grupos.length > 0 ? (
          grupos.map((g, i) => (
            <div key={g.clave} id={`grupo-${g.clave}`}>
              {/* `h2`: los nombres de las tarjetas (`TarjetaEquipo`) son `h3`. */}
              <h2 className={estilosTarjetas.tituloTipo}>{g.titulo}</h2>
              <ul className={estilosTarjetas.rejilla}>
                {g.tarjetas.map((e, j) => (
                  <TarjetaEquipo
                    key={e.id}
                    equipo={e}
                    anclaContacto={ANCLA_CONTACTO}
                    prioridad={i === 0 && j < 3}
                  />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p>{`Todavía no hay equipos publicados de ${titulo.toLowerCase()}.`}</p>
        )}
      </section>

      <ContactoMarca
        id={ANCLA_CONTACTO}
        titulo={texto(global.contactoTitulo)}
        subtitulo={texto(global.contactoSubtitulo)}
        boton={texto(global.contactoBoton)}
        origen={`${rutas.categoriaNueva(categoria.slug)}/`}
        siteKey={turnstileSiteKey()}
        whatsapp={empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined}
        marca={categoria.nombre}
        formulario={{
          titulo: `Contacto sobre ${titulo.toLowerCase()}`,
          conCiudad: true,
          etiquetaMensaje: "¿En qué estás interesado?",
        }}
      />
    </main>
  );
}
