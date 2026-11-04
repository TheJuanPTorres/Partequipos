import Link from "next/link";
import type { CSSProperties } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { Revelado } from "@/components/movimiento/Revelado";
import { vistaBaldosa } from "@/lib/repuestos/baldosasColor";
import type { PlacaMarca } from "@/lib/repuestos/categoria";

import estilos from "./baldosasColor.module.css";

/**
 * «REPUESTOS POR MARCA» del cliente (2026-11-03, `RepuestosMarcas.tsx` portado sin Tailwind) en
 * el índice de marcas de repuestos: una cabecera roja con el `<h1>` centrado y, debajo, un
 * recuadro blanco con una BALDOSA 3:2 por marca, del color de la marca y con su logo en blanco
 * al centro (`vistaBaldosa`; sin los dos datos del panel, el logo de siempre sobre gris).
 * «Ver más», rojo y con un anillo blanco, va montado sobre el borde de abajo: mitad dentro,
 * mitad fuera. Al pasar el ratón o con el foco, el logo se recoge y el botón pasa a tinta.
 * 4 por fila en escritorio y 2 en tablet y móvil, con la última fila centrada (solo CSS).
 * Orden y enlaces, los de siempre.
 */
export function BaldosasColorMarcas({
  id,
  marcas,
  h1,
}: {
  id: string;
  marcas: PlacaMarca[];
  h1: { antetitulo: string; titulo: string };
}) {
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.seccion} aria-labelledby={idTitulo}>
      <header className={estilos.cabecera}>
        <h1 id={idTitulo} className={estilos.h1}>
          <span className={estilos.antetitulo}>{h1.antetitulo}</span>{" "}
          <Revelado
            como="span"
            alCargar
            ritmo="titulo"
            texto={h1.titulo}
            className={estilos.titulo}
          />
        </h1>
      </header>

      {marcas.length > 0 ? (
        <div className={estilos.recuadro}>
          <ul className={estilos.rejilla}>
            {marcas.map((m) => {
              const v = vistaBaldosa(m);
              return (
                <li key={m.id} className={estilos.caja}>
                  <Link
                    href={m.href}
                    aria-label={`Ver más repuestos ${m.nombre}`}
                    className={estilos.baldosa}
                    data-tipo={v.tipo}
                    style={{ "--baldosa-fondo": v.fondo } as CSSProperties}
                  >
                    {v.logo ? (
                      <LogoMarca
                        logo={v.logo}
                        alt=""
                        sizes="(max-width: 1023px) 30vw, 180px"
                        className={`${estilos.logo} ${v.alto ? estilos.logoAlto : ""}`}
                      />
                    ) : (
                      <span className={estilos.nombre}>{m.nombre}</span>
                    )}
                    <span aria-hidden="true" className={estilos.verMas}>
                      Ver más
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
