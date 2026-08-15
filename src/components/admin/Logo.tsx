import { seoConfig } from "@/lib/seo/config";

/**
 * Logotipo de la pantalla de inicio de sesión del panel.
 *
 * Server Component: es marcado estático. Se usa `<img>` y no `next/image`
 * porque el panel de Payload se sirve fuera del grupo de rutas del sitio y no
 * pasa por el optimizador; forzarlo aquí no aporta nada y añade una dependencia
 * innecesaria a una pantalla que se ve una vez al día.
 *
 * La URL sale de `seoConfig`, la misma fuente que la cabecera del sitio: si el
 * logo cambia, cambia en los dos sitios a la vez.
 */
export default function Logo() {
  return (
    /*
     * eslint-disable-next-line @next/next/no-img-element --
     * El panel de Payload se sirve fuera del grupo de rutas del sitio y no pasa
     * por el optimizador de next/image. Aquí <img> es lo correcto; el aviso de
     * LCP no aplica a una pantalla interna que se ve una vez al día.
     */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={seoConfig.logoPath}
      alt={seoConfig.siteName}
      width={1614}
      height={317}
      style={{ width: "100%", maxWidth: 260, height: "auto" }}
    />
  );
}
