import { IconArrowRight, IconBrandWhatsapp, IconFileTypePdf } from "@tabler/icons-react";
import Image from "next/image";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { RichText } from "@/components/layout/RichText";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { SeccionLubricante } from "@/lib/lubricantes/marca";
import { estiloDeIdentidad } from "@/lib/lubricantes/identidad";
import { rutas } from "@/lib/routes";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import type { EnlaceWhatsApp } from "@/lib/whatsapp";
import type { MarcasLubricante } from "@/payload-types";

import estilos from "./marcaLubricante.module.css";
import { VideoCabecera } from "./VideoCabecera";

/**
 * PÁGINA DE LA MARCA DE LUBRICANTES (`/lubricantes/lubricantes-eni/`) — un «sitio dentro del
 * sitio» con la identidad de la marca (2026-10-19, cliente): cabecera de fuerza, cifras del
 * catálogo, las líneas de producto como tarjetas con foto, el catálogo de cada línea con su
 * ficha técnica en PDF y una llamada clara a cotizar (formulario y WhatsApp). La cabecera, el
 * menú y el pie son los de Partequipos.
 *
 * Componente de SERVIDOR, sin JavaScript propio. Los colores salen del panel (`colorPrincipal`
 * y `colorOscuro` de la marca) como variables CSS; el texto sobre cada uno se elige solo
 * (AA garantizado). Todo el contenido está en el HTML, como lo lee Google.
 */
