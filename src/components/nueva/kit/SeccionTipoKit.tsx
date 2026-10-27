import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { IconoDato } from "@/components/ficha/IconoDato";
import { conFormaDeMarca } from "@/components/marca/FormaMarca";
import { columnaDeTarjeta, enFilaDe, type SeccionKit } from "@/lib/nueva/paginaKit";
import type { TarjetaEquipo } from "@/lib/nueva/paginaMarcaAndres";

import { BotonCotizarKit } from "./BotonCotizarKit";
import estilos from "./kit.module.css";

/**
 * UNA SECCIÓN POR TIPO del «Kit de marca» (2026-10-25): «01 | {tipo}», la franja diagonal del
 * color de la marca con el render del tipo en gris (solo donde cabe al lado del título),
 * «Ver toda la categoría» y las tarjetas de modelo: foto, nombre, 3–4 datos «Destacar» de la
 * ficha, «Ver ficha» (a NUESTRA ficha, la misma URL) y «Cotizar» (nuestra ventana).
 */
export function SeccionTipoKit({
  seccion,
  marca,
  origen,
  anclaContacto,
  primera,
}: {
  seccion: SeccionKit;
  marca: string;
  origen: string;
  anclaContacto: string;
  /** La primera sección carga sus fotos con prioridad. */
  primera: boolean;
}) {
  const n = seccion.tarjetas.length;
  const fila = enFilaDe(n);
  const idTitulo = `${seccion.clave}-titulo`;
  return (
    <section
      id={seccion.clave}
      aria-labelledby={idTitulo}
      className={estilos.seccion}
      tabIndex={-1}
    >
      <div className={estilos.cabeceraSeccion}>
        {seccion.franjaDesde > 0 ? (
          <span aria-hidden="true" className={estilos.detalle} data-desde={seccion.franjaDesde}>
            <span className={estilos.franja} />
            {seccion.render ? (
              <span className={estilos.detalleRender}>
                <Image
                  src={seccion.render.imagen.url}
                  alt=""
                  fill
                  sizes="210px"
                  style={seccion.render.recortado ? undefined : { objectPosition: "bottom" }}
                />
              </span>
            ) : null}
          </span>
        ) : null}
        <Link
          href={seccion.href}
          className={estilos.verCategoria}
          data-fila={fila}
          data-una={n === 1 ? "" : undefined}
        >
          Ver toda la categoría
          <span className="sr-only"> de {seccion.titulo}</span>
          <IconArrowRight aria-hidden="true" size={14} stroke={2.2} />
        </Link>
        <h2 id={idTitulo} className={estilos.tituloTipo}>
          <span aria-hidden="true" className={estilos.numero}>
            {seccion.numero}
          </span>
          <span aria-hidden="true" className={estilos.barra} />
          <span>{seccion.titulo}</span>
        </h2>
      </div>

      <ul className={estilos.rejilla}>
        {seccion.tarjetas.map((e, i) => (
          <TarjetaKit
            key={e.id}
            equipo={e}
            columna={columnaDeTarjeta(i, n)}
            marca={marca}
            origen={origen}
            anclaContacto={anclaContacto}
            prioridad={primera && i < 3}
          />
        ))}
      </ul>
    </section>
  );
}

function TarjetaKit({
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
        {conFormaDeMarca(equipo.nombre)}
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
