import {
  IconBrandWhatsapp,
  IconCalendarCog,
  IconChecklist,
  IconClipboardCheck,
  IconDeviceDesktopCog,
  IconHeartHandshake,
  IconLinkOff,
  IconMail,
  IconPlayerPlayFilled,
  IconSettings,
  IconSettingsCog,
  IconTool,
  IconTools,
  IconWheel,
  type Icon,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { GaleriaFicha } from "@/components/ficha/GaleriaFicha";
import { Revelado } from "@/components/movimiento/Revelado";
import { DialogoYouTube } from "@/components/portada/DialogoYouTube";
import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import type { EnlaceBloque } from "@/lib/bloques/vista";
import type { VistaServicioTecnico } from "@/lib/servicioTecnico/vista";
import { configContactoMarca, type ConfigFormulario } from "@/lib/formularios/configFormulario";
import { conMensaje, type EnlaceWhatsApp } from "@/lib/whatsapp";

import { CarruselVideos } from "./CarruselVideos";
import estilos from "./servicio.module.css";
import { VideoFondo } from "./VideoFondo";

/**
 * SERVICIO TÉCNICO CON LA PLANTILLA DE ANDRÉS (`elementor-4010`, 2026-10-19).
 * Lo pinta una página con «Diseño: Servicio técnico» (campo `diseno` de
 * Páginas); sustituye al diseño propio del #262.
 *
 * Lo que replica, del export (la referencia pintada estaba en mantenimiento):
 * - cabecera de vídeo con «Partequipos» y «Servicio técnico» revelados por palabras;
 * - cuatro tarjetas con icono que llevan a cada sección;
 * - cada sección con su línea, su antetítulo y dos columnas: el medio (foto,
 *   carrusel de vídeos o galería) y el texto con «Contáctanos»;
 * - el alistamiento con los dos vídeos en un carrusel y, al lado, el texto de
 *   POSVENTA; desde el 2026-10-27 (dirección), cada columna es una sección propia con
 *   su antetítulo («Servicio postventa» el nuevo) y su ancla;
 * - los siniestros con la galería, los 3 pasos en tarjetas con icono y
 *   «Trabajamos con las principales aseguradoras» al final.
 *
 * Lo que la plantilla no trae y se conserva (decisiones-servicio-lubricantes.md §7):
 * la frase destacada del taller y, al final, el bloque de contacto de las
 * plantillas de Andrés de repuestos (`ContactoMarca`).
 *
 * Todo el contenido sale de los bloques de la página (editables en el panel).
 */

/** Las tarjetas de acceso y los antetítulos de sección: los textos de Andrés. */
const SECCIONES: Record<string, { etiqueta: string; icono: Icon }> = {
  taller: { etiqueta: "Taller de servicio técnico", icono: IconSettings },
  alistamiento: { etiqueta: "Alistamiento de maquinaria", icono: IconWheel },
  posventa: { etiqueta: "Servicio postventa", icono: IconHeartHandshake },
  siniestros: { etiqueta: "Siniestros de maquinaria", icono: IconLinkOff },
};

/**
 * Los cuatro puntos de la tarjeta de posventa (Juan Pablo, 2026-10-27), sacados de su propio
 * texto («reparaciones, alistamiento y/o mantenimientos…», «herramienta especializada»).
 */
const PUNTOS_POSVENTA: { texto: string; icono: Icon }[] = [
  { texto: "Reparaciones", icono: IconTool },
  { texto: "Alistamiento", icono: IconClipboardCheck },
  { texto: "Mantenimiento", icono: IconCalendarCog },
  { texto: "Herramienta especializada", icono: IconTools },
];

/** El mensaje del WhatsApp de la tarjeta de posventa. */
const MENSAJE_POSVENTA = "Hola, quiero información sobre el servicio postventa.";

/** Los iconos de los pasos de siniestros, por orden (los de Andrés). */
const ICONOS_PASOS: Icon[] = [IconChecklist, IconDeviceDesktopCog, IconSettingsCog];

/** Títulos de sección: el revelado de Andrés dispara al 95 % de la ventana. */
const RITMO = { ritmo: "titulo", disparo: 0.95 } as const;

/**
 * El póster del vídeo por el optimizador de imágenes (WebP a 1080 px), no el
 * original: el de WordPress es un PNG de pantalla.
 */
const posterOptimizado = (url: string | undefined) =>
  url ? `/_next/image?url=${encodeURIComponent(url)}&w=1080&q=75` : undefined;

function Antetitulo({ ancla }: { ancla: string }) {
  const s = SECCIONES[ancla.toLowerCase()];
  return s ? (
    <p id={`${ancla}-antetitulo`} className={estilos.antetitulo}>
      {s.etiqueta}
    </p>
  ) : null;
}

/**
 * El título de las columnas de alistamiento y posventa (Juan Pablo, 2026-10-27): un `<h2>` al
 * tamaño de título de sección con el icono de su tarjeta de acceso en rojo, para que los dos
 * servicios se vean equivalentes y separados. `texto` sustituye a la etiqueta de Andrés.
 */
function TituloServicio({ ancla, texto }: { ancla: string; texto?: string | null }) {
  const s = SECCIONES[ancla.toLowerCase()];
  if (!s) return null;
  const Icono = s.icono;
  return (
    <h2 id={`${ancla}-antetitulo`} className={estilos.tituloServicio}>
      <Icono size={40} stroke={1.5} aria-hidden="true" className={estilos.tituloServicioIcono} />
      <span>{texto || s.etiqueta}</span>
    </h2>
  );
}

/**
 * El botón «Contáctanos» de las secciones: si lleva a la página de contacto, abre el formulario en
 * una ventana (sin JavaScript sigue llevando al formulario del final de esta página). Un enlace
 * a otro sitio, tal cual.
 */
function Contactanos({
  boton,
  formulario,
  ancla,
}: {
  boton: EnlaceBloque | null;
  formulario: ConfigFormulario | null;
  ancla: string | null;
}) {
  if (!boton) return null;
  if (formulario && ancla && /^\/contactanos\/?(#.*)?$/.test(boton.href)) {
    return (
      <BotonFormulario href={`#${ancla}`} className={estilos.boton} formulario={formulario}>
        {boton.texto}
        <IconMail size={20} stroke={1.6} aria-hidden="true" />
      </BotonFormulario>
    );
  }
  return (
    <Link href={boton.href} className={estilos.boton}>
      {boton.texto}
      <IconMail size={20} stroke={1.6} aria-hidden="true" />
    </Link>
  );
}

export function PlantillaServicioTecnico({
  vista,
  whatsapp,
  siteKey,
  origen,
}: {
  vista: VistaServicioTecnico;
  whatsapp?: EnlaceWhatsApp;
  siteKey: string | null;
  origen: string;
}) {
  const { hero, taller, alistamiento, posventa, siniestros, contacto } = vista;
  // El formulario del final de la página, también en la ventana de los botones «Contáctanos».
  const formularioContacto: ConfigFormulario | null = contacto
    ? configContactoMarca({
        origen,
        siteKey,
        whatsapp,
        boton: contacto.botonTexto,
        marca: "",
        formulario: {
          titulo: "Solicitud de servicio técnico",
          conCiudad: true,
          etiquetaMensaje: "¿Qué necesitas?",
        },
      })
    : null;
  const fotoHero = hero.video?.poster ?? hero.imagen;
  // Las tarjetas: las 4 secciones que existen. Posventa es la columna derecha del alistamiento.
  const accesos = vista.accesos.filter((a) => SECCIONES[a.ancla.toLowerCase()]);

  return (
    <div className={estilos.pagina}>
      {/* ---------- Cabecera ---------- */}
      <section className={estilos.hero} aria-labelledby="servicio-titulo">
        {fotoHero ? (
          <Image
            src={fotoHero.url}
            alt=""
            fill
            priority
            sizes="97vw"
            className={estilos.medio}
            style={{ objectPosition: fotoHero.posicion }}
          />
        ) : null}
        {hero.video ? (
          <VideoFondo
            video={hero.video}
            claseCaja={estilos.capaVideo}
            claseVideo={estilos.medio}
            clasePausa={estilos.pausa}
          />
        ) : null}
        <div className={estilos.veloHero} aria-hidden="true" />
        <h1 id="servicio-titulo" className={estilos.heroTitulo}>
          <Revelado como="span" texto="Partequipos" alCargar className={estilos.heroMarca} />{" "}
          <Revelado como="span" texto={hero.titulo} alCargar className={estilos.heroNombre} />
        </h1>
      </section>

      {/* ---------- Las cuatro tarjetas ---------- */}
      {accesos.length ? (
        <nav className={estilos.accesos} aria-label="Secciones de servicio técnico">
          <ul>
            {accesos.map((a) => {
              const { etiqueta, icono: Icono } = SECCIONES[a.ancla.toLowerCase()]!;
              return (
                <li key={a.ancla}>
                  <a href={`#${a.ancla}`} className={estilos.acceso}>
                    <Icono
                      size={35}
                      stroke={1.5}
                      aria-hidden="true"
                      className={estilos.accesoIcono}
                    />
                    <span>{etiqueta}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {/* ---------- Taller ---------- */}
      {taller ? (
        <section
          id={taller.ancla}
          className={estilos.seccion}
          aria-labelledby={`${taller.ancla}-antetitulo`}
        >
          <Antetitulo ancla={taller.ancla} />
          <div className={estilos.fila}>
            <div className={`${estilos.medioCaja} ${estilos.fotoTaller}`}>
              {taller.imagen ? (
                <Image
                  src={taller.imagen.url}
                  alt={taller.imagen.alt}
                  fill
                  sizes="(max-width: 767px) 94vw, 47vw"
                  className={estilos.medio}
                  style={{ objectPosition: taller.imagen.posicion }}
                />
              ) : null}
            </div>
            <div className={estilos.columnaTexto}>
              <Revelado
                id="taller-titulo"
                texto={[taller.antetitulo, taller.titulo].filter(Boolean).join(" ")}
                {...RITMO}
                className={estilos.titulo}
              />
              {taller.parrafos.map((p) => (
                <p key={p} className={estilos.parrafo}>
                  {p}
                </p>
              ))}
              {taller.destacado ? <p className={estilos.destacado}>{taller.destacado}</p> : null}
              <Contactanos
                boton={taller.boton}
                formulario={formularioContacto}
                ancla={contacto?.ancla ?? null}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/*
       * ---------- Alistamiento y posventa: DOBLE COLUMNA (dirección, 2026-10-27) ----------
       * Cada columna es una sección propia, como TARJETA, con su `<h2>` e icono y su ancla: a la
       * izquierda el alistamiento (vídeos y texto), a la derecha «Servicio postventa» (el
       * «Antetítulo» del bloque de posventa en el panel; vacío, el de Andrés) sobre su título, texto
       * y botón. Las
       * tarjetas de acceso llevan a cada una, con un resaltado breve al llegar (`:target`). En
       * móvil, una debajo de la otra.
       */}
      {alistamiento ? (
        <div className={estilos.seccion}>
          <div className={`${estilos.fila} ${estilos.filaDoble}`}>
            <section
              id={alistamiento.ancla}
              className={`${estilos.columnaMedio} ${estilos.columnaSeccion}`}
              aria-labelledby={`${alistamiento.ancla}-antetitulo`}
            >
              <TituloServicio ancla={alistamiento.ancla} />
              <CarruselVideos etiqueta="Vídeos del alistamiento de maquinaria">
                {alistamiento.etapas ? (
                  <div className={estilos.diapositivaVideo}>
                    <div className={estilos.marcoVideo}>
                      <video
                        controls
                        preload="none"
                        playsInline
                        poster={posterOptimizado(alistamiento.etapas.poster?.url)}
                        src={alistamiento.etapas.url}
                        aria-label={alistamiento.etapas.descripcion || alistamiento.titulo}
                      />
                    </div>
                    {alistamiento.parrafos.length ? (
                      <div className={estilos.recuadroVideo}>
                        {alistamiento.parrafos.map((p) => (
                          <p key={p}>{p}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className={estilos.diapositivaVideo}>
                  <DialogoYouTube
                    video={alistamiento.youtube}
                    etiqueta={`Ver en YouTube: ${alistamiento.titulo}`}
                    titulo={alistamiento.titulo}
                    miniatura={alistamiento.miniaturaYoutube}
                    className={estilos.marcoVideo}
                  >
                    {alistamiento.miniaturaYoutube ? (
                      <Image
                        src={alistamiento.miniaturaYoutube.url}
                        alt=""
                        fill
                        sizes="(max-width: 767px) 94vw, 47vw"
                        className={estilos.medio}
                      />
                    ) : null}
                    <span className={estilos.play} aria-hidden="true">
                      <IconPlayerPlayFilled focusable="false" />
                    </span>
                  </DialogoYouTube>
                  {alistamiento.descripcionYoutube ? (
                    <div className={estilos.recuadroVideo}>
                      <p>{alistamiento.descripcionYoutube}</p>
                    </div>
                  ) : null}
                </div>
              </CarruselVideos>
            </section>
            {posventa ? (
              <section
                id={posventa.ancla}
                className={`${estilos.columnaSeccion} ${estilos.columnaPosventa}`}
                aria-labelledby={`${posventa.ancla}-antetitulo`}
              >
                <TituloServicio ancla={posventa.ancla} texto={posventa.antetitulo} />
                {/*
                 * La tarjeta reparte su alto (Juan Pablo, 2026-10-27): el texto, los cuatro
                 * puntos, los botones juntos y, si el bloque tiene «Imagen» en el panel, la foto
                 * abajo ocupando lo que queda; sin foto, los grupos se reparten el alto.
                 */}
                <div
                  className={estilos.posventaCuerpo}
                  data-con-foto={posventa.imagen ? "" : undefined}
                >
                  <div className={estilos.posventaTexto}>
                    <Revelado
                      id="posventa-titulo"
                      como="h3"
                      texto={posventa.titulo}
                      {...RITMO}
                      className={`${estilos.titulo} ${estilos.tituloEnTarjeta}`}
                    />
                    {posventa.parrafos.map((p) => (
                      <p key={p} className={estilos.parrafo}>
                        {p}
                      </p>
                    ))}
                  </div>
                  <ul className={estilos.puntos} aria-label="Qué incluye el servicio postventa">
                    {PUNTOS_POSVENTA.map(({ texto, icono: Icono }) => (
                      <li key={texto} className={estilos.punto}>
                        <Icono
                          size={26}
                          stroke={1.6}
                          aria-hidden="true"
                          className={estilos.puntoIcono}
                        />
                        <span>{texto}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={estilos.botones}>
                    <Contactanos
                      boton={posventa.boton}
                      formulario={formularioContacto}
                      ancla={contacto?.ancla ?? null}
                    />
                    {whatsapp ? (
                      <a
                        href={conMensaje(whatsapp, MENSAJE_POSVENTA).href}
                        className={`${estilos.boton} ${estilos.botonWhatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconBrandWhatsapp size={20} stroke={1.6} aria-hidden="true" />
                        WhatsApp
                        <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
                      </a>
                    ) : null}
                  </div>
                </div>
                {posventa.imagen ? (
                  <div className={estilos.fotoPosventa}>
                    <Image
                      src={posventa.imagen.url}
                      alt={posventa.imagen.alt}
                      fill
                      sizes="(max-width: 767px) 90vw, 44vw"
                      className={estilos.medio}
                      style={{ objectPosition: posventa.imagen.posicion }}
                    />
                  </div>
                ) : null}
              </section>
            ) : (
              <div className={estilos.columnaTexto}>
                <Revelado
                  id="alistamiento-titulo"
                  como="h3"
                  texto={alistamiento.titulo}
                  {...RITMO}
                  className={estilos.titulo}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ---------- Siniestros ---------- */}
      {siniestros ? (
        <section
          id={siniestros.ancla}
          className={estilos.seccion}
          aria-labelledby={`${siniestros.ancla}-antetitulo`}
        >
          <Antetitulo ancla={siniestros.ancla} />
          <div className={estilos.fila}>
            {siniestros.galeria.length ? (
              <div className={`${estilos.columnaMedio} ${estilos.galeria}`}>
                <GaleriaFicha fotos={siniestros.galeria} nombre="siniestros de maquinaria" />
              </div>
            ) : null}
            <div className={estilos.columnaTexto}>
              <Revelado
                id="siniestros-titulo"
                texto={siniestros.titulo}
                {...RITMO}
                className={estilos.titulo}
              />
              {siniestros.intro ? (
                <Revelado
                  como="p"
                  texto={siniestros.intro}
                  {...RITMO}
                  className={estilos.entradilla}
                />
              ) : null}
              {siniestros.pasos.length ? (
                <ol className={estilos.pasos}>
                  {siniestros.pasos.map((p, i) => {
                    const Icono = ICONOS_PASOS[i] ?? IconChecklist;
                    return (
                      <li key={p.numero} className={estilos.paso}>
                        <Icono
                          size={34}
                          stroke={1.5}
                          aria-hidden="true"
                          className={estilos.pasoIcono}
                        />
                        <div>
                          <h3 className={estilos.pasoTitulo}>{p.etiqueta}</h3>
                          <p className={estilos.pasoTexto}>{p.texto}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
              <Contactanos
                boton={siniestros.boton}
                formulario={formularioContacto}
                ancla={contacto?.ancla ?? null}
              />
              {siniestros.aseguradoras ? (
                <Revelado
                  como="p"
                  texto={siniestros.aseguradoras}
                  {...RITMO}
                  className={estilos.entradilla}
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/*
       * ---------- Contacto: el MISMO bloque que las plantillas de Andrés de
       * repuestos (`ContactoMarca`), con «Ciudad» y «¿Qué necesitas?»
       * (dirección, 2026-10-19). Antetítulo = título del bloque; título
       * revelado = su texto.
       */}
      {contacto ? (
        <div id={contacto.ancla} className={estilos.contacto}>
          <ContactoMarca
            id="contacto-titulo"
            titulo={contacto.titulo}
            subtitulo={contacto.texto ?? contacto.titulo}
            boton={contacto.botonTexto}
            origen={origen}
            siteKey={siteKey}
            whatsapp={whatsapp}
            marca=""
            formulario={{
              titulo: "Solicitud de servicio técnico",
              conCiudad: true,
              etiquetaMensaje: "¿Qué necesitas?",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
