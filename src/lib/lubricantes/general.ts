import type { MarcasLubricante, PaginasIndice } from "@/payload-types";

import { conAlt, logoPropio, type LogoConAlt } from "../marca/logoMarca";
import type { VistaEncabezado } from "../repuestos/marca";
import { rutas } from "../routes";
import { imagenDeMedia, poblado } from "../utils/relations";

/**
 * PÁGINA GENERAL DE LUBRICANTES (`/lubricantes/`, plantilla de Andrés 809451,
 * 2026-10-20): lógica pura. Los textos salen del grupo «Lubricantes» del global
 * «Páginas índice y contacto»; un campo vacío usa el texto del diseño.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/** Los textos del diseño de Andrés, para los campos vacíos. */
export const TEXTOS_LUBRICANTES = {
  antetitulo: "Partequipos",
  titulo: "Nuestros Lubricantes",
  tituloBloque: "Máxima protección y eficiencia para tu maquinaria.",
  textoBloque:
    "En Partequipos ofrecemos soluciones de lubricación diseñadas para optimizar el rendimiento, reducir el desgaste y prolongar la vida útil de motores, sistemas hidráulicos y componentes de maquinaria pesada.\n\nContamos con lubricantes de alta calidad que contribuyen a mantener tus equipos operando en condiciones exigentes, minimizando los tiempos de inactividad y los costos de mantenimiento.",
  textoBoton: "Ver catálogo",
} as const;

type GrupoLubricantes = PaginasIndice["lubricantes"];

export type MarcaDestacada = {
  nombre: string;
  /** Destino de «Ver catálogo»; `null`, sin el botón (las páginas de la marca y de sus líneas). */
  href: string | null;
  logo: LogoConAlt | null;
};

export type VistaLubricantes = {
  encabezado: VistaEncabezado;
  bloque: { titulo: string; parrafos: string[]; textoBoton: string; marca: MarcaDestacada | null };
};

/** Párrafos separados por una línea en blanco. */
export function parrafos(valor: string): string[] {
  return valor
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * La vista de la página. La marca destacada es la elegida en el panel o, si no
 * hay (o no tiene dirección), la primera de las marcas de lubricante.
 */
export function vistaLubricantes(
  grupo: GrupoLubricantes | null | undefined,
  marcas: Pick<MarcasLubricante, "id" | "nombre" | "slug" | "logo">[],
): VistaLubricantes {
  const elegida = poblado<MarcasLubricante>(grupo?.marca ?? null);
  const marca = [elegida, ...marcas].find((m) => m && texto(m.nombre) && texto(m.slug)) ?? null;
  return {
    encabezado: {
      antetitulo: texto(grupo?.antetitulo) || TEXTOS_LUBRICANTES.antetitulo,
      // Una página sin `<h1>` sería peor que una con el texto del diseño (§3.4).
      linea1: texto(grupo?.titulo) || TEXTOS_LUBRICANTES.titulo,
      linea2: "",
      descripcion: "",
      fondo: imagenDeMedia(grupo?.fondo, ""),
      logo: null,
    },
    bloque: {
      titulo: texto(grupo?.tituloBloque) || TEXTOS_LUBRICANTES.tituloBloque,
      parrafos: parrafos(texto(grupo?.textoBloque) || TEXTOS_LUBRICANTES.textoBloque),
      textoBoton: texto(grupo?.textoBoton) || TEXTOS_LUBRICANTES.textoBoton,
      marca: marca
        ? {
            nombre: texto(marca.nombre),
            href: `${rutas.marcaLubricante(texto(marca.slug))}/`,
            // Una marca de lubricante no tiene casilla de tinta oscura: su logo, con sus colores.
            logo: conAlt(logoPropio({ logo: marca.logo }), `Logo de ${texto(marca.nombre)}`),
          }
        : null,
    },
  };
}
