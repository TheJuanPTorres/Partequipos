import Image from "next/image";

import type { SedeLista } from "@/lib/portada/sedes";

import { GloboSedes } from "./diferidos";
import estilos from "./sedes.module.css";

/**
 * SECCIÓN 9 DE LA PORTADA — sedes (ux-9, fase G).
 *
 * Componente de SERVIDOR: la lista de sedes va SIEMPRE en el HTML (buscadores,
 * lector de pantalla y sin JavaScript). El globo de Mapbox es una mejora que
 * solo existe si hay token (`NEXT_PUBLIC_MAPBOX_TOKEN`): entonces `GloboSedes`
 * envuelve esta misma lista y carga Mapbox al entrar en pantalla. Sin token,
 * la sección es la lista, sin hueco para el mapa.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-home-ux9.md §23):
 * - Título `<h2>` «Nuestras sedes» solo para lectores (ux-9 no tiene título).
 * - Cada ficha es un `<article>` con su `<h3>`; las líneas, una lista.
 * - La atribución y el logo de Mapbox se ven (ux-9 los ocultaba).
 * - Sin token, lista en rejilla en vez de globo.
 */
const SIZES_FOTO = "(max-width: 479px) 80vw, (max-width: 991px) 80vw, 416px";

function Ficha({ sede, i }: { sede: SedeLista; i: number }) {
  const idTitulo = `portada-sede-${i + 1}`;
  return (
    <article className={estilos.ficha} aria-labelledby={idTitulo}>
      {sede.foto ? (
        <div className={estilos.visual}>
          <Image
            src={sede.foto.url}
            alt=""
            width={sede.foto.width}
            height={sede.foto.height}
            sizes={SIZES_FOTO}
            className={estilos.foto}
          />
        </div>
      ) : null}
      <div className={estilos.cabecera}>
        <p className={estilos.etiqueta}>{sede.etiqueta}</p>
        <h3 id={idTitulo} className={estilos.nombre}>
          {sede.titulo}
        </h3>
      </div>
      {sede.lineas.length > 0 ? (
        <ul className={estilos.detalles}>
          {sede.lineas.map((l) => (
            <li key={`${l.etiqueta}-${l.direccion}`} className={estilos.detalle}>
              <span className={estilos.detalleEtiqueta}>{l.etiqueta}</span>
              <address className={estilos.direccion}>{l.direccion}</address>
              {l.telefono ? (
                <a className={estilos.telefono} href={l.telefono.href}>
                  {l.telefono.texto}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function SeccionSedes({
  sedes,
  token,
  titulo,
}: {
  sedes: SedeLista[];
  token: string | null;
  titulo: string;
}) {
  if (sedes.length === 0) return null;
  const fichas = sedes.map((s, i) => (
    // El índice va en un atributo: así el globo enlaza cada ficha con su pin
    // sin exponer ids de la base (CLAUDE.md §8).
    <li key={s.id} data-sede-indice={i}>
      <Ficha sede={s} i={i} />
    </li>
  ));
  return (
    <section className={estilos.seccion} aria-labelledby="portada-sedes-titulo">
      <h2 id="portada-sedes-titulo" className="sr-only">
        {titulo || "Sedes"}
      </h2>
      {token ? (
        <GloboSedes
          token={token}
          sedes={sedes.map(({ lat, lng, ciudad, titulo }) => ({ lat, lng, ciudad, titulo }))}
        >
          {fichas}
        </GloboSedes>
      ) : (
        // En móvil es un carril que se desplaza: enfocable para el teclado.
        <ul className={estilos.lista} tabIndex={0} aria-label="Sedes">
          {fichas}
        </ul>
      )}
    </section>
  );
}
