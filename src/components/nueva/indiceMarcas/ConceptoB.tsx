import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Contador } from "@/components/bloques/Contador";
import { Revelado } from "@/components/movimiento/Revelado";
import { RecuadrosConScroll } from "@/components/repuestos/RecuadrosConScroll";
import type { MarcaDelIndice } from "@/lib/nueva/indiceMarcas";

import estilos from "./conceptoB.module.css";

type Totales = { marcas: number; equipos: number; tipos: number };

/**
 * CONCEPTO B — «CATÁLOGO EDITORIAL» (índice de marcas de nueva, diseño propio,
 * 2026-10-18). Cabecera clara y tipográfica: el título grande, las tres cifras
 * en rojo y los logos en color como índice de la página. Después, una BANDA por
 * marca, alternando lados: la foto grande (con el logo en una placa de vidrio
 * que se desplaza con el scroll), el nombre, la descripción, el número de
 * equipos en grande y sus tipos como píldoras, siempre a la vista.
 */
export function ConceptoB({
  marcas,
  totales,
  titulo,
  antetitulo,
  texto,
}: {
  marcas: MarcaDelIndice[];
  totales: Totales;
  titulo: string;
  antetitulo: string;
  texto: string;
}) {
  return (
    <>
      <section className={estilos.hero} aria-labelledby="indice-marcas-titulo">
        <div className={estilos.heroTexto}>
          {antetitulo ? <p className={estilos.antetitulo}>{antetitulo}</p> : null}
          <Revelado
            como="h1"
            id="indice-marcas-titulo"
            alCargar
            ritmo="titulo"
            texto={titulo}
            className={estilos.titulo}
          />
          {texto ? <p className={estilos.texto}>{texto}</p> : null}
        </div>
        <dl className={estilos.cifras}>
          <div>
            <dd>
              <Contador numero={totales.marcas} />
            </dd>
            <dt>marcas</dt>
          </div>
          <div>
            <dd>
              <Contador numero={totales.equipos} />
            </dd>
            <dt>equipos nuevos</dt>
          </div>
          <div>
            <dd>
              <Contador numero={totales.tipos} />
            </dd>
            <dt>tipos de equipo</dt>
          </div>
        </dl>
        <nav className={estilos.indice} aria-label="Ir a una marca">
          <ul>
            {marcas.map((m) => (
              <li key={m.id}>
                <a href={`#marca-${m.id}`} className={estilos.indiceEnlace}>
                  {m.logo ? (
                    <Image
                      src={m.logo.url}
                      alt={m.nombre}
                      width={m.logo.width}
                      height={m.logo.height}
                      sizes="120px"
                      className={estilos.indiceLogo}
                    />
                  ) : (
                    m.nombre
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

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
                <strong>{m.equipos}</strong> {m.equipos === 1 ? "equipo nuevo" : "equipos nuevos"}{" "}
                en {m.tipos.length} {m.tipos.length === 1 ? "tipo" : "tipos"}
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
              <Link
                href={m.href}
                className={estilos.boton}
                aria-describedby={`marca-${m.id}-nombre`}
              >
                <IconArrowRight aria-hidden="true" focusable="false" stroke={3} size={16} />
                Ver la marca
              </Link>
            </div>
          </article>
        ))}
        <RecuadrosConScroll />
      </section>
    </>
  );
}
