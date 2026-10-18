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
      />
      <TarjetasMarca id={id} verTodo={verTodo} tarjetas={tarjetas} indice etiqueta={etiqueta} />
    </>
  );
}
