import { ValidationError } from "payload";
import type { CollectionBeforeValidateHook } from "payload";

import { normalizarRuta } from "@/lib/redirects/normalizar";
import { errorDeEnlaces, errorDeImagenesVacias } from "@/lib/paginas/enlacesTexto";
import {
  errorDeFormato,
  errorDeRedireccion,
  errorDeReservada,
  esOrigenFijo,
} from "@/lib/paginas/direccion";

/**
 * «DIRECCIÓN WEB» SEGURA AL GUARDAR UNA PÁGINA (tanda 26, tarea 6): formato, rutas propias de la
 * web y origen de una redirección (`src/lib/paginas/direccion.ts`). Corre en el panel y en la API
 * local (`beforeValidate` de la colección), y SOLO cuando la dirección es nueva o cambia: una
 * página ya guardada con su dirección de siempre se puede seguir editando (la simulación del preview
 * comprueba que todas las actuales pasan; `scripts/paginas/simular-direcciones.ts`).
 */
export const direccionDePaginaValida: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const slug = data?.slug;
  if (typeof slug !== "string" || slug === "") return data; // de eso se encarga `required`
  if (originalDoc && (originalDoc as { slug?: unknown }).slug === slug) return data;

  const titulo = typeof data?.titulo === "string" ? data.titulo : undefined;
  let error = errorDeFormato(slug, titulo) ?? errorDeReservada(slug);
  if (!error) {
    const { totalDocs } = await req.payload.count({
      collection: "redirects",
      where: { desde: { equals: normalizarRuta(slug) } },
      overrideAccess: true,
      req,
    });
    error = errorDeRedireccion(slug, totalDocs > 0 || esOrigenFijo(slug));
  }
  if (error) throw new ValidationError({ errors: [{ path: "slug", message: error }] });
  return data;
};

/**
 * ENLACES DEL TEXTO, AL GUARDAR (tanda 26, tarea 6): ningún enlace de un texto enriquecido de la
 * página puede llevar `javascript:`, `data:` ni otro esquema que no sea de una página web, un
 * correo o un teléfono, ni quedar un bloque de imagen sin fichero (lo deja pegar desde Word o
 * Docs; `src/lib/paginas/enlacesTexto.ts`). Panel y API local.
 */
export const enlacesDeTextoSeguros: CollectionBeforeValidateHook = ({ data }) => {
  const error = errorDeEnlaces(data) ?? errorDeImagenesVacias(data);
  if (error) throw new ValidationError({ errors: [{ path: "contenido", message: error }] });
  return data;
};
