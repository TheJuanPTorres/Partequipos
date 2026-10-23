import { IconEye, IconMapPin } from "@tabler/icons-react";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { URL_PORTAL_BUK } from "@/lib/vacantes/portalBuk";
import type { Vacante } from "@/lib/vacantes/tipos";
import type { Filtro, OpcionCiudad } from "@/lib/vacantes/vista";

import estilos from "./trabaja.module.css";

/**
 * «Únete a nuestro equipo» y las vacantes (plantilla de Andrés): título y
 * frase en una fila sobre una línea, el filtro por ciudad (solo con 8 o más
 * vacantes) y una tarjeta por vacante con el cargo, la ciudad y «Ver oferta»,
 * que abre la vacante en Buk en otra pestaña. Sin vacantes (o con la lectura
 * apagada o sin copia), el aviso con el enlace al portal de Buk.
 *
 * Componente de servidor: el filtro son enlaces (`?ciudad=…`), sin JavaScript.
 */
const POR_FILA = 4;

function filas<T>(lista: T[]): T[][] {
  const salida: T[][] = [];
  for (let i = 0; i < lista.length; i += POR_FILA) salida.push(lista.slice(i, i + POR_FILA));
  return salida;
}

export function Vacantes({
  id,
  titulo,
  texto,
  vacantes,
  ciudades,
  filtro,
  ruta,
}: {
  id: string;
  titulo: string;
  texto: string;
  vacantes: Vacante[];
  /** Vacías: sin filtro. */
  ciudades: OpcionCiudad[];
  filtro: Filtro;
  /** La ruta de la página, con barra final, para los enlaces del filtro. */
  ruta: string;
}) {
  const idTitulo = `${id}-titulo`;
  const ciudadActual = filtro.tipo === "ciudad" ? filtro.ciudad.slug : null;
  return (
    <section id={id} className={estilos.equipo} aria-labelledby={idTitulo}>
      <div className={estilos.equipoCabecera}>
        <Revelado
          como="h2"
          id={idTitulo}
          texto={titulo}
          ritmo="titulo"
          className={estilos.equipoTitulo}
        />
        <Revelado como="p" texto={texto} ritmo="titulo" className={estilos.equipoTexto} />
      </div>

      {ciudades.length > 0 && (
        <nav className={estilos.filtro} aria-label="Filtrar las vacantes por ciudad">
          <ul className={estilos.filtroLista}>
            <li>
              <Link
                href={ruta}
                className={estilos.filtroOpcion}
                aria-current={ciudadActual === null ? "page" : undefined}
                prefetch={false}
              >
                Todas
              </Link>
            </li>
            {ciudades.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`${ruta}?ciudad=${c.slug}`}
                  className={estilos.filtroOpcion}
                  aria-current={ciudadActual === c.slug ? "page" : undefined}
                  prefetch={false}
                >
                  {c.nombre} <span className={estilos.filtroCuantas}>({c.cuantas})</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {vacantes.length > 0 ? (
        /* Filas de cuatro, cada una con su línea encima, como el diseño (también a 1010 px). */
        <div className={estilos.tarjetas}>
          {filas(vacantes).map((fila, i) => (
            <ul key={i} className={estilos.fila}>
              {fila.map((v) => (
                <li key={v.enlace} className={estilos.tarjeta}>
                  <h3 className={estilos.cargo}>{v.cargo}</h3>
                  <p className={estilos.ciudad}>
                    <IconMapPin aria-hidden="true" size={14} stroke={2} />
                    {v.ciudad}
                  </p>
                  <a
                    href={v.enlace}
                    className={estilos.boton}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Ver oferta: ${v.cargo}, ${v.ciudad} (se abre en otra pestaña, en Buk)`}
                  >
                    <IconEye aria-hidden="true" size={16} stroke={2} />
                    Ver oferta
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ) : (
        <div className={estilos.vacio}>
          <p className={estilos.vacioTitulo}>Ahora no tenemos vacantes abiertas</p>
          <p className={estilos.vacioTexto}>
            Consulta nuestro portal de empleo: allí publicamos cada oferta en cuanto se abre.
          </p>
          <a href={URL_PORTAL_BUK} className={estilos.boton} target="_blank" rel="noopener">
            Ver el portal de empleo
          </a>
        </div>
      )}
    </section>
  );
}
