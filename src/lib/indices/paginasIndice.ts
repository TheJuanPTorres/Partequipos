import type { PaginasIndice } from "@/payload-types";

import type { TarjetaMarca, VistaEncabezado } from "../repuestos/marca";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * Lógica pura de las páginas ÍNDICE (repuestos y maquinaria) y de Contáctanos,
 * plantillas de Andrés (docs/diseno/decisiones-indices-contacto.md): convierte
 * lo que devuelve Payload en lo que se pinta. El acceso a datos está en
 * `lib/queries/getPaginasIndice.ts`.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

type GrupoIndice = NonNullable<PaginasIndice["repuestos"]>;

/**
 * Encabezado de una página índice: antetítulo, título (una sola línea, sin la
 * segunda del encabezado de marca), párrafo opcional y foto de fondo. Sin foto
 * propia usa la de respaldo; sin ninguna, el tono oscuro del velo. Sin logo.
 */
export function vistaEncabezadoDeIndice(
  grupo: GrupoIndice | null | undefined,
  tituloDeRespaldo: string,
  respaldo: ImagenLista | null,
): VistaEncabezado {
  return {
    antetitulo: texto(grupo?.antetitulo),
    // Una página sin `<h1>` sería peor que una con el texto de respaldo (§3.4).
    linea1: texto(grupo?.titulo) || tituloDeRespaldo,
    linea2: "",
    descripcion: texto(grupo?.texto),
    fondo: imagenDeMedia(grupo?.fondo, "") ?? respaldo,
    logo: null,
  };
}

/**
 * Las tarjetas del índice, en su orden y hasta seis. Una sin título o sin
 * enlace no sale (nada de tarjetas que lleven a ninguna parte); sin foto, se
 * pinta solo con el panel. Ninguna se oculta en móvil: con contenido real, ocultar
 * una quitaría un enlace (en ux-9 la segunda fila era relleno repetido).
 */
export function tarjetasDeIndice(grupo: GrupoIndice | null | undefined): TarjetaMarca[] {
  return (grupo?.tarjetas ?? [])
    .filter((t) => texto(t.titulo) && texto(t.enlace))
    .slice(0, 6)
    .map((t, i) => ({
      clave: t.id ?? `indice-${i}`,
      titulo: texto(t.titulo),
      href: texto(t.enlace),
      imagen: imagenDeMedia(t.imagen, ""),
      soloEscritorio: false,
    }));
}

export type CanalContacto = {
  clave: "telefono" | "correo" | "direccion";
  etiqueta: string;
  /** El dato, tal cual se muestra. */
  valor: string;
  /** Enlace `tel:` o `mailto:`; la dirección no lleva. */
  href: string | null;
};

type EmpresaContacto = { telefono: string; correo: string; direccion: string; ciudad: string };

/** «+57 317 670 7071» → `tel:+573176707071`; sin dígitos suficientes, sin enlace. */
export function enlaceTelefono(telefono: string): string | null {
  const digitos = telefono.replace(/[^\d+]/g, "");
  return digitos.replace(/\D/g, "").length >= 7 ? `tel:${digitos}` : null;
}

/**
 * Los tres canales de Contáctanos con los datos del GLOBAL DE LA EMPRESA (una
 * sola fuente): teléfono, correo y dirección con ciudad. Un dato vacío no sale.
 */
export function canalesDeContacto(
  grupo: PaginasIndice["contacto"] | null | undefined,
  empresa: EmpresaContacto,
): CanalContacto[] {
  const direccion = [texto(empresa.direccion), texto(empresa.ciudad)].filter(Boolean).join(" ");
  const canales: CanalContacto[] = [
    {
      clave: "telefono",
      etiqueta: texto(grupo?.etiquetaTelefono) || "Llámanos",
      valor: texto(empresa.telefono),
      href: enlaceTelefono(empresa.telefono),
    },
    {
      clave: "correo",
      etiqueta: texto(grupo?.etiquetaCorreo) || "Email",
      valor: texto(empresa.correo),
      href: texto(empresa.correo) ? `mailto:${texto(empresa.correo)}` : null,
    },
    {
      clave: "direccion",
      etiqueta: texto(grupo?.etiquetaDireccion) || "Dirección",
      valor: direccion,
      href: null,
    },
  ];
  return canales.filter((c) => c.valor);
}
