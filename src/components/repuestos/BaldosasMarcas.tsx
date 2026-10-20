import Link from "next/link";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { Revelado } from "@/components/movimiento/Revelado";
import type { PlacaMarca } from "@/lib/repuestos/categoria";

import estilos from "./marca.module.css";

/**
 * «MOSTRAR MARCAS» de Andrés (plantilla 4017) en el índice de marcas de
 * repuestos: un encabezado («Partequipos» y «Nuestras marcas», revelado por
 * palabras) y un recuadro blanco con una baldosa BLANCA y rectangular (3:2) por marca con
 * su logo, el de todo el sitio (`LogoMarca`; dirección, 2026-10-20: sin fondo
 * de color). Sin logo, su nombre.
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
          {marcas.map((m) => (
            <li key={m.id} className={estilos.baldosaCaja}>
              <Link href={m.href} className={estilos.baldosa}>
                {m.logo ? (
                  <LogoMarca
                    logo={m.logo}
                    alt={m.nombre}
                    sizes="(max-width: 1024px) 40vw, 240px"
                    className={estilos.baldosaLogo}
                  />
                ) : (
                  m.nombre
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
