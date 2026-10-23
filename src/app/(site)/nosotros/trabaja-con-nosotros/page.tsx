import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { ZonaAnimada } from "@/components/repuestos/ZonaAnimada";
import { JsonLd } from "@/components/seo/JsonLd";
import { Vacantes } from "@/components/trabaja/Vacantes";
import { metadataFiltrada } from "@/lib/filtros/seo";
import { getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { rutas } from "@/lib/routes";
import { absoluteUrl, indexacionPermitida } from "@/lib/seo/config";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { ANIMACIONES_TRABAJA } from "@/lib/trabaja/animaciones";
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
 * - Encabezado BAJO de las páginas índice («Plantilla 1») y «Únete a nuestro equipo»
 *   con las vacantes: cada tarjeta lleva «Ver oferta» (a Buk) y «Enviar HV», que abre la
 *   ventana del formulario con la hoja de vida en PDF (`/api/hoja-de-vida/`; el PDF va de
 *   adjunto por correo y NO se guarda). El bloque «¿No ves una oferta para tu perfil?» se
 *   quitó el 2026-10-23.
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

      {/* Las mejoras T1–T5 (`animaciones.ts`): en un preview, `?anim=T1,T3`; en el publicado, el
          parámetro no hace nada. */}
      <ZonaAnimada
        interruptores={ANIMACIONES_TRABAJA}
        permitirUrl={process.env.VERCEL_ENV !== "production"}
      >
        {/* Cabecera BAJA (Juan Pablo, 2026-10-23): 380 px (420 en móvil), centrada en vertical. */}
        <HeroMarca vista={vista.encabezado} anclaSiguiente={ANCLA} franja={false} indice bajo />

        <Vacantes
          id={ANCLA}
          titulo={vista.equipo.titulo}
          texto={vista.equipo.texto}
          vacantes={aplicarFiltro(resultado.vacantes, filtro)}
          ciudades={ciudades}
          filtro={filtro}
          ruta={ruta}
          clave={filtro.tipo === "ciudad" ? `${ruta}?ciudad=${filtro.ciudad.slug}` : ruta}
        />
      </ZonaAnimada>

      {/* Sin la tarjeta roja del pie («Ofrecemos Soluciones…», para compradores): la página es
          para trabajadores y ya cierra con «¿No ves una oferta para tu perfil?» (Juan Pablo). */}
      <PieSinTarjeta />
    </main>
  );
}
