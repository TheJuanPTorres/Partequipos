import { IconBrandWhatsapp, IconFileTypePdf, IconView360 } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { BotonVisorPdf } from "@/components/ficha/BotonVisorPdf";
import { BotonVista360 } from "@/components/ficha/BotonVista360";
import { GaleriaFicha, type FotoFicha } from "@/components/ficha/GaleriaFicha";
import { IconoDato } from "@/components/ficha/IconoDato";
import { PastillaDato } from "@/components/ficha/PastillaDato";
import { sinCortarCodigos } from "@/components/ficha/SinCorte";
import { RecuadroAsesoria } from "@/components/ficha/RecuadroAsesoria";
import estilos from "@/components/ficha/ficha.module.css";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { BannerMarcaTipo } from "@/components/nueva/BannerMarcaTipo";
import { CabeceraKit } from "@/components/nueva/kit/CabeceraKit";
import { EmblemaKit } from "@/components/nueva/kit/EmblemaKit";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { PaginaVisor } from "@/lib/documentos/visor";
import type { LogoConAlt } from "@/lib/marca/logoMarca";
import type { DatoDestacado } from "@/lib/maquinaria/fichaTecnica";
import type { VistaBanner } from "@/lib/nueva/bannerMarca";
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

/** Destino del indicador de la cabecera del kit: la tarjeta del equipo. */
const ANCLA_PRODUCTO = "ficha-equipo";

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
      {datos.map((d) =>
        apilado ? (
          // Dos líneas exactas, el nombre y el valor, con «…» si no caben.
          <PastillaDato
            key={`${d.etiqueta}-${d.valor}`}
            etiqueta={d.etiqueta}
            valor={d.valor}
            icono={<IconoDato icono={d.icono} className={estilos.iconoDato} />}
          />
        ) : (
          <li key={`${d.etiqueta}-${d.valor}`}>
            <IconoDato icono={d.icono} className={estilos.iconoDato} />
            <span>
              <b>{d.etiqueta}:</b> {d.valor}
            </span>
          </li>
        ),
      )}
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
  /**
   * «Otros modelos de <tipo>»: el banner de marca del #385 (`BannerMarcaTipo`: logo, color y
   * foto de la marca; «Ver marca» a la página de la marca y el tipo), sin conteo, y las tarjetas.
   */
  otras: {
    titulo: string;
    logo: LogoConAlt | null;
    tarjetas: TarjetaOtra[];
    vista: VistaBanner;
    marca: { nombre: string; href: string };
  };
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
  /**
   * La marca tiene «Kit de marca» (2026-10-27): la cabecera del kit (banda con su color, placa con
   * el logo, su foto y el emblema) con las migas y el `<h1>`. `null`: la cabecera de siempre.
   */
  kit?: {
    acento: string;
    tinta: string;
    fondo: ImagenLista | null;
    logo: LogoConAlt | null;
    emblema: ImagenLista | null;
  } | null;
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
  kit = null,
}: Props) {
  const hayIzquierda = fotos.length > 0 || datos.length > 0;
  const boton360 = vista360 ? (
    <BotonVista360 url={vista360} nombre={nombre} className={nueva.boton360}>
      <IconView360 aria-hidden="true" stroke={1.75} />
      Ver en vista 360
    </BotonVista360>
  ) : null;

  /**
   * Las migas: la ruta COMPLETA en la píldora, como en la V2, en la tarjeta o en la cabecera del
   * kit. Reservan su alto (#390): una copia oculta de la lista, con las líneas que saldrían en
   * «Inter Fallback» ensanchada, en la misma celda; sin ella, una miga larga ocupaba una línea más
   * antes de llegar Inter y el título saltaba 18 px a 390 (CLS 0,059).
   */
  const migasFicha = (clase: string) => (
    <nav aria-label="Ruta de navegación" className={`${clase} ${nueva.migasReserva}`}>
      <ol>
        {migas.map((m, i) =>
          i === migas.length - 1 ? (
            <li key={m.path}>
              <span aria-current="page">{sinCortarCodigos(m.nombre, nueva.sinCorte)}</span>
            </li>
          ) : (
            <li key={m.path}>
              <Link href={`${m.path}${m.path.endsWith("/") ? "" : "/"}`}>{m.nombre}</Link>
              <span aria-hidden="true"> / </span>
            </li>
          ),
        )}
      </ol>
      <ol aria-hidden="true" className={nueva.copiaMigas}>
        {migas.map((m, i) => (
          <li key={m.path}>
            {i === migas.length - 1 ? sinCortarCodigos(m.nombre, nueva.sinCorte) : m.nombre}
            {i < migas.length - 1 ? " / " : null}
          </li>
        ))}
      </ol>
    </nav>
  );

  /*
   * UN SOLO <h1> con las dos variantes de la plantilla: en escritorio y tablet, la marca y la
   * referencia en dos líneas; en móvil, el nombre completo. La que no se ve está oculta con
   * `display: none`, así que el nombre accesible es siempre el de la variante visible. Con el
   * kit, el <h1> va en su cabecera (el nombre completo).
   */
  const tituloFicha = (
    <h1 id="ficha-titulo" className={`${estilos.titulo} ${nueva.titulo} texto-titulo-bloque`}>
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
              <span>{sinCortarCodigos(tituloEscritorio.modelo, nueva.sinCorte)}</span>
            </span>
          </span>
          <span className={nueva.tituloMovil}>{sinCortarCodigos(nombre, nueva.sinCorte)}</span>
        </>
      ) : (
        nombre
      )}
    </h1>
  );

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
      {kit ? (
        <div
          className={nueva.cabeceraKit}
          style={{ "--acento": kit.acento, "--tinta": kit.tinta } as CSSProperties}
        >
          <CabeceraKit
            id="ficha-titulo"
            titulo={nombre}
            texto=""
            fondo={kit.fondo}
            logo={kit.logo}
            destino={`#${ANCLA_PRODUCTO}`}
            etiquetaRaton="Ir al equipo"
            migas={migasFicha(`${estilos.migas} ${nueva.migas} ${nueva.migasKit}`)}
            contenidoTitulo={
              // Con reserva de alto: el contenido va centrado en el panel y no se mueve.
              <span className={`${nueva.reserva} ${nueva.reservaKit}`} data-reserva={nombre}>
                <span>{sinCortarCodigos(nombre, nueva.sinCorte)}</span>
              </span>
            }
          />
        </div>
      ) : null}

      <EmblemaKit emblema={kit?.emblema ?? null}>
        <section
          id={ANCLA_PRODUCTO}
          tabIndex={-1}
          className={`${estilos.principal} ${nueva.principal}`}
          data-sin-fotos={fotos.length === 0 ? "" : undefined}
          data-con-izquierda={hayIzquierda ? "" : undefined}
          data-con-kit={kit ? "" : undefined}
          // Con el kit, el <h1> ya da nombre a su cabecera: la tarjeta no repite la región.
          aria-labelledby={kit ? undefined : "ficha-titulo"}
        >
          <div className={nueva.columnaTexto}>
            {kit ? null : (
              <div className={`${estilos.cabeceraDatos} ${nueva.cabecera}`}>
                {migasFicha(`${estilos.migas} ${nueva.migas}`)}

                {tituloFicha}
              </div>
            )}

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
      </EmblemaKit>

      {/* 2. «OTROS MODELOS DE <TIPO>»: el banner de marca y las tarjetas. Sin otras, no sale. */}
      {otras.tarjetas.length > 0 ? (
        <section className={nueva.otras} aria-labelledby="otras-del-tipo">
          <BannerMarcaTipo
            id="otras-del-tipo"
            titulo={otras.titulo}
            marca={otras.marca}
            logo={otras.logo}
            vista={otras.vista}
          />
          <ul className={`${nueva.rejilla} ${nueva.rejillaOtras}`}>
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
