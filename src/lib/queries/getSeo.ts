import { getPayload } from "payload";
import { cache } from "react";

import config from "@payload-config";

import { imagenDeAcceso, type ImagenAcceso } from "../panel/acceso";
import { datosEmpresa, type Empresa } from "../seo/empresa";
import { tramosValidos, type Tramo } from "../seo/horario";
import {
  logoDelSitio,
  urlImagenSocialPorDefecto,
  urlLogoBuscadores,
  type ImagenLogo,
} from "../seo/logo";

/**
 * El global `seo`, UNA consulta por petición para todo lo de abajo. `depth: 1`
 * para poblar las imágenes del global (logo, imagen al compartir y la de la
 * pantalla de acceso).
 */
const getSeoGlobal = cache(async () => {
  const payload = await getPayload({ config });
  return payload.findGlobal({ slug: "seo", depth: 1 });
});

/**
 * Horario de atención del global `seo` (fase 6), listo para usar. Memoizado
 * por petición, como el resto de consultas (§10.10).
 */
export const getHorario = cache(async (): Promise<Tramo[]> => {
  const seo = await getSeoGlobal();
  return tramosValidos(seo.horario);
});

/**
 * Contacto de la empresa del global `seo`, con el respaldo de `config.ts`
 * campo a campo (`src/lib/seo/empresa.ts`). Memoizado por petición.
 */
export const getEmpresa = cache(async (): Promise<Empresa> => {
  const seo = await getSeoGlobal();
  return datosEmpresa(seo.empresa);
});

/**
 * Logo institucional (§10.8) para cada sitio donde sale, con el respaldo de
 * siempre si el campo está vacío (`src/lib/seo/logo.ts`).
 */
export const getLogo = cache(
  async (): Promise<{ sitio: ImagenLogo; buscadores: string; social: string }> => {
    const { logo, imagenSocial } = await getSeoGlobal();
    return {
      sitio: logoDelSitio(logo),
      buscadores: urlLogoBuscadores(logo),
      social: urlImagenSocialPorDefecto(logo, imagenSocial),
    };
  },
);

/**
 * Imagen del panel visual de la pantalla de acceso al panel (`imagenAcceso`
 * del global `seo`), o `null` si está vacía o si falla la consulta: el acceso
 * nunca depende de una imagen, así que un fallo aquí pinta el degradado.
 */
export const getImagenAcceso = cache(async (): Promise<ImagenAcceso | null> => {
  try {
    return imagenDeAcceso((await getSeoGlobal()).imagenAcceso);
  } catch (error) {
    console.error("[acceso] no se pudo leer la imagen de la pantalla de acceso:", error);
    return null;
  }
});
