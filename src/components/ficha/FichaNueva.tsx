import { IconBrandWhatsapp, IconFileTypePdf, IconView360 } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BotonVisorPdf } from "@/components/ficha/BotonVisorPdf";
import { BotonVista360 } from "@/components/ficha/BotonVista360";
import { GaleriaFicha, type FotoFicha } from "@/components/ficha/GaleriaFicha";
import { IconoDato } from "@/components/ficha/IconoDato";
import { RecuadroAsesoria } from "@/components/ficha/RecuadroAsesoria";
import estilos from "@/components/ficha/ficha.module.css";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { LogoMarca } from "@/components/marca/LogoMarca";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { PaginaVisor } from "@/lib/documentos/visor";
import type { LogoConAlt } from "@/lib/marca/logoMarca";
import type { DatoDestacado } from "@/lib/maquinaria/fichaTecnica";
import type { ImagenLista } from "@/lib/utils/relations";

import nueva from "./fichaNueva.module.css";

/*
 * FICHA DE MAQUINARIA NUEVA con la plantilla de Andrés («Ficha maquinaria
 * nueva», elementor 4036, 2026-10-21). La usan los equipos nuevos y los
 * aditamentos nuevos; la unidad USADA sigue con la ficha V2 (`FichaProducto`).
 *
 * Es la V2 (export 3166) con lo que cambia la 4036: cabecera sobre fondo
 * neutro (sin el degradado rojo, dirección), descripción y como mucho 5
 * características bajo el título (regla del cliente: sin tabla aparte), «Ficha técnica» (el PDF en el visor tipo libro)
 * y «Habla con un experto», «Ver en vista 360» si hay enlace, «Otras <tipo>»
 * con su franja, la llamada «Contáctanos para recibir asesoría», el contacto
 * con nuestro formulario y los testimonios. Reutiliza las clases de la V2
 * (`ficha.module.css`, que no se toca) y añade las suyas (`fichaNueva.module.css`).
 * Detalle y desviaciones: docs/diseno/decisiones-ficha-nueva.md.
 */

export type Miga = { nombre: string; path: string };

/** Un PDF que se abre en el visor: la URL, el tamaño y sus páginas como imágenes. */
export type PdfVisor = { url: string; tamano: string | null; paginas: PaginaVisor[] };

/** Una tarjeta de «Otras <tipo>». */
export type TarjetaOtra = {
  id: number;
  nombre: string;
  href: string;
  foto: ImagenLista | null;
  datos: DatoDestacado[];
  pdf: PdfVisor | null;
};

/**
 * Caracteres a partir de los que un valor puede no caber en una línea a 390 px
 * ni a todo el ancho (p. ej. «22/26/30 in (según requerimiento cliente)»): solo
 * en el teléfono, ese valor puede pasar a una segunda línea (pendiente de dirección).
 */
const VALOR_LARGO = 32;

