/**
 * Siembra las páginas institucionales y legales.
 *
 * Uso:  npm run seed:paginas
 *
 * Idempotente: busca por slug y actualiza si existe, crea si no. Correrlo dos
 * veces no duplica nada.
 *
 * Los slugs se copian LITERALMENTE del rastreo (`docs/url-map.csv`): son URLs
 * indexadas y la jerarquía es intocable (CLAUDE.md §3.3).
 *
 * El contenido es de RELLENO, redactado para esta demo. No se copia texto del
 * sitio actual: es material del cliente y aún no hay contrato firmado. Los
 * textos legales son deliberadamente genéricos y NO tienen validez jurídica:
 * deben sustituirse por los definitivos antes de publicar.
 */
import { getPayload } from "payload";

import config from "../../src/payload.config";

/** Construye un richText de Lexical a partir de párrafos y subtítulos. */
function contenido(bloques: { tipo: "p" | "h2"; texto: string }[]) {
  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: bloques.map((b) => ({
        type: b.tipo === "h2" ? "heading" : "paragraph",
        ...(b.tipo === "h2" ? { tag: "h2" } : {}),
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        children: [
          {
            type: "text",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: b.texto,
            version: 1,
          },
        ],
      })),
    },
  };
}

const AVISO_LEGAL =
  "Texto de marcador de posición para la demo. Debe reemplazarse por el documento legal definitivo antes de publicar el sitio.";

type Seccion = { titulo: string; ancla: string; parrafos: string[] };

type PaginaSemilla = {
  titulo: string;
  slug: string;
  tipoPagina: "institucional" | "legal" | "portada";
  entradilla: string;
  parrafos: string[];
  secciones?: Seccion[];
};

const paginas: PaginaSemilla[] = [
  {
    titulo: "Partequipos — Repuestos y maquinaria pesada en Colombia",
    slug: "inicio",
    tipoPagina: "portada",
    entradilla:
      "Suministro de repuestos para maquinaria pesada y servicio técnico especializado, con respaldo y asesoría en todo el país.",
    parrafos: [
      "Acompañamos a empresas de construcción, infraestructura, minería y agroindustria en la operación de sus equipos, con un catálogo amplio de repuestos y un equipo técnico que conoce las máquinas por dentro.",
      "Trabajamos por marca y tipo de equipo para que encontrar la pieza correcta sea rápido: se elige la marca, el tipo de máquina y el modelo concreto.",
    ],
  },
  {
    titulo: "Nosotros",
    slug: "nosotros",
    tipoPagina: "institucional",
    entradilla: "Más de dos décadas suministrando repuestos y servicio para maquinaria pesada.",
    parrafos: [
      "Somos una empresa colombiana dedicada al suministro de repuestos para maquinaria pesada y a la prestación de servicio técnico especializado.",
      "Nuestro trabajo se apoya en tres pilares: disponibilidad de inventario, asesoría técnica con criterio y acompañamiento posventa a lo largo de la vida útil del equipo.",
    ],
  },
  {
    titulo: "Trabaja con nosotros",
    slug: "nosotros/trabaja-con-nosotros",
    tipoPagina: "institucional",
    entradilla: "Vacantes y proceso de selección.",
    parrafos: [
      "Buscamos perfiles técnicos y comerciales con interés en el sector de la maquinaria pesada.",
      "Las vacantes vigentes y el formulario de postulación se gestionan a través de nuestro portal de empleo.",
    ],
  },
  {
    titulo: "Contáctanos",
    slug: "contactanos",
    tipoPagina: "institucional",
    entradilla: "Escríbenos o llámanos: te respondemos en horario de oficina.",
    parrafos: [
      "Para cotizaciones de repuestos, indícanos la marca, el tipo de equipo y el modelo; con esos datos la respuesta es mucho más rápida.",
      "Los datos de contacto, la dirección y el horario de atención están en el pie de esta página.",
    ],
  },
  {
    titulo: "Servicio técnico",
    slug: "servicio-tecnico",
    tipoPagina: "institucional",
    entradilla: "Taller propio, alistamiento de maquinaria y acompañamiento posventa.",
    parrafos: [
      "Nuestro equipo técnico atiende mantenimiento preventivo y correctivo, diagnóstico y reparación de componentes.",
    ],
    secciones: [
      {
        titulo: "Taller de servicio técnico",
        ancla: "taller",
        parrafos: [
          "Contamos con taller equipado para diagnóstico y reparación de componentes de maquinaria pesada.",
          "El trabajo se documenta y se entrega con informe técnico.",
        ],
      },
      {
        titulo: "Servicio posventa",
        ancla: "posventa",
        parrafos: [
          "Acompañamiento después de la venta: seguimiento del equipo, disponibilidad de repuestos y soporte del equipo técnico.",
        ],
      },
    ],
  },
  {
    titulo: "Política de garantías de repuestos",
    slug: "politica-de-garantia-de-repuestos",
    tipoPagina: "legal",
    entradilla: AVISO_LEGAL,
    parrafos: [AVISO_LEGAL],
    secciones: [
      {
        titulo: "Garantía",
        ancla: "GARANTIA",
        parrafos: [
          AVISO_LEGAL,
          "Aquí se describirán las condiciones, la cobertura y la vigencia de la garantía sobre los repuestos suministrados.",
        ],
      },
      {
        titulo: "Devoluciones",
        ancla: "Devoluciones",
        parrafos: [
          AVISO_LEGAL,
          "Aquí se describirá el procedimiento de devolución, los plazos y las condiciones en que se acepta.",
        ],
      },
    ],
  },
  {
    titulo: "Tratamiento de datos personales",
    slug: "tratamiento-de-datos",
    tipoPagina: "legal",
    entradilla: AVISO_LEGAL,
    parrafos: [
      AVISO_LEGAL,
      "Aquí irá la política de tratamiento de datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios, incluyendo la identificación del responsable, las finalidades y el canal para ejercer los derechos del titular.",
    ],
  },
  {
    titulo: "Código de ética",
    slug: "codigo-de-etica-partequipos",
    tipoPagina: "legal",
    entradilla: AVISO_LEGAL,
    parrafos: [
      AVISO_LEGAL,
      "Aquí irá el código de ética y conducta, junto con el canal de la línea ética para reportes.",
    ],
  },
  {
    titulo: "Términos y condiciones — Campaña bonos de recompra",
    slug: "terminos-y-condiciones-campana-bonos-de-recompra",
    tipoPagina: "legal",
    entradilla: AVISO_LEGAL,
    parrafos: [
      AVISO_LEGAL,
      "Aquí irán las condiciones de participación, la vigencia y las restricciones de la campaña.",
    ],
  },
];

