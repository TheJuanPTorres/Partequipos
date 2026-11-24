import config from "@payload-config";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import { ANCLA_COTIZAR } from "@/components/ficha/FichaProducto";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { enlaceTelefono } from "@/lib/indices/paginasIndice";
import { getFichaProducto } from "@/lib/queries/getFichaProducto";
import { getUnidadUsadaVistaPrevia } from "@/lib/queries/getMaquinaria";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { esPersonal } from "@/lib/seguridad/acceso";
import { articuloDefinido } from "@/lib/seo/porDefecto";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { Media } from "@/payload-types";

import { VistaPreviaUsada } from "./VistaPreviaUsada";

/*
 * VISTA PREVIA EN VIVO de una unidad usada (tanda 21, tarea 3, fase 2, punto 5). La abre el panel
 * en la pestaña «Vista previa en vivo» de «Equipos usados» (`admin.livePreview`) y se actualiza
 * mientras el editor escribe, sin guardar.
 *
 * - SOLO CON SESIÓN del personal (editor o administrador): sin ella, 404, como si no existiera.
 * - `noindex, nofollow` y FUERA DEL SITEMAP (`RUTAS_FUERA_DEL_SITEMAP`).
 * - Es la única ruta que carga `@payloadcms/live-preview-react` (lo vigila
 *   `src/lib/vistaPrevia/livePreviewSoloEnRuta.test.ts`).
 * - Dinámica (lee la sesión): nada de caché.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
};

const texto = (v: string | null | undefined) => v?.trim() ?? "";

export default async function VistaPreviaUsadaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const cabeceras = await headers();
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: cabeceras });
  if (!esPersonal(user)) notFound();

  const data = await getUnidadUsadaVistaPrevia(numero);
  if (!data) notFound();
  const { unidad, categoria } = data;

  const [empresa, ficha, global] = await Promise.all([
    getEmpresa(),
    getFichaProducto(),
    getRepuestosMarca(),
  ]);

  // El origen del panel, que es el de esta página: el iframe solo acepta sus mensajes.
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "";
  const protocolo =
    cabeceras.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origen = `${protocolo}://${host}`;

  const articulo = articuloDefinido(categoria.nombre);
  // El contacto de la ficha, con el nombre guardado (el formulario no cambia al escribir).
  const contacto = {
    origen: "/vista-previa/",
    siteKey: turnstileSiteKey(),
    whatsapp: enlaceWhatsApp(
      empresa.whatsapp,
      `Hola, quiero cotizar ${articulo} ${unidad.nombre}.`,
    ),
    boton: texto(global.contactoBoton),
    marca: unidad.marca ?? "",
    producto: unidad.nombre,
    formulario: {
      titulo: `Cotización: ${unidad.nombre}`,
      conCiudad: true,
      etiquetaMensaje: "¿Qué necesitas?",
    },
  };

  return (
    <VistaPreviaUsada
      inicial={unidad}
      categoria={{ id: categoria.id, slug: categoria.slug, nombre: categoria.nombre }}
      origen={origen}
      empresa={{ telefono: empresa.telefono, whatsapp: empresa.whatsapp }}
      telefono={
        empresa.telefono
          ? { etiqueta: empresa.telefono, href: enlaceTelefono(empresa.telefono) }
          : null
      }
      imagenContacto={imagenDeMedia(ficha.imagenContacto, "")}
      contactoEsFoto={poblado<Media>(ficha.imagenContacto)?.mimeType !== "image/png"}
      formulario={configContactoMarca(contacto)}
      contacto={
        <ContactoMarca
          id={ANCLA_COTIZAR}
          titulo={texto(global.contactoTitulo)}
          subtitulo={texto(global.contactoSubtitulo)}
          {...contacto}
        />
      }
    />
  );
}
