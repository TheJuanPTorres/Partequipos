import type { Pie } from "@/payload-types";

import { validarEnlace } from "./fields/reglasPortada";

/**
 * PIE DEL SITIO — lógica pura del global `pie` (docs/diseno/decisiones-home-ux9.md
 * §13). Las redes y el contacto NO están aquí: salen de `seoConfig`, que es la
 * fuente única del JSON-LD `Organization`.
 */

export type EnlacePie = { etiqueta: string; href: string; interno: boolean };
export type ColumnaPie = { titulo: string; enlaces: EnlacePie[] };

/** `href` de un teléfono publicado: `tel:+573176707071`. */
export function hrefTelefono(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, "")}`;
}

/**
 * Validación del destino de un enlace del pie: obligatorio si el enlace es a
 * una página; con tipo «teléfono» no se usa (sale de `seoConfig`).
 */
export function validarDestinoPie(
  valor: unknown,
  { siblingData }: { siblingData?: { tipo?: string | null } },
): true | string {
  if (siblingData?.tipo === "telefono") return true;
  if (typeof valor !== "string" || !valor.trim()) {
    return "Indica adónde lleva el enlace: una ruta del sitio (/…) o una dirección https://.";
  }
  return validarEnlace(valor);
}

/**
 * Columnas listas para pintar. Se DESCARTA lo que no tenga etiqueta o destino
 * válido —los datos pueden venir de antes de la validación— y las columnas que
 * se queden sin enlaces.
 */
export function columnasDelPie(columnas: Pie["columnas"], telefono: string): ColumnaPie[] {
  return (columnas ?? []).flatMap((c) => {
    const titulo = c.titulo?.trim();
    if (!titulo) return [];
    const enlaces = (c.enlaces ?? []).flatMap((e): EnlacePie[] => {
      const etiqueta = e.etiqueta?.trim();
      if (!etiqueta) return [];
      if (e.tipo === "telefono")
        return [{ etiqueta, href: hrefTelefono(telefono), interno: false }];
      const destino = e.destino?.trim();
      if (!destino || validarEnlace(destino) !== true) return [];
      return [{ etiqueta, href: destino, interno: destino.startsWith("/") }];
    });
    return enlaces.length ? [{ titulo, enlaces }] : [];
  });
}

/**
 * CONTENIDO INICIAL del global, el que tenía el pie en el código (ux-9 con las
 * desviaciones de §13). Lo siembra la migración que crea el global, para que
 * producción no se quede con el pie vacío al desplegar.
 */
export const PIE_INICIAL: Pick<
  Pie,
  "lema" | "textoBoton" | "empresaTitulo" | "empresaTexto" | "columnas"
> = {
  lema: "Ofrecemos Soluciones para tus Proyectos",
  textoBoton: "WhatsApp",
  empresaTitulo: "Somos una empresa que brinda soluciones integrales",
  empresaTexto:
    "Ayudamos a sectores de la construcción, infraestructura, agroindustria y agregados; especializándonos en la venta de maquinaria pesada, repuestos, servicio técnico y lubricantes",
  columnas: [
    {
      titulo: "Maquinaria pesada",
      enlaces: [
        {
          etiqueta: "Nueva",
          tipo: "pagina",
          destino: "/maquinaria-pesada/maquinaria-pesada-nueva/",
        },
        {
          etiqueta: "Usada",
          tipo: "pagina",
          destino: "/maquinaria-pesada/maquinaria-pesada-usada/",
        },
        {
          etiqueta: "Repuestos",
          tipo: "pagina",
          destino: "/repuestos-maquinaria-pesada-colombia/",
        },
        { etiqueta: "Servicio técnico", tipo: "pagina", destino: "/servicio-tecnico/" },
      ],
    },
    {
      titulo: "Navegación",
      enlaces: [
        { etiqueta: "Inicio", tipo: "pagina", destino: "/" },
        { etiqueta: "Nosotros", tipo: "pagina", destino: "/nosotros/" },
      ],
    },
    {
      titulo: "Contacto",
      enlaces: [
        { etiqueta: "Call center", tipo: "telefono" },
        { etiqueta: "Solicita una cotización", tipo: "pagina", destino: "/contactanos/" },
      ],
    },
  ],
};