function ListaDatos({
  datos,
  clase,
  apilado = false,
}: {
  datos: DatoDestacado[];
  clase: string;
  apilado?: boolean;
}) {
  if (datos.length === 0) return null;
  return (
    <ul className={clase}>
      {datos.map((d) => (
        <li
          key={`${d.etiqueta}-${d.valor}`}
          data-largo={apilado && d.valor.length > VALOR_LARGO ? "" : undefined}
        >
          <IconoDato icono={d.icono} className={estilos.iconoDato} />
          {apilado ? (
            // La copia invisible fija el alto: al llegar Inter, la pastilla no cambia de alto (CLS).
            <span
              className={nueva.reserva}
              data-reserva={`${d.etiqueta}:
${d.valor}`}
            >
              {/* Dos líneas exactas: el nombre y el valor, cada uno sin partir. */}
              <span className={`${estilos.datoApilado} ${nueva.dosLineas}`}>
                <b>{d.etiqueta}:</b> <span>{d.valor}</span>
              </span>
            </span>
          ) : (
            <span>
              <b>{d.etiqueta}:</b> {d.valor}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

type Props = {
  nombre: string;
  /** El título de escritorio en dos líneas (marca / referencia); sin él, el nombre. */
  tituloEscritorio: { marca: string; modelo: string } | null;
  migas: Miga[];
  fotos: FotoFicha[];
  /** La descripción comercial, ya pintada (texto enriquecido). */
  descripcion: ReactNode | null;
  /** Su texto plano (`reservaDescripcion`): la copia invisible que fija su alto (CLS). */
  reservaDescripcion: string;
  datos: DatoDestacado[];
  pdf: PdfVisor | null;
  vista360: string | null;
  /** Enlace de WhatsApp de «Habla con un experto»; `null` si la empresa no tiene número. */
  experto: { href: string } | null;
  /** «Otras <tipo>»: el título, el logo de la marca (o nada) y las tarjetas. */
  otras: { titulo: string; logo: LogoConAlt | null; tarjetas: TarjetaOtra[] };
  imagenContacto: ImagenLista | null;
  contactoEsFoto: boolean;
  /** El formulario de la ventana de «Contáctanos» (el mismo que el del contacto). */
  formulario: ConfigFormulario;
  /** Ancla del contacto de la página: destino de «Contáctanos» sin JavaScript. */
  anclaContacto: string;
  /** Datos estructurados (Product y BreadcrumbList), ya construidos por la página. */
  jsonLd: ReactNode;
  /** El contacto (nuestro formulario) y los testimonios, ya montados por la página. */
  cierre: ReactNode;
};

export function FichaNueva({
  nombre,
  tituloEscritorio,
  migas,
  fotos,
  descripcion,
  reservaDescripcion,
  datos,
  pdf,
  vista360,
  experto,
  otras,
  imagenContacto,
  contactoEsFoto,
  formulario,
  anclaContacto,
  jsonLd,
  cierre,
}: Props) {
  const hayIzquierda = fotos.length > 0 || datos.length > 0;
  const boton360 = vista360 ? (
    <BotonVista360 url={vista360} nombre={nombre} className={nueva.boton360}>
      <IconView360 aria-hidden="true" stroke={1.75} />
      Ver en vista 360
    </BotonVista360>
  ) : null;

  return (
    <main className={estilos.pagina}>
      {jsonLd}
      {/* La ficha ya tiene su llamada a la acción: el pie no pinta la tarjeta roja. */}
      <PieSinTarjeta />

      {/*
        1. CABECERA DEL PRODUCTO (dirección, 2026-10-21). En escritorio, dos
        columnas equilibradas: a la izquierda la galería y, debajo, las
        características; a la derecha las migas, el título, la descripción y los
        botones. En el HTML va primero la derecha (el <h1> antes que la galería).
        En tablet y móvil las dos columnas se deshacen (`display: contents`) y
        los bloques se ordenan: galería, migas y título, características,
        botones y descripción.
      */}
      <section
        className={`${estilos.principal} ${nueva.principal}`}
        data-sin-fotos={fotos.length === 0 ? "" : undefined}
        data-con-izquierda={hayIzquierda ? "" : undefined}
        aria-labelledby="ficha-titulo"
      >
        <div className={nueva.columnaTexto}>
          <div className={`${estilos.cabeceraDatos} ${nueva.cabecera}`}>
            {/* Migas: la ruta COMPLETA en la píldora, como en la V2. */}
            <nav aria-label="Ruta de navegación" className={`${estilos.migas} ${nueva.migas}`}>
              <ol>
                {migas.map((m, i) =>
                  i === migas.length - 1 ? (
                    <li key={m.path}>
                      <span aria-current="page">{m.nombre}</span>
                    </li>
                  ) : (
                    <li key={m.path}>
                      <Link href={`${m.path}${m.path.endsWith("/") ? "" : "/"}`}>{m.nombre}</Link>
                      <span aria-hidden="true"> / </span>
                    </li>
                  ),
                )}
              </ol>
            </nav>

            {/*
              UN SOLO <h1> con las dos variantes de la plantilla: en escritorio y
              tablet, la marca y la referencia en dos líneas; en móvil, el nombre
              completo. La que no se ve está oculta con `display: none`, así que
              el nombre accesible es siempre el de la variante visible.
            */}
            <h1
              id="ficha-titulo"
              className={`${estilos.titulo} ${nueva.titulo} texto-titulo-bloque`}
            >
              {tituloEscritorio ? (
                <>
                  {/* Con reserva de alto: «Case Construction» ocupa 2 líneas o 1 según la fuente. */}
                  <span
                    className={`${nueva.tituloEscritorio} ${nueva.reserva} ${nueva.reservaTitulo}`}
                    data-reserva={`${tituloEscritorio.marca}
${tituloEscritorio.modelo}`}
                  >
                    <span className={nueva.lineasTitulo}>
                      <span className={nueva.lineaMarca}>{tituloEscritorio.marca}</span>{" "}
                      <span>{tituloEscritorio.modelo}</span>
                    </span>
                  </span>
                  <span className={nueva.tituloMovil}>{nombre}</span>
                </>
              ) : (
                nombre
              )}
            </h1>
          </div>

          {descripcion ? (
            <div
              className={`${nueva.descripcion} ${nueva.reserva} texto-cuerpo`}
              data-reserva={reservaDescripcion}
            >
              <div className={nueva.cuerpoDescripcion}>{descripcion}</div>
            </div>
          ) : null}

          {fotos.length === 0 ? <div className={nueva.solo360}>{boton360}</div> : null}

          {pdf || experto ? (
            <div className={`${estilos.botones} ${nueva.botones}`}>
              {pdf ? (
                <BotonVisorPdf
                  titulo={`Ficha técnica: ${nombre}`}
                  pdf={{ url: pdf.url, tamano: pdf.tamano }}
                  paginas={pdf.paginas}
                  className={`${estilos.boton} ${estilos.botonGrande}`}
                >
                  <IconFileTypePdf aria-hidden="true" stroke={1.75} />
                  Ficha técnica
                </BotonVisorPdf>
              ) : null}
              {experto ? (
                <a
                  href={experto.href}
                  className={`${estilos.boton} ${estilos.botonOscuro} ${estilos.botonGrande}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
                  Habla con un experto
                  <span className="sr-only"> (abre WhatsApp)</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {hayIzquierda ? (
          <div className={nueva.columnaIzquierda}>
            {fotos.length > 0 ? (
              <div className={`${estilos.columnaGaleria} ${nueva.columnaGaleria}`}>
                {boton360}
                <GaleriaFicha fotos={fotos} nombre={nombre} sinFondo />
              </div>
            ) : null}
            <ListaDatos
              datos={datos}
              clase={`${estilos.datos} ${nueva.datos} texto-cuerpo`}
              apilado
            />
          </div>
        ) : null}
      </section>

      {/* 2. «OTRAS <TIPO>»: la franja con la foto del tipo y las tarjetas. Sin otras, no sale. */}
      {otras.tarjetas.length > 0 ? (
        <section className={nueva.otras} aria-labelledby="otras-del-tipo">
          <div className={nueva.franja}>
            {otras.logo ? (
              <span className={nueva.cajaLogoFranja}>
                <LogoMarca
                  logo={otras.logo}
                  alt={otras.logo.alt}
                  sizes="140px"
                  className={nueva.logoFranja}
                />
              </span>
            ) : null}
            <h2 id="otras-del-tipo" className={`${nueva.tituloFranja} texto-titulo-bloque`}>
              {otras.titulo}
            </h2>
          </div>
          <ul className={nueva.rejilla}>
            {otras.tarjetas.map((o) => (
              <li key={o.id} className={`${estilos.tarjeta} ${nueva.tarjeta}`}>
                {o.foto ? (
                  <Image
                    src={o.foto.url}
                    alt={o.foto.alt}
                    width={o.foto.width}
                    height={o.foto.height}
                    sizes="(min-width: 1025px) 28vw, (min-width: 768px) 42vw, 86vw"
                    className={estilos.fotoTarjeta}
                  />
                ) : null}
                <h3 className={`${estilos.nombreTarjeta} texto-destacado-negrita`}>{o.nombre}</h3>
                <ListaDatos datos={o.datos} clase={`${estilos.datosTarjeta} texto-cuerpo`} />
                <div className={estilos.botonesTarjeta}>
                  <Link href={o.href} className={`${estilos.boton} texto-etiqueta`}>
                    Ver más<span className="sr-only"> sobre {o.nombre}</span>
                  </Link>
                  {o.pdf ? (
                    <BotonVisorPdf
                      titulo={`Ficha técnica: ${o.nombre}`}
                      pdf={{ url: o.pdf.url, tamano: o.pdf.tamano }}
                      paginas={o.pdf.paginas}
                      className={`${estilos.boton} ${estilos.botonOscuro} texto-etiqueta`}
                    >
                      Ficha técnica<span className="sr-only"> de {o.nombre}</span>
                    </BotonVisorPdf>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 3. LLAMADA A CONTACTAR: la que ya tenemos (no la del operario de la plantilla). */}
      <section className={`${estilos.contacto} ${nueva.asesoria}`} aria-labelledby="asesoria">
        <RecuadroAsesoria
          formulario={formulario}
          hrefFormulario={`#${anclaContacto}`}
          experto={experto}
          imagenContacto={imagenContacto}
          contactoEsFoto={contactoEsFoto}
        />
      </section>

      {/* 4 y 5. CONTACTO (nuestro formulario) y TESTIMONIOS. */}
      <div className={nueva.cierre}>{cierre}</div>
    </main>
  );
}
