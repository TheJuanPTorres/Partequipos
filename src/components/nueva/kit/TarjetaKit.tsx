import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { IconoDato } from "@/components/ficha/IconoDato";
import type { TarjetaEquipo } from "@/lib/nueva/paginaMarcaAndres";

import { BotonCotizarKit } from "./BotonCotizarKit";
import estilos from "./kit.module.css";

/**
 * TARJETA DE MODELO del «Kit de marca» (2026-10-25): foto, nombre, 3–4 datos «Destacar» de la
 * ficha, «Ver ficha» (a NUESTRA ficha, la misma URL) y «Cotizar» (nuestra ventana). Va en una
 * `ul` con la clase `rejilla` del kit; `columna` centra la última fila (`columnaDeTarjeta`).
 * La usan las secciones de la página de marca y, desde el 2026-10-26, las páginas generales de
 * tipo de nueva. Toma el color de `--acento` y `--tinta` del contenedor.
 */
export function TarjetaKit({
  equipo,
  columna,
  marca,
  origen,
  anclaContacto,
  prioridad,
}: {
  equipo: TarjetaEquipo;
  columna: { escritorio: number | null; tablet: number | null };
  marca: string;
  origen: string;
  anclaContacto: string;
  prioridad: boolean;
}) {
  const { foto } = equipo;
  const idTitulo = `modelo-${equipo.id}`;
  return (
    <li
      className={estilos.modelo}
      data-col={columna.escritorio ?? undefined}
      data-col-tablet={columna.tablet ?? undefined}
    >
      <Link href={equipo.href} tabIndex={-1} aria-hidden="true" className={estilos.modeloFoto}>
        {foto?.url ? (
          <Image
            src={foto.url}
            alt=""
            fill
            priority={prioridad}
            sizes="(max-width: 767px) 90vw, (max-width: 1024px) 45vw, 560px"
            style={{ objectPosition: foto.posicion }}
          />
        ) : null}
      </Link>

      <h3 id={idTitulo} className={estilos.modeloNombre}>
        {equipo.nombre}
      </h3>

      <ul className={estilos.datos}>
        {equipo.datos.map((d) => (
          <li key={d.etiqueta} className={estilos.dato} title={`${d.etiqueta}: ${d.valor}`}>
            <IconoDato icono={d.icono} className={estilos.datoIcono} />
            <span className={estilos.datoTexto}>
              <strong>{d.etiqueta}:</strong> {d.valor}
            </span>
          </li>
        ))}
      </ul>

      <div className={estilos.acciones}>
        <Link
          href={equipo.href}
          aria-describedby={idTitulo}
          className={`${estilos.boton} ${estilos.botonFicha}`}
        >
          Ver ficha
          <IconArrowRight aria-hidden="true" size={18} stroke={2} />
        </Link>
        <BotonCotizarKit
          equipo={{ id: equipo.id, nombre: equipo.nombre }}
          marca={marca}
          origen={origen}
          anclaContacto={anclaContacto}
          className={`${estilos.boton} ${estilos.botonCotizar}`}
        />
      </div>
    </li>
  );
}
