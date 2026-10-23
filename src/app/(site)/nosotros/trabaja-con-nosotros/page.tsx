import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { HojaDeVida } from "@/components/trabaja/HojaDeVida";
import { Vacantes } from "@/components/trabaja/Vacantes";
import { metadataFiltrada } from "@/lib/filtros/seo";
import { getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { rutas } from "@/lib/routes";
import { absoluteUrl, indexacionPermitida } from "@/lib/seo/config";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { obtenerVacantes } from "@/lib/vacantes/fuente";
import {
  aplicarFiltro,
  ciudadesDe,
  filtroPedido,
  MIN_VACANTES_PARA_FILTRO,
  vistaTrabaja,
} from "@/lib/vacantes/vista";

/**
 * «TRABAJA CON NOSOTROS» (`/nosotros/trabaja-con-nosotros/`, la URL de
 * WordPress; plantilla de Andrés, 2026-10-23). Del 2026-10-14 al 22 esta URL
 * redirigía al portal de Buk.
 *
 * - Encabezado de las páginas índice («Plantilla 1»), «Únete a nuestro equipo»
 *   con las vacantes y «¿No ves una oferta para tu perfil?» con el botón al
 *   portal de Buk (no guardamos datos personales).
 * - Las vacantes salen SOLO de `obtenerVacantes()` (`src/lib/vacantes/`): hoy
 *   leen el portal público de Buk cada 6 horas como mucho, con la última copia
 *   buena si falla; mañana, la API oficial, sin tocar esta página.
 * - SEO: el de la página institucional `nosotros/trabaja-con-nosotros` del
 *   panel (con el de WordPress), si existe; si no, el de aquí. El filtro por
 *   ciudad (`?ciudad=…`, solo con 8 o más vacantes) no se indexa y su canónica
 *   es la página sin filtro; un valor que no existe redirige a ella.
 *
 * Se pinta en cada petición (lee la query del filtro), con los datos en caché.
 */
const SLUG_PAGINA = "nosotros/trabaja-con-nosotros";
const TITULO = "Trabaja con nosotros";
const DESCRIPCION =
  "Descubre emocionantes oportunidades laborales y Trabaja con Nosotros. Entra a nuestro mundo y encuentra tu lugar en Partequipos";
const ANCLA = "vacantes";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ ciudad }, pagina] = await Promise.all([searchParams, getPaginaPorSlug(SLUG_PAGINA)]);
  const ruta = rutas.trabajaConNosotros();
  const base = await metadataDe({
    nombre: TITULO,
    path: ruta,
    descripcion: DESCRIPCION,
    seo: pagina?.seo,
  });
  return ciudad === undefined
    ? base
    : metadataFiltrada(base, absoluteUrl(ruta), indexacionPermitida());
}

export default async function TrabajaConNosotrosPage({ searchParams }: Props) {
  const ruta = `${rutas.trabajaConNosotros()}/`;
  const [{ ciudad }, indice, resultado] = await Promise.all([
    searchParams,
    getPaginasIndice(),
    obtenerVacantes(),
  ]);
  const filtro = filtroPedido(resultado.vacantes, ciudad);
  if (filtro.tipo === "invalido") permanentRedirect(ruta);

  const vista = vistaTrabaja(indice.trabaja);
  const ciudades =
    resultado.vacantes.length >= MIN_VACANTES_PARA_FILTRO ? ciudadesDe(resultado.vacantes) : [];
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Nosotros", path: "/nosotros" },
    { nombre: TITULO, path: rutas.trabajaConNosotros() },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca vista={vista.encabezado} anclaSiguiente={ANCLA} franja={false} indice />

      <Vacantes
        id={ANCLA}
        titulo={vista.equipo.titulo}
        texto={vista.equipo.texto}
        vacantes={aplicarFiltro(resultado.vacantes, filtro)}
        ciudades={ciudades}
        filtro={filtro}
        ruta={ruta}
      />

      <HojaDeVida bloque={vista.hojaDeVida} />
    </main>
  );
}
