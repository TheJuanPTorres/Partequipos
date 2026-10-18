import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import type { TarjetaMarca, VistaEncabezado } from "@/lib/repuestos/marca";

/**
 * PÁGINA ÍNDICE con tarjetas (plantillas «Repuestos para maquinaria pesada» y
 * «Categoría principal» de Andrés, que son LA MISMA, docs/diseno/decisiones-
 * indices-contacto.md): el encabezado de la página de marca —sin logo y con un
 * antetítulo— y, debajo, una sección blanca con hasta seis tarjetas de foto,
 * título y «Ver todo →». Las dos páginas (repuestos y maquinaria) lo usan; la
 * diferencia es solo el contenido, que sale del global `paginas-indice`.
 *
 * También la usa la página de marca de maquinaria nueva (2026-10-17), con una
 * tarjeta por tipo de la marca, su propia `etiqueta` para la sección y, sin foto
 * de la marca, la cabecera baja y centrada (`cabeceraBajaSinFoto`).
 *
 * Reutiliza las tarjetas de la página de marca. No lleva franja amarilla tras el
 * encabezado (la plantilla no la tiene) y ninguna tarjeta se oculta en móvil.
 *
 * «PLANTILLA 1» de Andrés (2026-10-18), la versión actualizada: cabecera del
 * 70 % de la ventana con el contenido centrado, antetítulo rojo, título con el
 * revelado por palabras de la portada e icono del ratón a las tarjetas; y
 * tarjetas con la foto a todo el ancho y un recuadro blanco al 90 % que sube
 * 54 px sobre ella, 3 por fila. Cambia a la vez en los dos índices y en las
 * páginas de marca de nueva.
 */
export function IndiceTarjetas({
  id,
  vista,
  tarjetas,
  verTodo,
  etiqueta,
  cabeceraBajaSinFoto = false,
}: {
  id: string;
  vista: VistaEncabezado;
  tarjetas: TarjetaMarca[];
  verTodo: string;
  /** Nombre accesible de la sección de tarjetas (por defecto, el de `TarjetasMarca`). */
  etiqueta?: string;
  /** Sin foto de fondo, la cabecera más baja y con el contenido centrado en vertical. */
  cabeceraBajaSinFoto?: boolean;
}) {
  return (
    <>
      <HeroMarca
        vista={vista}
        anclaSiguiente={id}
        franja={false}
        bajaSinFoto={cabeceraBajaSinFoto}
        indice
        etiquetaRaton="Ir a las tarjetas"
      />
      <TarjetasMarca id={id} verTodo={verTodo} tarjetas={tarjetas} indice etiqueta={etiqueta} />
    </>
  );
}
