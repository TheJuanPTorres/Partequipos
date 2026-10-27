import Image from "next/image";
import Link from "next/link";

import { IconoDato } from "@/components/ficha/IconoDato";
import { EnlaceContacto } from "@/components/forms/EnlaceContacto";
import { conFormaDeMarca } from "@/components/marca/FormaMarca";
import type { TarjetaEquipo as Datos } from "@/lib/nueva/paginaMarcaAndres";

import estilos from "./marcaNueva.module.css";

/**
 * TARJETA DE UN EQUIPO de la plantilla de Andrés (4023): foto, nombre, 3–4 datos
 * «Destacar» de su ficha técnica (con el nombre uniforme de la ficha nueva y como mucho 2 líneas), «Ver ficha» y «Cotizar» (el formulario de contacto
 * en ventana emergente; sin JavaScript, baja al formulario de la página).
 */
export function TarjetaEquipo({
  equipo,
  anclaContacto,
  prioridad = false,
}: {
  equipo: Datos;
  anclaContacto: string;
  prioridad?: boolean;
}) {
  const { foto } = equipo;
  const idTitulo = `equipo-${equipo.id}`;
  return (
    <li className={estilos.tarjeta}>
      <div className={estilos.foto}>
        {foto?.url ? (
          <Image
            src={foto.url}
            alt=""
            fill
            priority={prioridad}
            sizes="(max-width: 767px) 90vw, (max-width: 1024px) 45vw, 400px"
            className={estilos.fotoImg}
            style={{ objectPosition: foto.posicion }}
          />
        ) : null}
      </div>
      <h3 id={idTitulo} className={estilos.nombre}>
        {conFormaDeMarca(equipo.nombre)}
      </h3>
      {equipo.datos.length > 0 ? (
        <ul className={estilos.datos}>
          {equipo.datos.map((d) => (
            // El texto, como mucho 2 líneas con «…» (CSS); entero al pasar el ratón (`title`) y
            // para los lectores de pantalla (el recorte es solo visual).
            <li key={d.etiqueta} className={estilos.dato} title={`${d.etiqueta}: ${d.valor}`}>
              <IconoDato icono={d.icono} className={estilos.datoIcono} />
              <span className={estilos.datoTexto}>
                <strong>{d.etiqueta}:</strong> {d.valor}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={estilos.acciones}>
        <Link href={equipo.href} className={estilos.botonFicha} aria-describedby={idTitulo}>
          Ver ficha
        </Link>
        <EnlaceContacto
          href={`#${anclaContacto}`}
          className={estilos.botonCotizar}
          ariaLabel={`Cotizar ${equipo.nombre}`}
        >
          Cotizar
        </EnlaceContacto>
      </div>
    </li>
  );
}
