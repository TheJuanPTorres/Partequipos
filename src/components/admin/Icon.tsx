import { seoConfig } from "@/lib/seo/config";

/**
 * Icono del panel: aparece en la barra lateral y en espacios reducidos, donde
 * el logotipo completo no cabe.
 */
export default function Icon() {
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
      style={{ width: "auto", height: 22 }}
    />
  );
}
