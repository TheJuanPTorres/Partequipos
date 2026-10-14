import { SeccionTestimonios } from "@/components/portada/diferidos";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { turnstileSiteKey } from "@/lib/turnstile";
import { enlaceWhatsApp } from "@/lib/whatsapp";

import { ContactoMarca } from "./ContactoMarca";

/**
 * Cierre común de las páginas de repuestos (PROVISIONAL hasta el diseño de
 * Andrés): el contacto con el formulario y los testimonios de la portada, con
 * los textos del global `repuestos-marca`. Las consultas están memoizadas por
 * petición, así que no se repiten si la página ya las hizo.
 *
 * `origen`: la ruta de la página, que el formulario guarda con la solicitud.
 * `sobre`: de qué trata («Tren de Rodaje», «repuestos»…) para el título accesible.
 */
export async function CierreRepuestos({ origen, sobre }: { origen: string; sobre: string }) {
  const [global, testimonios, empresa] = await Promise.all([
    getRepuestosMarca(),
    getTestimoniosDePortada(),
    getEmpresa(),
  ]);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  return (
    <>
      <ContactoMarca
        titulo={texto(global.contactoTitulo)}
        subtitulo={texto(global.contactoSubtitulo)}
        boton={texto(global.contactoBoton)}
        origen={origen}
        siteKey={turnstileSiteKey()}
        whatsapp={empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined}
        marca={sobre}
      />
      <SeccionTestimonios
        tarjetas={tarjetasDeTestimonios(testimonios)}
        textos={{
          titulo: texto(global.testimoniosTitulo),
          verVideoTexto: texto(global.verVideoTexto),
        }}
      />
    </>
  );
}
