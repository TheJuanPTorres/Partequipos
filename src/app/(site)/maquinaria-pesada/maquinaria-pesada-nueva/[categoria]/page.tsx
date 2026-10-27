import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BannerMarcaTipo } from "@/components/nueva/BannerMarcaTipo";
import estilosKit from "@/components/nueva/kit/kit.module.css";
import { TarjetaKit } from "@/components/nueva/kit/TarjetaKit";
import estilosTarjetas from "@/components/nueva/marcaNueva.module.css";
import { BarraSeries } from "@/components/repuestos/BarraSeries";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { metadataSinIndexar } from "@/lib/filtros/seo";
import {
  barraDeMarcas,
  gruposPorMarcaYTipo,
  sinAditamentos,
  tituloBannerTipoNueva,
  vistaEncabezadoCategoriaNueva,
} from "@/lib/nueva/paginaCategoria";
import { tintaSobre } from "@/lib/marca/colorMarca";
import { conAlt, logoDeMarca } from "@/lib/marca/logoMarca";
import { vistaBanner } from "@/lib/nueva/bannerMarca";
import { columnaDeTarjeta } from "@/lib/nueva/paginaKit";
import { getLogosMarca } from "@/lib/queries/getLogosMarca";
import {
  getEquiposDeTipos,
  getListadoNueva,
  getMarcasMaquinaria,
} from "@/lib/queries/getMaquinaria";
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
import type { Media } from "@/payload-types";

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
  // Solo marcas: sin los aditamentos, que tienen su página (dirección, 2026-10-23).
  return { categoria, equipos: sinAditamentos(await getEquiposDeTipos(categoria.tipos)) };
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
 * regla de tarjetas, y el formulario al final. Desde el 2026-10-23 es también la PÁGINA GENERAL
 * de cada tipo (tarea 9): banner «Maquinaria Pesada {Nombre} Nuevo/Nueva», sin el título «Modelos de …»,
 * y solo marcas: sin los aditamentos. Desde el 2026-10-26 (prototipo del cliente «Excavadoras
 * nuevas», portado): la cabecera con la foto de la categoría del panel, y cada grupo (marca y
 * tipo) empieza con el BANNER de su marca (`BannerMarcaTipo`, en lugar de la franja del #349 y
 * sin el conteo de modelos) seguido de las tarjetas del «Kit de marca» (`TarjetaKit`), en el
 * orden del campo «Orden», 3 por fila y la última fila centrada. Las URL de su antigua paginación (`pagina/<n>/`)
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

  const [global, empresa, logos, marcas] = await Promise.all([
    getRepuestosMarca(),
    getEmpresa(),
    getLogosMarca(),
    getMarcasMaquinaria(),
  ]);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const grupos = gruposPorMarcaYTipo(equipos);
  // Cada grupo empieza con el banner de su marca, también con una sola marca. La marca, con sus
  // imágenes pobladas (`getMarcasMaquinaria`): el logo (el único del sitio), el color y la foto.
  const marcaConLogo = new Map(marcas.map((m) => [m.slug, m]));
  const logoDe = (m: (typeof grupos)[number]["marca"]) =>
    conAlt(logoDeMarca(marcaConLogo.get(m.slug) ?? m, logos), `Logo de ${m.nombre}`);
  // Con 2 o más marcas, la barra de marcas fija arriba (la de series de repuestos, R2).
  const pastillas = barraDeMarcas(grupos, logoDe);

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={vistaEncabezadoCategoriaNueva(
          tituloBannerTipoNueva(categoria.nombre),
          categoria.descripcion,
          equipos,
          categoria.foto as Media | null,
        )}
        anclaSiguiente={ANCLA_MODELOS}
        bajaSinFoto
      />

      {/* Sin el título «Modelos de …» (dirección, 2026-10-23): la sección se nombra para los
          lectores de pantalla. */}
      <section
        id={ANCLA_MODELOS}
        className={estilosTarjetas.seccionTipo}
        aria-label={`Modelos de ${titulo}`}
      >
        {pastillas.length > 0 ? (
          <BarraSeries
            series={pastillas}
            etiqueta="Marcas"
            className={estilosTarjetas.barraMarcas}
            grande
          />
        ) : null}
        {grupos.length > 0 ? (
          grupos.map((g, i) => {
            const marca = marcaConLogo.get(g.marca.slug) ?? g.marca;
            const vista = vistaBanner(marca);
            const nombre = g.marca.nombre.trim();
            return (
              <div
                key={g.clave}
                id={`grupo-${g.clave}`}
                className={`${estilosTarjetas.grupoMarca} ${estilosTarjetas.grupoKit}`}
                style={
                  { "--acento": vista.acento, "--tinta": tintaSobre(vista.acento) } as CSSProperties
                }
              >
                {/* `h2` en el banner: los nombres de las tarjetas (`TarjetaKit`) son `h3`. */}
                <BannerMarcaTipo
                  id={`grupo-${g.clave}-t`}
                  titulo={g.titulo}
                  marca={{ nombre, href: `${rutas.marcaMaquinaria(g.marca.slug)}/` }}
                  logo={logoDe(g.marca)}
                  vista={vista}
                />
                <ul className={`${estilosKit.rejilla} ${estilosTarjetas.rejillaKit}`}>
                  {g.tarjetas.map((e, j) => (
                    <TarjetaKit
                      key={e.id}
                      equipo={e}
                      columna={columnaDeTarjeta(j, g.tarjetas.length)}
                      marca={nombre}
                      origen={`${rutas.categoriaNueva(categoria.slug)}/`}
                      anclaContacto={ANCLA_CONTACTO}
                      prioridad={i === 0 && j < 3}
                    />
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <p>{`Todavía no hay equipos publicados de ${titulo}.`}</p>
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
