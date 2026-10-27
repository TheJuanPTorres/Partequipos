import { BannerMarcaTipo } from "@/components/nueva/BannerMarcaTipo";
import type { VistaBanner } from "@/lib/nueva/bannerMarca";
import type { AccesoSubcategoria } from "@/lib/repuestos/subcategorias";

import estilos from "./accesos.module.css";

/**
 * ACCESO a las páginas que cuelgan de una categoría técnica (2026-10-26, dirección: Filtros
 * Donaldson desde Filtración), para que no dependan solo del menú. Desde el 2026-10-27
 * (dirección) es el BANNER DE MARCA de las páginas generales de tipo de nueva (#385,
 * `BannerMarcaTipo`), en lugar de la franja del #349: el logo sobre la forma diagonal del color
 * de la marca, el título y la foto teñida que se oscurece hacia «Ver marca»; en móvil, la
 * tarjeta blanca. Logo, color y foto, del panel (la categoría que cuelga).
 */
export function AccesosSubcategorias({
  accesos,
  categoria,
}: {
  accesos: (AccesoSubcategoria & { vista: VistaBanner })[];
  /** El nombre de la categoría: «Marcas de filtración». */
  categoria: string;
}) {
  const id = "marcas-de-la-categoria";
  return (
    <section className={estilos.seccion} aria-labelledby={id}>
      <h2 id={id} className={estilos.titulo}>
        Marcas de {categoria.toLowerCase()}
      </h2>
      <ul className={estilos.lista}>
        {accesos.map((a) => (
          <li key={a.id}>
            <BannerMarcaTipo
              id={`acceso-${a.id}`}
              titulo={a.nombre}
              marca={{ nombre: a.nombre, href: `${a.href}/` }}
              logo={a.logo}
              vista={a.vista}
              nivel="h3"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
