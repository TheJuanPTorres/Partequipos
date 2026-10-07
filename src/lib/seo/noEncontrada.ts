import type { Metadata } from "next";

/**
 * Título y descripción de la página 404 (auditoría de C, I3 y M11). Los usan
 * `(site)/not-found.tsx` y el `generateMetadata` de las rutas que, sin
 * registro, terminan en `notFound()`: así el `<title>` del HTML del servidor
 * ya es el de la 404 (antes llegaba «Partequipos» y React añadía otro).
 * Next añade `noindex` a las respuestas 404 por su cuenta.
 */
export const METADATA_404: Metadata = {
  title: "Página no encontrada | Partequipos",
  description:
    "La página que buscas no existe o cambió de dirección. Encuentra maquinaria pesada, repuestos y servicio técnico en Partequipos.",
};
