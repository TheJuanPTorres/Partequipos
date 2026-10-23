import type { Documento, Pie } from "@/payload-types";

import { vistaDeDocumento, type VistaDocumentoVisor } from "./documentos/visor";
import { validarEnlace } from "./fields/reglasPortada";
import { enlaceWhatsApp } from "./navegacion";
import { poblado } from "./utils/relations";

/**
 * PIE DEL SITIO — lógica pura del global `pie` (docs/diseno/decisiones-home-ux9.md
 * §13). Las redes y el contacto salen del global `seo` (`getEmpresa`), que es la
 * fuente única del JSON-LD `Organization`; aquí solo se decide qué red es cada
 * dirección (`redDelPie`).
 */

/**
 * Un enlace del pie. `externo`: una dirección https:// de otro sitio, que se abre en una pestaña
 * nueva (2026-10-22, «Zona de clientes» y la PQRSF). `documento`: el PDF que se abre en el
 * visor (`href` es el PDF, para abrirlo sin JavaScript).
 */
export type EnlacePie = {
  etiqueta: string;
  href: string;
  interno: boolean;
  externo?: boolean;
  documento?: VistaDocumentoVisor;
};
export type ColumnaPie = { titulo: string; enlaces: EnlacePie[] };

/** Redes que el pie sabe pintar: las cinco de ux-9, Instagram y WhatsApp. */
export type RedPie =
  "LinkedIn" | "X" | "Facebook" | "Instagram" | "TikTok" | "YouTube" | "WhatsApp";

const PATRONES_RED: ReadonlyArray<readonly [RegExp, RedPie]> = [
  [/^https:\/\/([a-z]+\.)?linkedin\.com\//i, "LinkedIn"],
  [/^https:\/\/(www\.)?(x|twitter)\.com\//i, "X"],
  [/^https:\/\/([a-z]+\.)?facebook\.com\//i, "Facebook"],
  [/^https:\/\/(www\.)?instagram\.com\//i, "Instagram"],
  [/^https:\/\/(www\.)?tiktok\.com\//i, "TikTok"],
  [/^https:\/\/(www\.)?youtube\.com\//i, "YouTube"],
];

/**
 * Qué red es una dirección del panel, o `null` si el pie no la pinta (sigue
 * en el JSON-LD `sameAs`). Mira el HOST, no cualquier parte de la URL: un
 * `https://ejemplo.com/facebook.html` no es Facebook.
 */
export function redDelPie(url: string): RedPie | null {
  const limpia = url.trim();
  return PATRONES_RED.find(([patron]) => patron.test(limpia))?.[1] ?? null;
}

/**
 * Orden de las redes en el pie: el de ux-9 (LinkedIn, X, Facebook, TikTok y
 * YouTube, export 2178 del 2026-10-05) y después Instagram, que ux-9 no pinta
 * pero el cliente tiene. No depende del orden en que se escriban en el panel.
 */
export const ORDEN_REDES: readonly RedPie[] = [
  "LinkedIn",
  "X",
  "Facebook",
  "TikTok",
  "YouTube",
  "Instagram",
  "WhatsApp",
];

/**
 * Las redes del panel que el pie pinta, en el orden de ux-9. Si una red se
 * repite, sale la primera; las que el pie no sabe pintar se quedan solo en el
 * JSON-LD `sameAs`. WhatsApp (2026-10-22) no es una red del panel: sale del
 * número de la empresa, al final, y no entra en el `sameAs`.
 */
export function redesDelPie(
  urls: readonly string[],
  whatsapp?: string | null,
): { nombre: RedPie; url: string }[] {
  const porRed = new Map<RedPie, string>();
  if (whatsapp?.trim()) porRed.set("WhatsApp", enlaceWhatsApp(whatsapp));
  for (const url of urls) {
    const nombre = redDelPie(url);
    if (nombre && !porRed.has(nombre)) porRed.set(nombre, url.trim());
  }
  return ORDEN_REDES.flatMap((nombre) => {
    const url = porRed.get(nombre);
    return url ? [{ nombre, url }] : [];
  });
}

/** Una dirección https:// del propio sitio (partequipos.com o el dominio publicado): no es externa. */
function esDelSitio(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "partequipos.com" ||
      host === "www.partequipos.com" ||
      host === "partequipos.vercel.app"
    );
  } catch {
    return false;
  }
}

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
  if (siblingData?.tipo === "telefono" || siblingData?.tipo === "documento") return true;
  if (typeof valor !== "string" || !valor.trim()) {
    return "Indica adónde lleva el enlace: una ruta del sitio (/…) o una dirección https://.";
  }
  return validarEnlace(valor);
}

/** Validación del documento de un enlace del pie: obligatorio con el tipo «Documento en el visor». */
export function validarDocumentoPie(
  valor: unknown,
  { siblingData }: { siblingData?: { tipo?: string | null } },
): true | string {
  if (siblingData?.tipo !== "documento") return true;
  return valor ? true : "Elige el documento de «Documentos» que abre este enlace.";
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
      if (e.tipo === "documento") {
        const documento = vistaDeDocumento(poblado<Documento>(e.documento), etiqueta);
        return documento ? [{ etiqueta, href: documento.pdf.url, interno: false, documento }] : [];
      }
      const destino = e.destino?.trim();
      if (!destino || validarEnlace(destino) !== true) return [];
      const interno = destino.startsWith("/");
      const externo = !interno && !esDelSitio(destino);
      return [{ etiqueta, href: destino, interno, ...(externo ? { externo } : {}) }];
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
          destino: "/maquinaria-pesada/maquinaria-pesada-nueva/tipos/",
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
