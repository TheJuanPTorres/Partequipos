import { rutas } from "./routes";

/**
 * Navegación principal del sitio.
 *
 * Las rutas salen de `lib/routes` (catálogo) o son slugs de páginas
 * institucionales copiados del rastreo — nunca escritas a mano dos veces.
 * Solo se enlaza lo que existe: maquinaria y blog no están construidos y por
 * eso no aparecen todavía.
 */
export const navegacionPrincipal = [
  { etiqueta: "Repuestos", href: `${rutas.repuestos()}/` },
  { etiqueta: "Servicio técnico", href: "/servicio-tecnico/" },
  { etiqueta: "Nosotros", href: "/nosotros/" },
  { etiqueta: "Contacto", href: "/contactanos/" },
] as const;

/** Enlaces legales del pie. Slugs copiados literalmente del rastreo. */
export const navegacionLegal = [
  { etiqueta: "Política de garantías", href: "/politica-de-garantia-de-repuestos/" },
  { etiqueta: "Tratamiento de datos", href: "/tratamiento-de-datos/" },
  { etiqueta: "Código de ética", href: "/codigo-de-etica-partequipos/" },
  {
    etiqueta: "Términos campaña bonos",
    href: "/terminos-y-condiciones-campana-bonos-de-recompra/",
  },
] as const;

/** Construye el enlace de WhatsApp a partir del teléfono publicado. */
export function enlaceWhatsApp(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, "");
  return `https://wa.me/${soloDigitos}`;
}
