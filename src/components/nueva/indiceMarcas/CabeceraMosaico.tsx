import Image from "next/image";

import type { MarcaDelIndice } from "@/lib/nueva/indiceMarcas";

import estilos from "./mosaico.module.css";

/**
 * CABECERA «MOSAICO DE MARCAS» del índice de marcas de nueva (propuesta 1 de
 * dirección, 2026-10-18; diseño propio). Un mosaico tipo bento, una pieza por
 * marca con su foto a sangre y su logo: las dos primeras, grandes. Al pasar el
 * ratón o enfocar, la pieza crece un poco y las demás se atenúan (CSS `:has`);
 * al pulsar, baja a la banda de esa marca (ancla). Sin JavaScript: todo es CSS
 * y enlaces. Con «reducir movimiento», sin efectos. Título breve y sobrio.
 */
export function CabeceraMosaico({
  marcas,
  titulo,
  texto,
}: {
  marcas: MarcaDelIndice[];
  titulo: string;
  texto: string;
}) {
  return (
    <section className={estilos.seccion} aria-labelledby="indice-marcas-titulo">
      <div className={estilos.cabeza}>
        <h1 id="indice-marcas-titulo" className={estilos.titulo}>
          {titulo}
        </h1>
        {texto ? <p className={estilos.texto}>{texto}</p> : null}
      </div>
      <ul className={estilos.mosaico}>
        {marcas.map((m, i) => (
          <li key={m.id} className={estilos.pieza} data-tam={i < 2 ? "grande" : "normal"}>
            <a href={`#marca-${m.id}`} className={estilos.enlace}>
              {m.foto ? (
                <Image
                  src={m.foto.url}
                  alt=""
                  fill
                  priority={i < 2}
                  sizes={
                    i < 2
                      ? "(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 34vw"
                      : "(max-width: 767px) 50vw, (max-width: 1024px) 25vw, 17vw"
                  }
                  className={estilos.foto}
                  style={{ objectPosition: m.foto.posicion }}
                />
              ) : null}
              <span className={estilos.velo} aria-hidden="true" />
              {m.logo ? (
                <span className={estilos.placa}>
                  <Image
                    src={m.logo.url}
                    alt=""
                    width={m.logo.width}
                    height={m.logo.height}
                    sizes="120px"
                    className={estilos.logo}
                  />
                </span>
              ) : null}
              <span className={estilos.pie}>
                <span className={estilos.nombre}>{m.nombre}</span>
                <span className={estilos.cuenta}>
                  {m.equipos} {m.equipos === 1 ? "equipo" : "equipos"}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
