import { IconEye, IconMapPin } from "@tabler/icons-react";
import type { CSSProperties } from "react";

import { ZonaCatalogo } from "@/components/listado/ZonaCatalogo";
import { Revelado } from "@/components/movimiento/Revelado";
import { BotonHojaDeVida } from "@/components/trabaja/BotonHojaDeVida";
import { ContadorVacantes } from "@/components/trabaja/ContadorVacantes";
import { FiltroCiudades } from "@/components/trabaja/FiltroCiudades";
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
 * El filtro son enlaces (`?ciudad=…`) que funcionan sin JavaScript. Con él,
 * cambiar de ciudad solo actualiza las tarjetas, sin recargar ni subir (Juan
 * Pablo, 2026-10-23): `ZonaCatalogo`, el mismo de los listados de usados
 * (#317), navega con `scroll: false` a la misma URL, con atrás y adelante.
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
  clave,
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
  /** Ruta y consulta de la URL pintada: `ZonaCatalogo` sabe así que cambió. */
  clave: string;
}) {
  const idTitulo = `${id}-titulo`;
  const ciudadActual = filtro.tipo === "ciudad" ? filtro.ciudad.slug : null;
  return (
    <section id={id} className={estilos.equipo} aria-labelledby={idTitulo}>
      {/*
       * Con reserva de alto (CLS): con la cabecera baja, este bloque entra en
       * la primera pantalla, y al llegar Inter el título, la frase y las
       * píldoras del filtro cambiaban de ancho y de líneas (CLS medido de 0,12
       * a 1010). La copia invisible en la fuente de respaldo fija su caja.
       */}
      <div className={estilos.equipoCabecera}>
        <div className={`${estilos.equipoTitulo} ${estilos.reserva}`} data-reserva={titulo}>
          <Revelado
            como="h2"
            id={idTitulo}
            texto={titulo}
            ritmo="titulo"
            className={estilos.heredado}
          />
        </div>
        <div className={`${estilos.equipoTexto} ${estilos.reserva}`} data-reserva={texto}>
          <Revelado como="p" texto={texto} ritmo="titulo" className={estilos.heredado} />
        </div>
      </div>

      <ZonaCatalogo clave={clave} lateral={false} className={estilos.zona}>
        {ciudades.length > 0 && (
          <nav
            className={estilos.filtro}
            aria-label="Filtrar las vacantes por ciudad"
            data-catalogo-nav=""
          >
            <FiltroCiudades ciudades={ciudades} ciudadActual={ciudadActual} ruta={ruta} />
          </nav>
        )}

        {/* «N vacantes abiertas» (T4): también anuncia el cambio al filtrar (lectores de pantalla). */}
        {vacantes.length > 0 && <ContadorVacantes total={vacantes.length} />}
        {ciudades.length > 0 && filtro.tipo === "ciudad" && (
          <p className={estilos.soloLectores} aria-live="polite">
            {vacantes.length === 1 ? "1 vacante" : `${vacantes.length} vacantes`} en{" "}
            {filtro.ciudad.nombre}
          </p>
        )}

        <div className={estilos.resultados}>
          {vacantes.length > 0 ? (
            /* Filas de cuatro, cada una con su línea encima, como el diseño (también a 1010 px). */
            <div className={estilos.tarjetas}>
              {filas(vacantes).map((fila, i) => (
                <ul key={i} className={estilos.fila}>
                  {fila.map((v, j) => (
                    <li
                      key={v.enlace}
                      className={estilos.tarjeta}
                      style={{ "--i": i * POR_FILA + j } as CSSProperties}
                    >
                      <h3 className={estilos.cargo}>{v.cargo}</h3>
                      <p className={estilos.ciudad}>
                        <IconMapPin aria-hidden="true" size={14} stroke={2} />
                        {v.ciudad}
                      </p>
                      <div className={estilos.acciones}>
                        <BotonHojaDeVida
                          vacante={v.cargo}
                          ciudad={v.ciudad}
                          hrefSinJs={v.enlace}
                          className={`${estilos.boton} ${estilos.botonSecundario}`}
                        />
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
                      </div>
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
        </div>
      </ZonaCatalogo>
    </section>
  );
}
