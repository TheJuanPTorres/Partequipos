import { rutas } from "./routes";

/**
 * Menú de la CABECERA de ux-9 (plantilla 2162): los cuatro de Andrés, con
 * nuestras rutas. «Contáctanos» va aparte, como botón.
 */
export const navegacionCabecera = [
  { etiqueta: "Maquinaria Pesada", href: `${rutas.maquinaria()}/` },
  { etiqueta: "Repuestos", href: `${rutas.repuestos()}/` },
  { etiqueta: "Lubricantes", href: "/lubricantes/lubricantes-eni/" },
  { etiqueta: "Servicio Técnico", href: "/servicio-tecnico/" },
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
