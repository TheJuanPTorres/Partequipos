import {
  IconBrandWhatsapp,
  IconCirclePlus,
  IconFileTypePdf,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

import { BotonImprimir } from "@/components/ficha/BotonImprimir";
import { GaleriaFicha, type FotoFicha } from "@/components/ficha/GaleriaFicha";
import { IconoDato } from "@/components/ficha/IconoDato";
import estilos from "@/components/ficha/ficha.module.css";
import usado from "@/components/ficha/fichaUsado.module.css";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { RecuadroAsesoria } from "@/components/ficha/RecuadroAsesoria";
import type { DatoDestacado } from "@/lib/maquinaria/fichaTecnica";
import type { ImagenLista } from "@/lib/utils/relations";
import { LogoMarca } from "@/components/marca/LogoMarca";
import type { LogoConAlt } from "@/lib/marca/logoMarca";
import wa from "@/components/whatsapp/botonWhatsapp.module.css";

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
  /** El logo de la marca, el de todo el sitio (`LogoMarca`). */
  logo: LogoConAlt | null;
  /** Entradilla, descripción y puntos: lo que cambia entre nueva y usada. */
  cuerpo: ReactNode;
  especificaciones: FilaEspecificacion[];
  /** PDF de la ficha técnica; sin él, no hay botón. */
  pdf: string | null;
  /** «Otras referencias» (nueva) / «Otras unidades de esta categoría» (usada). */
  tituloOtras: string;
  textoVerMas: string;
  otras: OtraReferencia[];
  imagenContacto: ImagenLista | null;
  /** Un PNG es el recorte de ux-9 (sobresale del recuadro); otra cosa, una foto que lo llena. */
  contactoEsFoto: boolean;
  /** Datos estructurados (Product y BreadcrumbList), ya construidos por la página. */
  jsonLd: ReactNode;
  /** El formulario de cotización (la ventana emergente), con la referencia a lo que se cotiza. */
  formulario: ConfigFormulario;
  /** El teléfono de la empresa, destacado en el bloque de acciones; sin él, no sale. */
  telefono?: { etiqueta: string; href: string | null } | null;
  /** El bloque de contacto del final (con su ancla `ANCLA_COTIZAR`). */
  contacto: ReactNode;
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
  tituloOtras,
  textoVerMas,
  otras,
  imagenContacto,
  contactoEsFoto,
  jsonLd,
  formulario,
  telefono,
  contacto,
}: Props) {
  const compartirCorreo = `mailto:?subject=${encodeURIComponent(nombre)}&body=${encodeURIComponent(urlFicha)}`;

  return (
    <main className={estilos.pagina}>
      {jsonLd}
      {/* La ficha ya tiene su llamada a la acción: el pie no pinta la tarjeta roja. */}
      <PieSinTarjeta />

      {/* 1. TARJETA PRINCIPAL: galería, migas, título, datos y botones. */}
      <section
        className={`${estilos.principal} ${estilos.principalUsada}`}
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
            <BotonFormulario
              href={`#${ANCLA_COTIZAR}`}
              className={`${estilos.boton} ${estilos.botonGrande}`}
              formulario={formulario}
            >
              <IconCirclePlus aria-hidden="true" stroke={1.75} />
              Cotizar el equipo
            </BotonFormulario>
            {experto ? (
              <a
                href={experto.href}
                className={`${estilos.boton} ${estilos.botonOscuro} ${estilos.botonGrande} ${wa.botonWhatsapp}`}
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

      {/*
       * 2. DESCRIPCIÓN Y ACCIONES (ronda 19, t7, 2026-11-17): la descripción con ancho de lectura
       * y, al lado, el bloque de acciones con texto (WhatsApp, correo, imprimir, la ficha técnica
       * en PDF si la hay) y el teléfono destacado. Apilado en móvil y tablet.
       */}
      <section className={usado.seccion} aria-label="Descripción y acciones">
        <div className={`${usado.texto} texto-cuerpo`}>
          {logo ? (
            <LogoMarca logo={logo} alt={logo.alt} sizes="95px" className={estilos.logoMarca} />
          ) : null}
          {cuerpo}
          {especificaciones.length > 0 ? (
            <>
              <h2 id="ficha-tecnica" className={`${estilos.subtitulo} texto-titulo-3`}>
                Ficha técnica
              </h2>
              <dl className={`${estilos.especificaciones} texto-cuerpo`}>
                {especificaciones.map((e) => (
                  <div key={e.id ?? e.etiqueta}>
                    <dt>{e.etiqueta}:</dt> <dd>{e.valor}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
        </div>

        <aside
          className={`${usado.acciones} ${estilos.noImprimir}`}
          aria-labelledby="ficha-acciones"
        >
          <h2 id="ficha-acciones" className={`${usado.accionesTitulo} texto-destacado`}>
            ¿Te interesa esta unidad?
          </h2>
          {formulario.whatsapp ? (
            <a
              href={formulario.whatsapp.href}
              className={`${usado.boton} ${wa.botonWhatsapp} texto-etiqueta`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
              Escríbenos por WhatsApp
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          ) : null}
          <a href={compartirCorreo} className={`${usado.boton} texto-etiqueta`}>
            <IconMail aria-hidden="true" stroke={1.75} />
            Enviar por correo
          </a>
          <BotonImprimir className={`${usado.boton} texto-etiqueta`}>Imprimir ficha</BotonImprimir>
          {pdf ? (
            <a
              href={pdf}
              className={`${usado.boton} texto-etiqueta`}
              target="_blank"
              rel="noopener"
            >
              <IconFileTypePdf aria-hidden="true" stroke={1.75} />
              Ficha técnica
              <span className="sr-only"> (PDF)</span>
            </a>
          ) : null}
          {telefono ? (
            <p className={usado.telefono}>
              <span className={`${usado.telefonoEtiqueta} texto-etiqueta`}>O llámanos</span>
              {telefono.href ? (
                <a href={telefono.href} className={usado.telefonoNumero}>
                  <IconPhone aria-hidden="true" stroke={1.75} size={22} />
                  {telefono.etiqueta}
                </a>
              ) : (
                <span className={usado.telefonoNumero}>{telefono.etiqueta}</span>
              )}
            </p>
          ) : null}
        </aside>
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
        <RecuadroAsesoria
          formulario={formulario}
          hrefFormulario={`#${ANCLA_COTIZAR}`}
          experto={experto}
          imagenContacto={imagenContacto}
          contactoEsFoto={contactoEsFoto}
        />
      </section>

      {/*
       * 5. CONTACTO: el bloque moderno de las fichas de nueva y de repuestos (`ContactoMarca`,
       * 2026-11-17), con la unidad ya puesta en la consulta. Lo pinta la página, con el ancla
       * `ANCLA_COTIZAR` («Cotizar el equipo» y «Contáctanos» bajan aquí).
       */}
      <div className={estilos.noImprimir}>{contacto}</div>
    </main>
  );
}
