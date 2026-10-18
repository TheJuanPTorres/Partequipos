import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import type { TarjetaMarca, VistaEncabezado } from "../repuestos/marca";
import { rutas } from "../routes";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * Lógica pura de la PÁGINA DE MARCA de maquinaria nueva (2026-10-17, petición
 * del cliente): se pinta como las páginas índice de Andrés (`IndiceTarjetas`),
 * con la cabecera de foto y una tarjeta con foto por cada tipo de la marca.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/**
 * Cabecera: «Maquinaria pesada <marca>» (el mismo `<h1>` de siempre), la
 * descripción de la marca y, de fondo, su foto de tarjeta. Sin foto, el tono
 * oscuro del velo, como los índices. Sin logo, como los índices.
 */
export function vistaEncabezadoMarcaNueva(
  marca: MarcasMaquinaria,
  antetitulo = "",
): VistaEncabezado {
  return {
    // El del índice de maquinaria («Plantilla 1», 2026-10-18): se edita en un solo sitio.
    antetitulo,
    linea1: `Maquinaria pesada ${marca.nombre.trim()}`,
    linea2: "",
    descripcion: texto(marca.descripcion),
    fondo: imagenDeMedia(marca.imagenTarjeta, ""),
    logo: null,
  };
}

/**
 * Primera foto del primer equipo de cada tipo. `equipos` llega ordenado como la
 * página del tipo (por nombre); el primer equipo CON foto da la del tipo.
 */
export function primeraFotoPorTipo(
  equipos: EquiposNuevo[],
  tipos: TiposMaquinaria[] = [],
): Map<number, ImagenLista> {
  const fotos = new Map<number, ImagenLista>();
  for (const equipo of equipos) {
    const tipo = typeof equipo.tipo === "number" ? equipo.tipo : equipo.tipo?.id;
    if (tipo === undefined || fotos.has(tipo)) continue;
    for (const imagen of equipo.imagenes ?? []) {
      const foto = imagenDeMedia(imagen, "");
      if (foto) {
        fotos.set(tipo, foto);
        break;
      }
    }
  }
  // Un paraguas sin foto propia toma la del primer subtipo que la tenga.
  for (const t of tipos) {
    if (fotos.has(t.id)) continue;
    for (const s of t.subtipos ?? []) {
      const foto = fotos.get(typeof s === "number" ? s : s.id);
      if (foto) {
        fotos.set(t.id, foto);
        break;
      }
    }
  }
  return fotos;
}

/**
 * Cuántos equipos tiene cada tipo (para no pintar las tarjetas de los tipos vacíos). Un tipo
 * «paraguas» suma los de sus subtipos (`tipos`, #238).
 */
export function equiposPorTipo(
  equipos: EquiposNuevo[],
  tipos: TiposMaquinaria[] = [],
): Map<number, number> {
  const cuenta = new Map<number, number>();
  for (const equipo of equipos) {
    const tipo = typeof equipo.tipo === "number" ? equipo.tipo : equipo.tipo?.id;
    if (tipo !== undefined) cuenta.set(tipo, (cuenta.get(tipo) ?? 0) + 1);
  }
  for (const t of tipos) {
    let suma = 0;
    for (const s of t.subtipos ?? []) suma += cuenta.get(typeof s === "number" ? s : s.id) ?? 0;
    if (suma > 0) cuenta.set(t.id, (cuenta.get(t.id) ?? 0) + suma);
  }
  return cuenta;
}

/**
 * Una tarjeta por tipo CON EQUIPOS (decisión de dirección, 2026-10-17: un tipo
 * vacío, o un tipo que solo agrupa otros, no se pinta), en su orden: la imagen elegida en el panel para el tipo
 * o, si no tiene, la primera foto de su primer equipo; sin ninguna, solo el
 * panel. Ninguna se oculta en móvil (son enlaces del catálogo).
 */
export function tarjetasDeTiposNueva(
  marca: MarcasMaquinaria,
  tipos: TiposMaquinaria[],
  fotos: Map<number, ImagenLista>,
  conEquipos: Map<number, number>,
): TarjetaMarca[] {
  return tipos
    .filter((tipo) => (conEquipos.get(tipo.id) ?? 0) > 0)
    .map((tipo) => ({
      clave: `tipo-${tipo.id}`,
      titulo: tipo.nombre,
      href: `${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`,
      imagen: imagenDeMedia(tipo.imagen, "") ?? fotos.get(tipo.id) ?? null,
      soloEscritorio: false,
    }));
}
