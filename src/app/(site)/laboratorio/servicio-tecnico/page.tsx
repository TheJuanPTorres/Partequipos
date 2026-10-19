import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlantillaServicioTecnico } from "@/components/servicioTecnico/PlantillaServicioTecnico";
import { idsDeVideos, vistaDeBloques, vistaDeVideo } from "@/lib/bloques/desdePayload";
import { getRecursosServicioTecnicoLab } from "@/lib/queries/getLaboratorio";
import { getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { getEmpresa } from "@/lib/queries/getSeo";
import { getVideoPorId } from "@/lib/queries/getVideos";
import { vistaServicioTecnico } from "@/lib/servicioTecnico/vista";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

/**
 * LABORATORIO — MUESTRA DEL DISEÑO PROPIO DE SERVICIO TÉCNICO (2026-10-19),
 * para que dirección la apruebe antes de aplicarla a `/servicio-tecnico/`.
 *
 * Pinta el CONTENIDO REAL de la página (sus bloques en Payload, los mismos que
 * hoy sirve `/servicio-tecnico/`) con `PlantillaServicioTecnico`, más los tres
 * ficheros que faltaban frente a WordPress (`importar.ts solo=faltantes`).
 *
 * 404 EN PRODUCCIÓN (`VERCEL_ENV`), `noindex` y fuera del sitemap
 * (`RUTAS_FUERA_DEL_SITEMAP`), como el laboratorio de movimiento. Dinámica:
 * lee la base en cada visita (es un instrumento, no una página del sitio).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Laboratorio · Servicio técnico",
  robots: { index: false, follow: false },
};

export default async function LaboratorioServicioTecnico() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const pagina = await getPaginaPorSlug("servicio-tecnico");
  if (!pagina) notFound();
  const [videos, recursos, empresa] = await Promise.all([
    Promise.all(idsDeVideos(pagina.bloques).map((id) => getVideoPorId(id))),
    getRecursosServicioTecnicoLab(),
    getEmpresa(),
  ]);
  const porId = new Map(videos.flatMap((v) => (v ? [[v.id, v] as const] : [])));
  const vista = vistaServicioTecnico(vistaDeBloques(pagina.bloques, porId), {
    etapas: vistaDeVideo(recursos.etapas),
    fondo: vistaDeVideo(recursos.fondo),
    textura: imagenDeMedia(recursos.textura, ""),
    miniaturaYoutube: imagenDeMedia(recursos.miniaturaYoutube, ""),
  });

  return (
    <main>
      <PlantillaServicioTecnico
        vista={vista}
        whatsapp={enlaceWhatsApp(empresa.whatsapp, "Hola, necesito un técnico para mi maquinaria.")}
        siteKey={turnstileSiteKey()}
        origen="/servicio-tecnico/"
      />
    </main>
  );
}
