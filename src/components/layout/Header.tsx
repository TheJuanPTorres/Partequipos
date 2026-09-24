import { enlaceWhatsApp, navegacionCabecera } from "@/lib/navegacion";
import { SLUG_PORTADA, getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { seoConfig } from "@/lib/seo/config";

import { Cabecera } from "./Cabecera";

/**
 * Cabecera del sitio (ux-9, plantilla 2162). Server Component: consulta el
 * título de la portada —nombre del `<h1>` del logo en `/` (D1)— y delega el
 * comportamiento en `Cabecera` (cliente). Consulta memoizada por petición.
 */
export async function Header() {
  const portada = await getPaginaPorSlug(SLUG_PORTADA);
  return (
    <Cabecera
      enlaces={navegacionCabecera}
      contacto={{ etiqueta: "Contáctanos", href: "/contactanos/" }}
      whatsapp={enlaceWhatsApp(seoConfig.contact.phone)}
      nombreSitio={seoConfig.siteName}
      tituloPortada={portada?.titulo ?? seoConfig.siteName}
    />
  );
}
