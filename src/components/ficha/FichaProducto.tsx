import { IconBrandWhatsapp, IconCirclePlus, IconFileTypePdf, IconMail } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BotonImprimir } from "@/components/ficha/BotonImprimir";
import { EngranajeMarca } from "@/components/ficha/EngranajeMarca";
import { GaleriaFicha, type FotoFicha } from "@/components/ficha/GaleriaFicha";
import { IconoDato } from "@/components/ficha/IconoDato";
import estilos from "@/components/ficha/ficha.module.css";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import type { DatoDestacado } from "@/lib/maquinaria/fichaTecnica";
import type { ImagenLista } from "@/lib/utils/relations";

/*
 * FICHA DE PRODUCTO V2 de ux-9 (export 3166, docs/diseno/decisiones-ficha.md).
 *
 * Una sola plantilla para la maquinaria NUEVA y para cada unidad de USADA
 * (2026-10-16, decisión de dirección: «no es un diseño nuevo, cambian solo los
 * datos»). Las dos páginas reúnen sus datos y se los pasan; aquí no se consulta
 * nada. Server Component salvo la galería y el botón de imprimir.
 */

/** Ancla del formulario de cotización: «Cotizar el equipo» y «Contáctanos» bajan aquí. */
export const ANCLA_COTIZAR = "cotizar";

export type Miga = { nombre: string; path: string };

export type FilaEspecificacion = { id?: string | null; etiqueta: string; valor: string };

/** Una tarjeta de «Otras referencias». */
export type OtraReferencia = {
  id: number;
  nombre: string;
  href: string;
  foto: ImagenLista | null;
  datos: DatoDestacado[];
  pdf: string | null;
};

/**
 * Datos con icono: la tarjeta principal (4) y las de otras referencias (3).
 * En la tarjeta principal la etiqueta y el valor van en líneas aparte
 * (`apilado`): así, al llegar Inter, el valor no salta de línea (CLS).
 */
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
        <li key={`${d.etiqueta}-${d.valor}`}>
          <IconoDato icono={d.icono} className={estilos.iconoDato} />
          <span className={apilado ? estilos.datoApilado : undefined}>
            <b>{d.etiqueta}:</b> {d.valor}
          </span>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  nombre: string;
  /** URL absoluta de la ficha, para compartir. */
  urlFicha: string;
  migas: Miga[];
  fotos: FotoFicha[];
  datos: DatoDestacado[];
  /** Enlace de WhatsApp de «Habla con un experto»; `null` si la empresa no tiene número. */
  experto?: { href: string } | null;
  /** Logo de la marca, sobre el texto; sin logo no se pinta. */
  logo: { url: string; alt: string; width: number; height: number } | null;
  /** Entradilla, descripción y puntos: lo que cambia entre nueva y usada. */
  cuerpo: ReactNode;
  especificaciones: FilaEspecificacion[];
  /** PDF de la ficha técnica; sin él, no hay botón. */
  pdf: string | null;
  /**
   * Con `true` y sin filas ni PDF, la columna lateral no lleva el título «Ficha
   * técnica» (solo los botones de compartir): la unidad usada no tiene ficha en filas.
   */
  ocultarTituloSinFicha?: boolean;
  /** «Otras referencias» (nueva) / «Otras unidades de esta categoría» (usada). */
  tituloOtras: string;
  textoVerMas: string;
  otras: OtraReferencia[];
  imagenContacto: ImagenLista | null;
  /** Un PNG es el recorte de ux-9 (sobresale del recuadro); otra cosa, una foto que lo llena. */
  contactoEsFoto: boolean;
  /** Datos estructurados (Product y BreadcrumbList), ya construidos por la página. */
  jsonLd: ReactNode;
  /** El formulario de cotización, con la referencia a lo que se cotiza. */
  formulario: ReactNode;
};

