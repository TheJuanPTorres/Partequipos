import { LogoOpticoServidor } from "@/components/marca/LogoOpticoServidor";
import type { LogoMarca as DatosLogo } from "@/lib/marca/logoMarca";
import type { CajaRelativa } from "@/lib/marca/tamanoOptico";

import estilos from "./tarjetaModelo.module.css";

/**
 * La caja del logo de la tarjeta: 152 × 24 px (6,3:1), pegado a la izquierda. Con un área del 45 % de la
 * caja caben los logos de 3:1 a 8,2:1, y todas las marcas se ven con el mismo tamaño (ronda 20, t1).
 */
const CAJA_LOGO_TARJETA: CajaRelativa = { proporcion: 152 / 24, area: 0.45 };

/**
 * TARJETA DE MODELO del diseño v2 del cliente (2026-11-13), la de la lista de modelos de la página
 * de tipo (agrupada por serie) y la de «Otros modelos» de la ficha: dos capas (contenedor blanco
 * con borde suave y, dentro, el panel con su filo), el logo de la marca, el modelo en grande y su
 * serie, una barrida gris curva abajo a la derecha y el botón inclinado del color de la marca con
 * la flecha. Va dentro de `.pagina` de marca: el color es `--marca-amarillo` y la tinta de la
 * flecha `--marca-tinta` (blanco o negro, el que se lea). Una entrada sin ficha (`href` nulo) se
 * pinta sin botón ni enlace. El guion del modelo no se corta («ZX270LC-3»).
 */
export function TarjetaModelo({
  tipo,
  nombreLargo = false,
  modelo,
  detalle,
  nombreCompleto,
  href,
  logo,
}: {
  /** El tipo de máquina, pequeño y negro encima del modelo, en una sola línea. */
  tipo?: string | null;
  /** El título es un nombre de tipo («Miniexcavadora EX»), no un código: más pequeño y sin partir palabras. */
  nombreLargo?: boolean;
  modelo: string;
  detalle?: string | null;
  nombreCompleto: string;
  href: string | null;
  logo: DatosLogo | null;
}) {
  const contenido = (
    <span className={estilos.panel}>
      {href ? <span aria-hidden="true" className={estilos.barrida} /> : null}
      {logo ? (
        <LogoOpticoServidor
          logo={logo}
          caja={CAJA_LOGO_TARJETA}
          alt=""
          sizes="152px"
          alinear="izquierda"
          className={estilos.logo}
        />
      ) : null}
      <span className={estilos.texto}>
        {tipo ? <span className={estilos.tipo}>{tipo}</span> : null}
        <span className={`${estilos.modelo} ${nombreLargo ? estilos.modeloNombre : ""}`}>
          {modelo.replaceAll("-", "\u2011")}
        </span>
        {detalle ? <span className={estilos.detalle}>{detalle}</span> : null}
      </span>
      {href ? (
        <>
          <span aria-hidden="true" className={estilos.boton} />
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={estilos.flecha}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 18l6-6M13 6l6 6" />
          </svg>
        </>
      ) : null}
    </span>
  );
  return href ? (
    <a href={href} aria-label={nombreCompleto} className={`${estilos.capa} ${estilos.enlace}`}>
      {contenido}
    </a>
  ) : (
    <div className={`${estilos.capa} ${estilos.sinPagina}`}>{contenido}</div>
  );
}
