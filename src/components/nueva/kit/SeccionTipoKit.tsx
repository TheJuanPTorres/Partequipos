import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { columnaDeTarjeta, enFilaDe, type SeccionKit } from "@/lib/nueva/paginaKit";

import estilos from "./kit.module.css";
import { TarjetaKit } from "./TarjetaKit";

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
        {/* Sin destino (la página de marca + tipo sin categoría general), sin enlace. */}
        {seccion.href ? (
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
        ) : null}
        <h2 id={idTitulo} className={estilos.tituloTipo}>
          {/* Sin número (marca + tipo con una sola sección), solo el nombre del tipo. */}
          {seccion.numero ? (
            <>
              <span aria-hidden="true" className={estilos.numero}>
                {seccion.numero}
              </span>
              <span aria-hidden="true" className={estilos.barra} />
            </>
          ) : null}
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
