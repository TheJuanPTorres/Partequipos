import Image from "next/image";
import Link from "next/link";

import { Contador } from "@/components/bloques/Contador";
import { Revelado } from "@/components/movimiento/Revelado";
import { RecuadrosConScroll } from "@/components/repuestos/RecuadrosConScroll";
import type { MarcaDelIndice } from "@/lib/nueva/indiceMarcas";

import estilos from "./conceptoA.module.css";

type Totales = { marcas: number; equipos: number; tipos: number };

/**
 * CONCEPTO A — «VITRINA A SANGRE» (índice de marcas de nueva, diseño propio,
 * 2026-10-18). Cabecera oscura con la foto de la primera marca, velo y una
 * barra de VIDRIO con los contadores; debajo, una tarjeta grande por marca con
 * su foto a sangre, el logo en color sobre una placa de vidrio y, al pasar el
 * ratón o al enfocar, el panel sube y revela sus tipos como píldoras. Sin
 * JavaScript todo funciona (la revelación es CSS; en pantallas táctiles las
 * píldoras se ven siempre).
 */
export function ConceptoA({
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
  const fondo = marcas.find((m) => m.foto)?.foto ?? null;
  return (
    <>
      <section className={estilos.hero} aria-labelledby="indice-marcas-titulo">
        {fondo ? (
          <Image
            src={fondo.url}
            alt=""
            fill
            priority
            sizes="100vw"
            className={estilos.heroFoto}
            style={{ objectPosition: fondo.posicion }}
          />
        ) : null}
        <div className={estilos.heroVelo} aria-hidden="true" />
        <div className={estilos.heroContenido}>
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
          <dl className={estilos.cifras}>
            <div>
              <dt>Marcas</dt>
              <dd>
                <Contador numero={totales.marcas} />
              </dd>
            </div>
            <div>
              <dt>Equipos nuevos</dt>
              <dd>
                <Contador numero={totales.equipos} />
              </dd>
            </div>
            <div>
              <dt>Tipos de equipo</dt>
              <dd>
                <Contador numero={totales.tipos} />
              </dd>
            </div>
          </dl>
          <nav className={estilos.atajos} aria-label="Ir a una marca">
            {marcas.map((m) => (
              <a key={m.id} href={`#marca-${m.id}`} className={estilos.atajo}>
                {m.logo ? (
                  <Image
                    src={m.logo.url}
                    alt={m.nombre}
                    width={m.logo.width}
                    height={m.logo.height}
                    sizes="96px"
                    className={estilos.atajoLogo}
                  />
                ) : (
                  m.nombre
                )}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className={estilos.vitrina} aria-label="Marcas de maquinaria nueva">
        <ul className={estilos.rejilla}>
          {marcas.map((m, i) => (
            <li key={m.id} id={`marca-${m.id}`} className={estilos.tarjeta}>
              {m.foto ? (
                <Image
                  src={m.foto.url}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                  className={estilos.foto}
                  style={{ objectPosition: m.foto.posicion }}
                  priority={i === 0}
                />
              ) : null}
              <div className={estilos.velo} aria-hidden="true" />
              {m.logo ? (
                <div className={estilos.placa}>
                  <Image
                    src={m.logo.url}
                    alt=""
                    width={m.logo.width}
                    height={m.logo.height}
                    sizes="160px"
                    className={estilos.logo}
                  />
                </div>
              ) : null}
              <div className={estilos.panel} data-recuadro-scroll="">
                <div className={estilos.cabeza}>
                  <h2 className={estilos.nombre}>
                    {/* El enlace cubre la tarjeta entera (::after); las píldoras quedan encima. */}
                    <Link href={m.href} className={estilos.enlace}>
                      Maquinaria pesada {m.nombre}
                    </Link>
                  </h2>
                  <p className={estilos.chip}>
                    {m.equipos} {m.equipos === 1 ? "equipo" : "equipos"}
                  </p>
                </div>
                {m.descripcion ? <p className={estilos.descripcion}>{m.descripcion}</p> : null}
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
              </div>
            </li>
          ))}
        </ul>
        <RecuadrosConScroll />
      </section>
    </>
  );
}
