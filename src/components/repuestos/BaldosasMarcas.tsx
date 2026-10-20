import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Revelado } from "@/components/movimiento/Revelado";
import { tintaSobre } from "@/lib/marca/colorMarca";
import type { PlacaMarca } from "@/lib/repuestos/categoria";

import estilos from "./marca.module.css";

/**
 * «MOSTRAR MARCAS» de Andrés (plantilla 4017) en el índice de marcas de
 * repuestos: un encabezado («Partequipos» y «Nuestras marcas», revelado por
 * palabras) y un recuadro blanco con una baldosa cuadrada por marca, de su
 * color y con el logo en blanco (en negro si el color es muy claro, la regla
 * del #271). Sin color, el gris neutro de las páginas de marca sin color
 * (`--marca-amarillo` de `.pagina`, #279) con el logo en negro; sin logo, su nombre.
 * Detalle en docs/diseno/decisiones-repuestos-marca.md §8.
 */
export function BaldosasMarcas({ id, marcas }: { id: string; marcas: PlacaMarca[] }) {
  if (marcas.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.mostrarMarcas} aria-labelledby={idTitulo}>
      <div className={estilos.mostrarMarcasCabecera}>
        <p className={estilos.mostrarMarcasAntetitulo}>Partequipos</p>
        <Revelado
          como="h2"
          id={idTitulo}
          ritmo="titulo"
          texto="Nuestras marcas"
          className={estilos.mostrarMarcasTitulo}
        />
      </div>

      <div className={estilos.mostrarMarcasRecuadro}>
        <ul className={estilos.baldosas}>
          {marcas.map((m) => {
            const color = m.color
              ? ({
                  "--baldosa-color": m.color,
                  "--baldosa-tinta": tintaSobre(m.color),
                } as CSSProperties)
              : undefined;
            return (
              <li key={m.id} className={estilos.baldosaCaja}>
                <Link
                  href={m.href}
                  className={estilos.baldosa}
                  style={color}
                  data-logo-blanco={m.logoBlanco ? "" : undefined}
                >
                  {m.logo ? (
                    <Image
                      src={m.logo.url}
                      alt={m.logo.alt}
                      width={m.logo.width}
                      height={m.logo.height}
                      sizes="(max-width: 1024px) 40vw, 240px"
                      className={estilos.baldosaLogo}
                    />
                  ) : (
                    m.nombre
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