const ANCLA_LINEAS = "lineas";
const ANCLA_CONTACTO = "contacto";

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export function PaginaMarcaLubricante({
  marca,
  secciones,
  whatsapp,
}: {
  marca: MarcasLubricante;
  secciones: SeccionLubricante[];
  whatsapp?: EnlaceWhatsApp;
}) {
  const titulo = `Lubricantes ${marca.nombre}`;
  // El mismo formulario en la página y en la ventana de los botones de cotizar.
  const formulario: ConfigFormulario = {
    tipo: "contacto",
    origen: `${rutas.marcaLubricante(marca.slug)}/`,
    siteKey: turnstileSiteKey(),
    whatsapp,
    titulo: `Formulario de contacto sobre ${titulo}`,
    textoBoton: "Pedir cotización",
    etiquetaMensaje: "¿Qué necesitas?",
  };
  const fondo = imagenDeMedia(marca.imagenCabecera, "");
  const logo = imagenDeMedia(marca.logo, `Logo de ${marca.nombre}`);
  const entradilla = marca.entradilla?.trim() ?? "";
  const video = typeof marca.videoCabecera === "object" ? (marca.videoCabecera?.url ?? null) : null;
  const cuenta = (s: SeccionLubricante) => s.grupos.reduce((n, g) => n + g.productos.length, 0);

  return (
    <main
      className={estilos.pagina}
      style={estiloDeIdentidad(marca.colorPrincipal, marca.colorOscuro)}
    >
      {/* --- Cabecera --- */}
      <section id="lub-hero" className={estilos.hero} aria-labelledby="lub-titulo">
        {fondo ? (
          <div className={estilos.heroFoto} aria-hidden="true">
            <Image
              src={fondo.url}
              alt=""
              fill
              priority
              sizes="100vw"
              className={estilos.heroFotoImg}
            />
          </div>
        ) : null}
        {video ? <VideoCabecera url={video} idHero="lub-hero" /> : null}
        <div className={estilos.contenedor}>
          <div className={estilos.heroInterior}>
            {logo ? (
              <div className={estilos.placaLogo}>
                <Image
                  src={logo.url}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  priority
                  className={estilos.logo}
                />
              </div>
            ) : null}
            <h1 id="lub-titulo" className={estilos.h1}>
              Lubricantes <em>{marca.nombre}</em>
            </h1>
            {entradilla ? <p className={estilos.lede}>{entradilla}</p> : null}
            <div className={estilos.acciones}>
              <BotonFormulario
                href={`#${ANCLA_CONTACTO}`}
                className={`${estilos.boton} ${estilos.botonPrincipal}`}
                formulario={formulario}
              >
                Pedir cotización
              </BotonFormulario>
              {whatsapp ? (
                <a
                  href={whatsapp.href}
                  className={`${estilos.boton} ${estilos.botonSecundario}`}
                  target="_blank"
                  rel="noopener"
                >
                  <IconBrandWhatsapp aria-hidden="true" focusable="false" stroke={1.8} size={22} />
                  Hablar por WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* --- Las líneas --- */}
      {secciones.length > 0 ? (
        <section
          id={ANCLA_LINEAS}
          className={estilos.bloque}
          aria-labelledby={`${ANCLA_LINEAS}-titulo`}
        >
          <div className={estilos.contenedor}>
            <h2 id={`${ANCLA_LINEAS}-titulo`} className={estilos.titulo}>
              Encuentra el lubricante para tu equipo
            </h2>
            <p className={estilos.subtitulo}>
              Elige la línea y mira cada producto con su ficha técnica.
            </p>
            <ul className={estilos.lineas}>
              {secciones.map((s) => (
                <li key={s.ancla}>
                  <a href={`#${s.ancla}`} className={estilos.tarjetaLinea}>
                    {s.imagen ? (
                      <Image
                        src={s.imagen.url}
                        alt=""
                        fill
                        sizes="(max-width: 767px) 46vw, (max-width: 1024px) 46vw, 300px"
                        className={estilos.tarjetaLineaFoto}
                      />
                    ) : null}
                    <h3 className={estilos.nombreLinea}>{s.nombre}</h3>
                    <span className={estilos.cuentaLinea}>
                      {plural(cuenta(s), "producto", "productos")}
                      <IconArrowRight aria-hidden="true" focusable="false" stroke={2} size={18} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {marca.descripcion ? (
        <section className={`${estilos.bloque} ${estilos.sobre}`} aria-label={`Sobre ${titulo}`}>
          <div className={`${estilos.contenedor} ${estilos.sobreTexto}`}>
            <RichText data={marca.descripcion} />
          </div>
        </section>
      ) : null}

      {/* --- El catálogo de cada línea --- */}
      {secciones.map((s, i) => {
        const idTitulo = `${s.ancla}-titulo`;
        return (
          <section
            key={s.ancla}
            id={s.ancla}
            className={`${estilos.seccion} ${i % 2 === 1 ? estilos.seccionAlterna : ""}`}
            aria-labelledby={idTitulo}
          >
            <div className={estilos.contenedor}>
              <div className={estilos.cabeceraSeccion}>
                <div>
                  <span className={estilos.etiquetaLinea}>
                    {plural(cuenta(s), "producto", "productos")}
                  </span>
                  <h2 id={idTitulo} className={estilos.titulo}>
                    {s.nombre}
                  </h2>
                  {s.entradilla ? <p className={estilos.subtitulo}>{s.entradilla}</p> : null}
                </div>
                <BotonFormulario
                  href={`#${ANCLA_CONTACTO}`}
                  className={`${estilos.boton} ${estilos.botonPrincipal}`}
                  style={{ background: "var(--lub-oscuro)", color: "var(--lub-principal)" }}
                  formulario={formulario}
                >
                  Cotizar esta línea
                </BotonFormulario>
              </div>

              {s.grupos.map((g) => (
                <div key={g.clave}>
                  {g.titulo ? <h3 className={estilos.tituloGrupo}>{g.titulo}</h3> : null}
                  <ul className={estilos.productos}>
                    {g.productos.map((p) => (
                      <li key={p.clave} className={estilos.producto}>
                        <div className={estilos.fotoCaja}>
                          {p.imagen ? (
                            <Image
                              src={p.imagen.url}
                              alt={p.imagen.alt}
                              width={p.imagen.width}
                              height={p.imagen.height}
                              sizes="(max-width: 767px) 44vw, (max-width: 1024px) 30vw, 280px"
                              className={estilos.foto}
                            />
                          ) : null}
                        </div>
                        <div className={estilos.productoCuerpo}>
                          {p.grado ? <p className={estilos.grado}>{p.grado}</p> : null}
                          <p className={estilos.nombre}>{p.nombre}</p>
                          {p.ficha ? (
                            <a
                              href={p.ficha}
                              className={estilos.ficha}
                              target="_blank"
                              rel="noopener"
                              aria-label={`Ficha técnica de ${p.nombre}${p.grado ? ` ${p.grado}` : ""} (PDF, se abre en otra pestaña)`}
                            >
                              <IconFileTypePdf
                                aria-hidden="true"
                                focusable="false"
                                stroke={1.6}
                                size={20}
                              />
                              Ficha técnica
                            </a>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* --- Contacto --- */}
      <section
        id={ANCLA_CONTACTO}
        className={estilos.contacto}
        aria-labelledby={`${ANCLA_CONTACTO}-titulo`}
      >
        <div className={`${estilos.contenedor} ${estilos.contactoRejilla}`}>
          <div>
            <h2 id={`${ANCLA_CONTACTO}-titulo`} className={estilos.contactoTitulo}>
              ¿Qué lubricante necesita <em>tu equipo</em>?
            </h2>
            <p className={estilos.contactoTexto}>
              Cuéntanos qué máquina o vehículo tienes y te asesoramos con el producto {marca.nombre}{" "}
              indicado. Pide tu cotización: te respondemos por el medio que prefieras.
            </p>
            {whatsapp ? (
              <a
                href={whatsapp.href}
                className={`${estilos.boton} ${estilos.botonPrincipal}`}
                target="_blank"
                rel="noopener"
              >
                <IconBrandWhatsapp aria-hidden="true" focusable="false" stroke={1.8} size={22} />
                Escribir por WhatsApp
              </a>
            ) : null}
          </div>
          <div className={estilos.formularioCaja}>
            <FormularioSolicitud {...formulario} variante="plano" />
          </div>
        </div>
      </section>
    </main>
  );
}
