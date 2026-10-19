import Image from "next/image";

import type { MarcaDelIndice } from "@/lib/nueva/indiceMarcas";

import { FotoQueSigue } from "./FotoQueSigue";
import estilos from "./indiceEditorial.module.css";

/**
 * CABECERA «ÍNDICE EDITORIAL» del índice de marcas de nueva (propuesta 2 de
 * dirección, 2026-10-18; diseño propio). Fondo sobrio y los NOMBRES de las
 * marcas en tipografía grande, como el índice de una revista: número, nombre y
 * equipos. Cada nombre baja a la banda de su marca (ancla).
 *
 * Con ratón (y sin «reducir movimiento»), al pasar por un nombre aparece la
 * foto de su máquina siguiendo el cursor (`FotoQueSigue`, de cliente). En
 * táctil, sin JavaScript o con «reducir movimiento», cada nombre lleva su foto
 * pequeña al lado. La miniatura ocupa SIEMPRE su sitio (solo se vuelve
 * transparente con el cursor): sin CLS.
 */
export function CabeceraIndice({
  marcas,
  titulo,
  texto,
}: {
  marcas: MarcaDelIndice[];
  titulo: string;
  texto: string;
}) {
  return (
    <section
      className={estilos.seccion}
      aria-labelledby="indice-marcas-titulo"
      data-indice-marcas=""
    >
      <div className={estilos.cabeza}>
        <h1 id="indice-marcas-titulo" className={estilos.titulo}>
          {titulo}
        </h1>
        {texto ? <p className={estilos.texto}>{texto}</p> : null}
      </div>
      <ol className={estilos.lista}>
        {marcas.map((m, i) => (
          <li key={m.id}>
            <a href={`#marca-${m.id}`} className={estilos.entrada} data-marca={m.id}>
              <span className={estilos.numero}>{String(i + 1).padStart(2, "0")}</span>
              <span className={estilos.nombre}>{m.nombre}</span>
              <span className={estilos.cuenta}>
                {m.equipos} {m.equipos === 1 ? "equipo" : "equipos"}
              </span>
              <span className={estilos.miniatura} aria-hidden="true">
                {m.foto ? (
                  <Image
                    src={m.foto.url}
                    alt=""
                    fill
                    sizes="112px"
                    className={estilos.miniaturaImg}
                    style={{ objectPosition: m.foto.posicion }}
                  />
                ) : null}
              </span>
            </a>
          </li>
        ))}
      </ol>
      <FotoQueSigue fotos={marcas.flatMap((m) => (m.foto ? [{ id: m.id, foto: m.foto }] : []))} />
    </section>
  );
}
