import { enlaceWhatsApp } from "@/lib/navegacion";
import { getCabecera } from "@/lib/queries/getCabecera";
import { getMegamenu } from "@/lib/queries/getMegamenu";
import { getEmpresa, getLogo } from "@/lib/queries/getSeo";
import { seoConfig } from "@/lib/seo/config";

import { Cabecera } from "./Cabecera";

/**
 * Cabecera del sitio (ux-9, plantilla 2162). Server Component: los enlaces y
 * el botón salen del global `cabecera` del panel. El logo ya no es el `<h1>`
 * de la portada (I1): ese `<h1>` va en `page.tsx`. El comportamiento, en
 * `Cabecera` (cliente). El megamenú, del catálogo (`getMegamenu`). Consultas
 * memoizadas por petición.
 */
export async function Header() {
  const [cabecera, empresa, logo, paneles] = await Promise.all([
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
      paneles={paneles}
    />
  );
}
