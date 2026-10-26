import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import type { AccesoSubcategoria } from "@/lib/repuestos/subcategorias";

import estilos from "./accesos.module.css";

/**
 * ACCESO a las páginas que cuelgan de una categoría técnica (2026-10-26, dirección: Filtros
 * Donaldson desde Filtración), para que no dependan solo del menú: una franja por página, con
 * el COLOR de la marca, su logo en una placa blanca, su nombre y «Ver productos». Toda la franja es el
 * enlace; el texto va en negro o blanco, el que mejor se lee sobre el color (AA).
 */
export function AccesosSubcategorias({
  accesos,
  categoria,
}: {
  accesos: AccesoSubcategoria[];
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
            <Link
              href={`${a.href}/`}
              className={estilos.franja}
              style={{ "--acceso-color": a.color, "--acceso-tinta": a.tinta } as CSSProperties}
            >
              {a.logo ? (
                <span className={estilos.placa}>
                  {/* Decorativo: el nombre ya está escrito al lado. */}
                  <LogoMarca logo={a.logo} alt="" sizes="160px" className={estilos.logo} />
                </span>
              ) : null}
              <span className={estilos.texto}>
                <span className={estilos.nombre}>{a.nombre}</span>
                <span className={estilos.ver}>
                  Ver productos
                  <IconArrowRight aria-hidden="true" focusable="false" stroke={2} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