export function FichaProducto({
  nombre,
  urlFicha,
  migas,
  fotos,
  datos,
  experto,
  logo,
  cuerpo,
  especificaciones,
  pdf,
  ocultarTituloSinFicha = false,
  tituloOtras,
  textoVerMas,
  otras,
  imagenContacto,
  contactoEsFoto,
  jsonLd,
  formulario,
}: Props) {
  const compartirWhatsApp = `https://wa.me/?text=${encodeURIComponent(`${nombre}: ${urlFicha}`)}`;
  const compartirCorreo = `mailto:?subject=${encodeURIComponent(nombre)}&body=${encodeURIComponent(urlFicha)}`;
  const hayFicha = especificaciones.length > 0 || Boolean(pdf);
  const tituloFicha = hayFicha || !ocultarTituloSinFicha;

  return (
    <main className={estilos.pagina}>
      {jsonLd}
      {/* La ficha ya tiene su llamada a la acción: el pie no pinta la tarjeta roja. */}
      <PieSinTarjeta />

      {/* 1. TARJETA PRINCIPAL: galería, migas, título, datos y botones. */}
      <section
        className={estilos.principal}
        data-sin-fotos={fotos.length === 0 ? "" : undefined}
        aria-labelledby="ficha-titulo"
      >
        {fotos.length > 0 ? (
          <div className={estilos.columnaGaleria}>
            <GaleriaFicha fotos={fotos} nombre={nombre} />
          </div>
        ) : null}

        <div className={estilos.columnaDatos}>
          {/* Cabecera (migas + título): en móvil lleva un velo oscuro para que el título blanco se lea con cualquier foto. */}
          <div className={estilos.cabeceraDatos}>
            {/* Migas: la ruta COMPLETA en la píldora (desviación aprobada, decisiones-ficha.md). */}
            <nav aria-label="Ruta de navegación" className={estilos.migas}>
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

            <h1 id="ficha-titulo" className={`${estilos.titulo} texto-titulo-bloque`}>
              {nombre}
            </h1>
          </div>

          <ListaDatos datos={datos} clase={`${estilos.datos} texto-destacado`} apilado />

          <div className={`${estilos.botones} ${estilos.noImprimir}`}>
            <a href={`#${ANCLA_COTIZAR}`} className={`${estilos.boton} texto-etiqueta`}>
              <IconCirclePlus aria-hidden="true" stroke={1.75} />
              Cotizar el equipo
            </a>
            {experto ? (
              <a
                href={experto.href}
                className={`${estilos.boton} ${estilos.botonOscuro} texto-etiqueta`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
                Habla con un experto
                <span className="sr-only"> (abre WhatsApp)</span>
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* 2. DESCRIPCIÓN Y FICHA TÉCNICA. */}
      <section
        className={estilos.descripcion}
        aria-labelledby={tituloFicha ? "ficha-tecnica" : undefined}
        aria-label={tituloFicha ? undefined : "Descripción"}
      >
        <div className={estilos.columnaTexto}>
          {logo ? (
            <Image
              src={logo.url}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              sizes="95px"
              className={estilos.logoMarca}
            />
          ) : null}
          <div className={`${estilos.texto} texto-cuerpo`}>{cuerpo}</div>
        </div>

        <div className={estilos.columnaFicha}>
          {tituloFicha ? (
            <h2 id="ficha-tecnica" className={`${estilos.subtitulo} texto-titulo-3`}>
              Ficha técnica
            </h2>
          ) : null}
          {especificaciones.length > 0 ? (
            <dl className={`${estilos.especificaciones} texto-cuerpo`}>
              {especificaciones.map((e) => (
                <div key={e.id ?? e.etiqueta}>
                  <dt>{e.etiqueta}:</dt> <dd>{e.valor}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {pdf ? (
            <a
              href={pdf}
              className={`${estilos.boton} ${estilos.noImprimir} texto-etiqueta`}
              target="_blank"
              rel="noopener"
            >
              <IconFileTypePdf aria-hidden="true" stroke={1.75} />
              Descargar ficha técnica completa
              <span className="sr-only"> (PDF)</span>
            </a>
          ) : null}
          <ul className={`${estilos.compartir} ${estilos.noImprimir}`} aria-label="Compartir">
            <li>
              <a
                href={compartirWhatsApp}
                className={estilos.botonCompartir}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartir por WhatsApp"
              >
                <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
              </a>
            </li>
            <li>
              <a
                href={compartirCorreo}
                className={estilos.botonCompartir}
                aria-label="Compartir por correo"
              >
                <IconMail aria-hidden="true" stroke={1.75} />
              </a>
            </li>
            <li>
              <BotonImprimir className={estilos.botonCompartir} />
            </li>
          </ul>
        </div>
      </section>

      {/* 3. OTRAS REFERENCIAS (sin otras, no sale). */}
      {otras.length > 0 ? (
        <section
          className={`${estilos.otras} ${estilos.noImprimir}`}
          aria-labelledby="otras-referencias"
        >
          <h2 id="otras-referencias" className={`${estilos.tituloOtras} texto-titulo-bloque`}>
            {tituloOtras}
          </h2>
          <ul className={estilos.tarjetas}>
            {otras.map((o) => (
              <li key={o.id} className={estilos.tarjeta}>
                {o.foto ? (
                  <Image
                    src={o.foto.url}
                    alt={o.foto.alt}
                    width={o.foto.width}
                    height={o.foto.height}
                    sizes="(min-width: 1025px) 26vw, (min-width: 768px) 40vw, 78vw"
                    className={estilos.fotoTarjeta}
                  />
                ) : null}
                <h3 className={`${estilos.nombreTarjeta} texto-destacado-negrita`}>{o.nombre}</h3>
                <ListaDatos datos={o.datos} clase={`${estilos.datosTarjeta} texto-cuerpo`} />
                <div className={estilos.botonesTarjeta}>
                  <Link href={o.href} className={`${estilos.boton} texto-etiqueta`}>
                    {textoVerMas}
                    <span className="sr-only"> sobre {o.nombre}</span>
                  </Link>
                  {o.pdf ? (
                    <a
                      href={o.pdf}
                      className={`${estilos.boton} ${estilos.botonOscuro} texto-etiqueta`}
                      target="_blank"
                      rel="noopener"
                    >
                      Ficha técnica<span className="sr-only"> de {o.nombre} (PDF)</span>
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 4. LLAMADA A CONTACTAR y, debajo, el formulario de cotización. */}
      <section className={`${estilos.contacto} ${estilos.noImprimir}`} aria-labelledby="asesoria">
        <div className={estilos.recuadroContacto}>
          <div className={estilos.textoContacto}>
            <h2 id="asesoria" className={`${estilos.tituloContacto} texto-titulo-seccion`}>
              Contáctanos para recibir asesoría
            </h2>
            <div className={estilos.botonesContacto}>
              <a href={`#${ANCLA_COTIZAR}`} className={`${estilos.boton} texto-etiqueta`}>
                <IconMail aria-hidden="true" stroke={1.75} />
                Contáctanos
              </a>
              {experto ? (
                <a
                  href={experto.href}
                  className={`${estilos.boton} texto-etiqueta`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
                  WhatsApp<span className="sr-only"> (abre WhatsApp)</span>
                </a>
              ) : null}
            </div>
          </div>
          {imagenContacto && contactoEsFoto ? (
            <div className={`${estilos.imagenContacto} ${estilos.imagenContactoFoto}`}>
              <Image
                src={imagenContacto.url}
                alt=""
                width={imagenContacto.width}
                height={imagenContacto.height}
                sizes="(min-width: 768px) 46vw, 90vw"
                className={estilos.fotoContactoLlena}
                style={{ objectPosition: imagenContacto.posicion }}
              />
            </div>
          ) : (
            <div className={estilos.imagenContacto}>
              <EngranajeMarca className={estilos.engranaje} />
              {imagenContacto ? (
                <Image
                  src={imagenContacto.url}
                  alt=""
                  width={imagenContacto.width}
                  height={imagenContacto.height}
                  sizes="(min-width: 1025px) 430px, (min-width: 768px) 305px, 210px"
                  className={estilos.fotoContacto}
                />
              ) : null}
            </div>
          )}
        </div>

        <div id={ANCLA_COTIZAR} className={estilos.formulario}>
          {/*
           * Cotización con la referencia ya preseleccionada: quien llega hasta aquí ya
           * sabe qué quiere, y volver a escribirlo es fricción que cuesta leads.
           */}
          {formulario}
        </div>
      </section>
    </main>
  );
}
