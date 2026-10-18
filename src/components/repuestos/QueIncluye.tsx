import { IconChevronDown } from "@tabler/icons-react";
import Image from "next/image";

import type { GrupoVista } from "@/lib/repuestos/grupos";

import estilos from "./marca.module.css";

/**
 * «QUÉ INCLUYE» de la página de categoría técnica (PROVISIONAL hasta el diseño
 * de Andrés; dirección, 2026-10-18): una tarjeta por grupo de productos, con su
 * foto y su nombre, y la lista de lo que incluye detrás de «Ver productos».
 *
 * El desplegable es un `<details>` nativo: sin JavaScript, con teclado y lector
 * de pantalla de serie. La lista está en el HTML aunque esté plegada, que es lo
 * que ve Google. Sin grupos, no se pinta nada.
 */
export function QueIncluye({
  id,
  titulo,
  grupos,
}: {
  id: string;
  titulo: string;
  grupos: GrupoVista[];
}) {
  if (grupos.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.tarjetas} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      <ul className={`${estilos.rejilla} ${estilos.rejillaGrupos}`}>
        {grupos.map((g) => (
          <li key={g.id} className={estilos.tarjeta}>
            {g.imagen ? (
              <div className={estilos.foto}>
                <Image
                  src={g.imagen.url}
                  alt={g.imagen.alt}
                  fill
                  sizes="(min-width: 1025px) 28vw, (min-width: 768px) 40vw, 80vw"
                  className={estilos.fotoImg}
                  style={{ objectPosition: g.imagen.posicion }}
                />
              </div>
            ) : null}
            <div className={estilos.panel} data-con-foto={g.imagen ? "" : undefined}>
              <h3 className={estilos.tituloTarjeta}>{g.nombre}</h3>
              <details className={estilos.desplegable}>
                <summary className={estilos.botonTarjeta}>
                  <span>Ver productos</span>
                  <IconChevronDown aria-hidden="true" stroke={2} width={18} height={18} />
                </summary>
                <ul className={estilos.listaProductos}>
                  {g.productos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </details>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
