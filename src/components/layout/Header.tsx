import { enlaceWhatsApp } from "@/lib/navegacion";
import { getCabecera } from "@/lib/queries/getCabecera";
import { getMegamenu } from "@/lib/queries/getMegamenu";
import { getEmpresa, getLogo } from "@/lib/queries/getSeo";
import { SLUG_PORTADA, getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { seoConfig } from "@/lib/seo/config";

import { Cabecera } from "./Cabecera";

/**
 * Cabecera del sitio (ux-9, plantilla 2162). Server Component: los enlaces y
 * el botón salen del global `cabecera` del panel; el título de la portada da
 * el nombre del `<h1>` del logo en `/` (D1). El comportamiento, en
 * `Cabecera` (cliente). El megamenú, del catálogo (`getMegamenu`). Consultas
 * memoizadas por petición.
 */
export async function Header() {
  const [portada, cabecera, empresa, logo, paneles] = await Promise.all([
    getPaginaPorSlug(SLUG_PORTADA),
    getCabecera(),
    getEmpresa(),
    getLogo(),
    getMegamenu(),
  ]);
  return (
    <Cabecera
      enlaces={cabecera.enlaces}
      contacto={cabecera.boton}
      whatsapp={enlaceWhatsApp(empresa.whatsapp)}
      logo={logo.sitio}
      nombreSitio={seoConfig.siteName}
      tituloPortada={portada?.titulo ?? seoConfig.siteName}
      paneles={paneles}
    />
  );
}
