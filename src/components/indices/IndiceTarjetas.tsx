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
 * Reutiliza las tarjetas de la página de marca. No lleva franja amarilla tras el
 * encabezado (la plantilla no la tiene) y ninguna tarjeta se oculta en móvil.
 */
export function IndiceTarjetas({
  id,
  vista,
  tarjetas,
  verTodo,
}: {
  id: string;
  vista: VistaEncabezado;
  tarjetas: TarjetaMarca[];
  verTodo: string;
}) {
  return (
    <>
      <HeroMarca vista={vista} anclaSiguiente={id} franja={false} />
      <TarjetasMarca id={id} verTodo={verTodo} tarjetas={tarjetas} indice />
    </>
  );
}
