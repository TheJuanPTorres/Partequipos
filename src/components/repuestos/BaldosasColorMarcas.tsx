import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { LogoOpticoServidor } from "@/components/marca/LogoOpticoServidor";
import { Revelado } from "@/components/movimiento/Revelado";
import { AVISO_OTRA_PESTANA } from "@/lib/nueva/enlaceExterno";
import { vistaBaldosa } from "@/lib/repuestos/baldosasColor";
import type { CajaRelativa } from "@/lib/marca/tamanoOptico";
import type { PlacaMarca } from "@/lib/repuestos/categoria";

import estilos from "./baldosasColor.module.css";
import estilosMarca from "./marca.module.css";

/**
 * «REPUESTOS POR MARCA» del cliente (2026-11-03, `RepuestosMarcas.tsx` portado sin Tailwind) en
 * el índice de marcas de repuestos: una cabecera roja con el `<h1>` centrado y, debajo, un
 * recuadro blanco con una BALDOSA 3:2 por marca, del color de la marca y con su logo en blanco
 * al centro (`vistaBaldosa`; sin los dos datos del panel, el logo de siempre sobre gris).
 * «Ver más», rojo y con un anillo blanco, va montado sobre el borde de abajo: mitad dentro,
 * mitad fuera. Al pasar el ratón o con el foco, el logo se recoge y el botón pasa a tinta.
 * 4 por fila en escritorio y 2 en tablet y móvil, con la última fila centrada (solo CSS).
 * Orden y enlaces, los de siempre.
 *
 * `cabecera="oscura"`: la cabecera de siempre de los índices (la caja oscura y baja de
 * `marca.module.css`, con el `<h1>`), en lugar de la roja del diseño. Hoy no la usa ninguna página:
 * el cliente (2026-11-04) quiere la roja en los dos índices de marcas.
 *
 * También el índice de marcas de maquinaria nueva (2026-11-04, `sobre="maquinaria"`): una marca
 * sin página propia (`externo`, LiuGong) lleva a su distribuidor en pestaña nueva, con su icono.
 *
 * `tamanoOptico` (índice de marcas de REPUESTOS, ronda 19, 2026-11-15): los logos con el MISMO
 * TAMAÑO A LA VISTA (`LogoOptico`, la regla común de #439/#445): sin sus márgenes y con la misma
 * área en una caja de 3,7:1. Sustituye al apaño de `alto` para los logos en dos pisos.
 */

/**
 * La caja del logo en la baldosa: 84 % de su ancho y 3,7:1 (el 34 % de su alto, como antes). Área
 * del 54 % (2026-11-16, Juan Pablo: más grandes; antes 42 %, ajustada a Caterpillar): los logos
 * muy alargados (Caterpillar, Yanmar) se quedan en el 92 % del ancho de la caja, sin tocar el
 * borde, y salen algo menores; el resto crece y sigue parejo.
 */
export const CAJA_BALDOSA: CajaRelativa = { proporcion: 3.7, area: 0.54, tope: 0.92 };
export function BaldosasColorMarcas({
  id,
  marcas,
  h1,
  sobre = "repuestos",
  cabecera = "roja",
  tamanoOptico = false,
}: {
  id: string;
  marcas: PlacaMarca[];
  h1: { antetitulo: string; titulo: string };
  /** Qué se ve en cada marca, para el nombre accesible de «Ver más». */
  sobre?: string;
  cabecera?: "roja" | "oscura";
  /** Logos con el mismo tamaño a la vista (índice de marcas de repuestos). */
  tamanoOptico?: boolean;
}) {
  const idTitulo = `${id}-titulo`;
  const oscura = cabecera === "oscura";
  return (
    <section
      id={id}
      className={
        oscura
          ? `${estilosMarca.mostrarMarcas} ${estilosMarca.mostrarMarcasPagina}`
          : estilos.seccion
      }
      aria-labelledby={idTitulo}
    >
      {oscura ? (
        <div className={estilosMarca.mostrarMarcasCabecera}>
          <h1 id={idTitulo} className={estilosMarca.mostrarMarcasH1}>
            <span className={estilosMarca.mostrarMarcasAntetitulo}>{h1.antetitulo}</span>{" "}
            <Revelado
              como="span"
              alCargar
              ritmo="titulo"
              texto={h1.titulo}
              className={estilosMarca.mostrarMarcasTitulo}
            />
          </h1>
        </div>
      ) : (
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
      )}

      {marcas.length > 0 ? (
        <div className={estilos.recuadro}>
          <ul className={estilos.rejilla}>
            {marcas.map((m) => {
              const v = vistaBaldosa(m);
              const propiedades = {
                className: estilos.baldosa,
                "data-tipo": v.tipo,
                style: { "--baldosa-fondo": v.fondo } as CSSProperties,
              };
              const contenido = (
                <>
                  {v.logo && tamanoOptico ? (
                    <LogoOpticoServidor
                      logo={v.logo}
                      caja={CAJA_BALDOSA}
                      alt=""
                      sizes="(max-width: 1023px) 38vw, 207px"
                      className={`${estilos.logo} ${estilos.logoOptico}`}
                    />
                  ) : v.logo ? (
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
                </>
              );
              return (
                <li key={m.id} className={estilos.caja}>
                  {m.externo ? (
                    <a
                      href={m.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${m.nombre} (${AVISO_OTRA_PESTANA})`}
                      {...propiedades}
                    >
                      {contenido}
                      <IconExternalLink
                        aria-hidden="true"
                        focusable="false"
                        stroke={1.75}
                        className={estilos.externo}
                      />
                    </a>
                  ) : (
                    <Link
                      href={m.href}
                      aria-label={`Ver más ${sobre} ${m.nombre}`}
                      {...propiedades}
                    >
                      {contenido}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
