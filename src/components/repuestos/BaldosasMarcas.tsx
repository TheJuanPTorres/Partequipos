import Link from "next/link";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { Revelado } from "@/components/movimiento/Revelado";
import type { PlacaMarca } from "@/lib/repuestos/categoria";

import estilos from "./marca.module.css";

/**
 * «MOSTRAR MARCAS» de Andrés (plantilla 4017) en el índice de marcas de
 * repuestos: un encabezado («Partequipos» y «Nuestras marcas», revelado por
 * palabras) y un recuadro blanco con una baldosa BLANCA y rectangular (3:2) por marca con
 * su logo, el de todo el sitio (`LogoMarca`; dirección, 2026-10-20: sin fondo
 * de color). Sin logo, su nombre.
 * Detalle en docs/diseno/decisiones-repuestos-marca.md §8.
 *
 * Con `h1`, es la CABECERA DE LA PÁGINA (dirección, 2026-10-20: los índices de
 * marcas sin el hero grande): la misma caja oscura y baja, pegada a la cabecera
 * del sitio, con el `<h1>` de siempre de la página (antetítulo y título) en lugar
 * de «Partequipos / Nuestras marcas».
 *
 * Con `cuatroEnUnaFila`, exactamente 4 marcas van en escritorio en UNA fila y no
 * en 2 + 2 (dirección, 2026-10-21: solo el índice de marcas de nueva). Con otro
 * número, la colocación de siempre.
 */
export function BaldosasMarcas({
  id,
  marcas,
  h1,
  cuatroEnUnaFila = false,
}: {
  id: string;
  marcas: PlacaMarca[];
  h1?: { antetitulo: string; titulo: string };
  cuatroEnUnaFila?: boolean;
}) {
  if (marcas.length === 0 && !h1) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${estilos.mostrarMarcas} ${h1 ? estilos.mostrarMarcasPagina : ""}`}
      aria-labelledby={idTitulo}
    >
      <div className={estilos.mostrarMarcasCabecera}>
        {h1 ? (
          <h1 id={idTitulo} className={estilos.mostrarMarcasH1}>
            <span className={estilos.mostrarMarcasAntetitulo}>{h1.antetitulo}</span>{" "}
            <Revelado
              como="span"
              alCargar
              ritmo="titulo"
              texto={h1.titulo}
              className={estilos.mostrarMarcasTitulo}
            />
          </h1>
        ) : (
          <>
            <p className={estilos.mostrarMarcasAntetitulo}>Partequipos</p>
            <Revelado
              como="h2"
              id={idTitulo}
              ritmo="titulo"
              texto="Nuestras marcas"
              className={estilos.mostrarMarcasTitulo}
            />
          </>
        )}
      </div>

      <div className={estilos.mostrarMarcasRecuadro}>
        <ul
          className={`${estilos.baldosas} ${cuatroEnUnaFila ? estilos.baldosasCuatroEnUnaFila : ""}`}
        >
          {marcas.map((m) => (
            <li key={m.id} className={estilos.baldosaCaja}>
              <Link href={m.href} className={estilos.baldosa}>
                {m.logo ? (
                  <LogoMarca
                    logo={m.logo}
                    alt={m.nombre}
                    sizes="(max-width: 1024px) 40vw, 240px"
                    className={estilos.baldosaLogo}
                  />
                ) : (
                  m.nombre
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
