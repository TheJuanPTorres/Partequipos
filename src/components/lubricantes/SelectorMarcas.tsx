import { IconArrowRight, IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Bandera } from "@/components/marca/Bandera";
import { LogoMarca } from "@/components/marca/LogoMarca";
import marca from "@/components/repuestos/marca.module.css";
import type { VistaSelector } from "@/lib/lubricantes/selector";
import { AVISO_OTRA_PESTANA } from "@/lib/nueva/enlaceExterno";

import estilos from "./selectorMarcas.module.css";

/**
 * SELECTOR DE MARCAS de la categoría técnica «Lubricantes» (2026-11-04, dirección; lógica en
 * `src/lib/lubricantes/selector.ts`). Dos paneles lado a lado (apilados en móvil), cada uno del
 * color de su marca, con su logo en placa blanca, su bandera y su país, su foto teñida con su
 * color y su botón. Aprende del banner de marca del #385 (foto teñida) y de las baldosas del #417
 * (el color de la marca de fondo).
 *
 * Al pasar el ratón o con el foco dentro, el panel elegido se ensancha un poco, el otro se recoge
 * y la foto se acerca; todo con CSS (`:has` y `transform`, sin mover la maquetación: sin CLS), sin
 * JavaScript, y quieto con «reducir movimiento».
 * El logo es DECORATIVO: el nombre va en el `<h3>`. Igual la bandera: el país va escrito al lado.
 */
export function SelectorMarcas({ id, vista }: { id: string; vista: VistaSelector }) {
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${marca.tarjetas} ${marca.tarjetasIndice} ${estilos.seccion}`}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className={marca.tituloSeccion}>
        {vista.titulo}
      </h2>
      <ul className={estilos.paneles} data-cuantos={vista.paneles.length}>
        {vista.paneles.map((p) => {
          const idNombre = `${id}-${p.id}`;
          const variables = { "--panel-color": p.color, "--panel-tinta": p.tinta } as CSSProperties;
          return (
            <li
              key={p.id}
              className={estilos.panel}
              style={variables}
              data-accion={p.accion.tipo}
              data-con-foto={p.foto ? "" : undefined}
            >
              {/*
               * El LIENZO lleva el color, la foto y el texto, y es lo que se ensancha o se recoge
               * (con `transform`, no con la maquetación: un hover no puede mover nada, cuenta como
               * CLS). Foto y texto se contraescalan para no deformarse.
               */}
              <div className={estilos.lienzo}>
                {p.foto ? (
                  <span aria-hidden="true" className={estilos.foto}>
                    <Image
                      src={p.foto.url}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 100vw, 640px"
                      style={{ objectFit: "cover", objectPosition: p.foto.posicion }}
                      className={estilos.fotoImagen}
                    />
                    <span className={estilos.tinte} />
                  </span>
                ) : null}

                <div className={estilos.contenido}>
                  {p.logo ? (
                    <span className={estilos.placa}>
                      <LogoMarca logo={p.logo} alt="" sizes="180px" className={estilos.logo} />
                    </span>
                  ) : null}

                  {p.pais ? (
                    <p className={estilos.pais}>
                      <Bandera codigo={p.pais.codigo} className={estilos.bandera} />
                      {p.pais.nombre}
                    </p>
                  ) : null}

                  <h3 id={idNombre} className={estilos.nombre}>
                    Lubricantes {p.nombre}
                  </h3>
                  {p.texto ? <p className={estilos.texto}>{p.texto}</p> : null}

                  {p.accion.tipo === "pagina" ? (
                    <Link
                      href={p.accion.href}
                      className={estilos.boton}
                      aria-label={`${p.accion.texto}: Lubricantes ${p.nombre}`}
                    >
                      {p.accion.texto}
                      <IconArrowRight aria-hidden="true" focusable="false" size={18} stroke={2.2} />
                    </Link>
                  ) : p.accion.tipo === "externo" ? (
                    <a
                      href={p.accion.href}
                      className={estilos.boton}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${p.accion.texto}: Lubricantes ${p.nombre} (${AVISO_OTRA_PESTANA})`}
                    >
                      {p.accion.texto}
                      <IconExternalLink
                        aria-hidden="true"
                        focusable="false"
                        size={18}
                        stroke={2.2}
                      />
                    </a>
                  ) : (
                    <span className={estilos.pronto}>{p.accion.texto}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