async function main(): Promise<number> {
  const payload = await getPayload({ config });
  let creadas = 0;
  let actualizadas = 0;
  const errores: string[] = [];

  for (const p of paginas) {
    try {
      const data = {
        titulo: p.titulo,
        slug: p.slug,
        tipoPagina: p.tipoPagina,
        entradilla: p.entradilla,
        contenido: contenido(p.parrafos.map((texto) => ({ tipo: "p" as const, texto }))),
        secciones: (p.secciones ?? []).map((s) => ({
          titulo: s.titulo,
          ancla: s.ancla,
          contenido: contenido(s.parrafos.map((texto) => ({ tipo: "p" as const, texto }))),
        })),
        seo: {
          metaTitle: `${p.titulo} | Partequipos`,
          metaDescription: p.entradilla.slice(0, 155),
        },
      };

      const existente = await payload.find({
        collection: "paginas",
        where: { slug: { equals: p.slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });

      const previa = existente.docs[0];
      if (previa) {
        await payload.update({ collection: "paginas", id: previa.id, data, overrideAccess: true });
        actualizadas++;
      } else {
        await payload.create({ collection: "paginas", data, overrideAccess: true });
        creadas++;
      }
    } catch (err) {
      errores.push(`${p.slug}: ${(err as Error).message}`);
    }
  }

  console.log("\n=========== PÁGINAS — SEMILLA ===========");
  console.log(`Creadas:      ${creadas}`);
  console.log(`Actualizadas: ${actualizadas}`);
  console.log(`Errores:      ${errores.length}`);
  errores.forEach((e) => console.error(`  ✗ ${e}`));
  console.log("=========================================\n");

  return errores.length > 0 ? 1 : 0;
}

try {
  const code = await main();
  process.exit(code);
} catch (err) {
  console.error("Siembra abortada:");
  console.error(err);
  process.exit(1);
}
