import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { RecuadrosConScroll } from "@/components/repuestos/RecuadrosConScroll";
import type { MarcaDelIndice } from "@/lib/nueva/indiceMarcas";

import estilos from "./bandas.module.css";

/**
 * LAS BANDAS DEL ÍNDICE DE MARCAS DE NUEVA (concepto B elegido por dirección,
 * 2026-10-18; diseño propio): una banda por marca, alternando lados, con la
 * foto grande (el logo en una placa blanca que asoma por la esquina y se
 * desplaza con el scroll), «01 / 06», el nombre, la descripción, el número de
 * equipos, sus tipos como píldoras (siempre a la vista) y «Ver la marca». Cada
 * banda es el destino de su pieza en la cabecera (`#marca-<id>`).
 */
export function BandasMarcas({ marcas }: { marcas: MarcaDelIndice[] }) {
  return (
    <section className={estilos.bandas} aria-label="Marcas de maquinaria nueva">
      {marcas.map((m, i) => (
        <article
          key={m.id}
          id={`marca-${m.id}`}
          className={estilos.banda}
          data-lado={i % 2 ? "derecha" : "izquierda"}
          aria-labelledby={`marca-${m.id}-nombre`}
        >
          <div className={estilos.media}>
            <div className={estilos.foto}>
              {m.foto ? (
                <Image
                  src={m.foto.url}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className={estilos.fotoImg}
                  style={{ objectPosition: m.foto.posicion }}
                />
              ) : null}
            </div>
            {m.logo ? (
              <div className={estilos.placa} data-recuadro-scroll="">
                <Image
                  src={m.logo.url}
                  alt=""
                  width={m.logo.width}
                  height={m.logo.height}
                  sizes="170px"
                  className={estilos.logo}
                />
              </div>
            ) : null}
          </div>
          <div className={estilos.contenido}>
            <p className={estilos.numero}>
              <span className={estilos.numeroCifra}>{String(i + 1).padStart(2, "0")}</span>
              <span className={estilos.numeroTotal}>
                / {String(marcas.length).padStart(2, "0")}
              </span>
            </p>
            <h2 id={`marca-${m.id}-nombre`} className={estilos.nombre}>
              {m.nombre}
            </h2>
            {m.descripcion ? <p className={estilos.descripcion}>{m.descripcion}</p> : null}
            <p className={estilos.cuenta}>
              <strong>{m.equipos}</strong> {m.equipos === 1 ? "equipo nuevo" : "equipos nuevos"} en{" "}
              {m.tipos.length} {m.tipos.length === 1 ? "tipo" : "tipos"}
            </p>
            {m.tipos.length > 0 ? (
              <ul className={estilos.pildoras} aria-label={`Tipos de equipo ${m.nombre}`}>
                {m.tipos.map((t) => (
                  <li key={t.id}>
                    <Link href={t.href} className={estilos.pildora}>
                      {t.nombre}
                      <span className={estilos.pildoraCuenta}>{t.equipos}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href={m.href} className={estilos.boton} aria-describedby={`marca-${m.id}-nombre`}>
              <IconArrowRight aria-hidden="true" focusable="false" stroke={3} size={16} />
              Ver la marca
            </Link>
          </div>
        </article>
      ))}
      <RecuadrosConScroll />
    </section>
  );
}
