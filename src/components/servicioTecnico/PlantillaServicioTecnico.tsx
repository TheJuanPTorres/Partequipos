import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconCertificate,
  IconPlayerPlayFilled,
  IconShieldCheck,
  IconTool,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { DialogoYouTube } from "@/components/portada/DialogoYouTube";
import { tamanosBento, type Tamano } from "@/lib/servicioTecnico/bento";
import type { VistaServicioTecnico } from "@/lib/servicioTecnico/vista";
import type { EnlaceWhatsApp } from "@/lib/whatsapp";

import estilos from "./servicio.module.css";
import { VideoFondo } from "./VideoFondo";

/**
 * SERVICIO TÉCNICO CON DISEÑO PROPIO — aprobado por dirección el 2026-10-19
 * (Andrés no tiene plantilla para esta página). Lo pinta una página con
 * «Diseño: Servicio técnico» (campo `diseno` de Páginas).
 *
 * El lenguaje de la web nueva (Inter, rojo del kit, radios de 30 px, vidrio,
 * velos y movimiento suave), con identidad de TALLER y sin repetir la
 * composición de otras páginas:
 * - cabecera con el texto abajo a la izquierda y un panel de vidrio de acceso
 *   rápido a las secciones (el «tablero» del servicio);
 * - el taller sobre la textura de WordPress, con la frase de garantía como
 *   sello;
 * - el alistamiento en una banda oscura con su vídeo de fondo y los dos vídeos
 *   del proceso (el de las etapas y el corto de YouTube);
 * - la posventa sobre la foto, con el texto en vidrio;
 * - los siniestros como PROCESO PASO A PASO (01 valoración, 02 reparación,
 *   03 repuestos) y su galería de trabajos;
 * - la llamada final a solicitar un técnico: formulario y WhatsApp.
 *
 * Todo el contenido sale de los bloques de la página (editables en el panel);
 * de servidor salvo el vídeo de fondo y el diálogo de YouTube.
 */
/** «2x1»: columnas × filas de una foto del mosaico, para el CSS. */
const claseBento = (t: Tamano | undefined) => (t ? `${t.columnas}x${t.filas}` : "1x1");

/**
 * El póster del vídeo por el optimizador de imágenes (WebP a 1080 px), no el
 * original: el de WordPress es un PNG de pantalla.
 */
const posterOptimizado = (url: string | undefined) =>
  url ? `/_next/image?url=${encodeURIComponent(url)}&w=1080&q=75` : undefined;

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
  const { hero, taller, alistamiento, posventa, siniestros, contacto, textura } = vista;
  const anclaContacto = contacto ? `#${contacto.ancla}` : "/contactanos/";
  const fondoTextura = textura ? { backgroundImage: `url(${textura.url})` } : undefined;
  const fotoHero = hero.video?.poster ?? hero.imagen;
  const nFotos = siniestros?.galeria.length ?? 0;
  const bento = {
    2: tamanosBento(nFotos, 2),
    3: tamanosBento(nFotos, 3),
    4: tamanosBento(nFotos, 4),
  };

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
            sizes="(max-width: 767px) 100vw, 97vw"
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
        <div className={estilos.heroContenido}>
          <div className={estilos.heroTexto}>
            {hero.antetitulo ? <p className={estilos.chip}>{hero.antetitulo}</p> : null}
            <h1 id="servicio-titulo" className={estilos.heroTitulo}>
              {hero.titulo}
            </h1>
            {hero.lema ? <p className={estilos.heroLema}>{hero.lema}</p> : null}
            <div className={estilos.acciones}>
              <a href={anclaContacto} className={`${estilos.boton} ${estilos.botonRojo}`}>
                <IconTool size={18} stroke={1.8} aria-hidden="true" />
                Solicitar un técnico
              </a>
              {whatsapp ? (
                <a
                  href={whatsapp.href}
                  className={`${estilos.boton} ${estilos.botonVidrio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandWhatsapp size={18} stroke={1.8} aria-hidden="true" />
                  WhatsApp
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              ) : null}
            </div>
          </div>
          {vista.accesos.length ? (
            <nav className={estilos.accesos} aria-label="Secciones de servicio técnico">
              <p className={estilos.accesosTitulo} aria-hidden="true">
                ¿Qué necesitas?
              </p>
              <ul>
                {vista.accesos.map((a, i) => (
                  <li key={a.ancla}>
                    <a href={`#${a.ancla}`}>
                      <span className={estilos.accesoNumero} aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {a.titulo}
                      <IconArrowRight size={18} stroke={1.8} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </section>

      {/* ---------- Taller ---------- */}
      {taller ? (
        <section
          id={taller.ancla}
          className={`${estilos.seccion} ${estilos.conTextura}`}
          style={fondoTextura}
          aria-labelledby="taller-titulo"
        >
          <div className={estilos.taller}>
            <div className={estilos.tallerTexto}>
              {taller.antetitulo ? <p className={estilos.antetitulo}>{taller.antetitulo}</p> : null}
              <h2 id="taller-titulo" className={estilos.titulo}>
                {taller.titulo}
              </h2>
              {taller.parrafos.map((p) => (
                <p key={p} className={estilos.parrafo}>
                  {p}
                </p>
              ))}
              {taller.boton ? (
                <Link href={taller.boton.href} className={`${estilos.boton} ${estilos.botonNegro}`}>
                  {taller.boton.texto}
                  <IconArrowRight size={18} stroke={1.8} aria-hidden="true" />
                </Link>
              ) : null}
            </div>
            <div className={estilos.tallerFoto}>
              {taller.imagen ? (
                <Image
                  src={taller.imagen.url}
                  alt={taller.imagen.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className={estilos.foto}
                  style={{ objectPosition: taller.imagen.posicion }}
                />
              ) : null}
              {taller.destacado ? (
                <p className={estilos.sello}>
                  <IconCertificate size={28} stroke={1.6} aria-hidden="true" />
                  {taller.destacado}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Alistamiento ---------- */}
      {alistamiento ? (
        <section
          id={alistamiento.ancla}
          className={estilos.alistamiento}
          aria-labelledby="alistamiento-titulo"
        >
          {alistamiento.fondo?.poster ? (
            <Image
              src={alistamiento.fondo.poster.url}
              alt=""
              fill
              sizes="97vw"
              className={estilos.medio}
            />
          ) : null}
          {alistamiento.fondo ? (
            <VideoFondo
              video={alistamiento.fondo}
              claseCaja={estilos.capaVideo}
              claseVideo={estilos.medio}
              clasePausa={estilos.pausa}
            />
          ) : null}
          <div className={estilos.veloOscuro} aria-hidden="true" />
          <div className={estilos.alistamientoContenido}>
            <div className={estilos.alistamientoTexto}>
              <h2 id="alistamiento-titulo" className={`${estilos.titulo} ${estilos.claro}`}>
                {alistamiento.titulo}
              </h2>
              {alistamiento.parrafos.map((p) => (
                <p key={p} className={`${estilos.parrafo} ${estilos.claro}`}>
                  {p}
                </p>
              ))}
            </div>
            {/* Los dos vídeos, al mismo nivel y del mismo tamaño (16:9). */}
            <div className={estilos.videos}>
              {alistamiento.etapas ? (
                <figure className={estilos.video}>
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
                  <figcaption className={estilos.pieVideo}>
                    <span className={estilos.etiquetaVideo}>Vídeo del taller</span>
                    {alistamiento.etapas.descripcion}
                  </figcaption>
                </figure>
              ) : null}
              <figure className={estilos.video}>
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
                      sizes="(max-width: 1024px) 100vw, 46vw"
                      className={estilos.medio}
                    />
                  ) : null}
                  <span className={estilos.play} aria-hidden="true">
                    <IconPlayerPlayFilled focusable="false" />
                  </span>
                </DialogoYouTube>
                <figcaption className={estilos.pieVideo}>
                  <span className={estilos.etiquetaVideo}>En YouTube</span>
                  {alistamiento.miniaturaYoutube?.alt ?? alistamiento.titulo}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Posventa ---------- */}
      {posventa ? (
        <section id={posventa.ancla} className={estilos.posventa} aria-labelledby="posventa-titulo">
          {posventa.imagen ? (
            <Image
              src={posventa.imagen.url}
              alt={posventa.imagen.alt}
              fill
              sizes="97vw"
              className={estilos.medio}
              style={{ objectPosition: posventa.imagen.posicion }}
            />
          ) : null}
          <div className={estilos.veloLateral} aria-hidden="true" />
          <div className={estilos.posventaTarjeta}>
            <h2 id="posventa-titulo" className={`${estilos.titulo} ${estilos.claro}`}>
              {posventa.titulo}
            </h2>
            {posventa.parrafos.map((p) => (
              <p key={p} className={`${estilos.parrafo} ${estilos.claro}`}>
                {p}
              </p>
            ))}
            {posventa.boton ? (
              <Link href={posventa.boton.href} className={`${estilos.boton} ${estilos.botonRojo}`}>
                {posventa.boton.texto}
                <IconArrowRight size={18} stroke={1.8} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ---------- Siniestros: el proceso paso a paso y la galería ---------- */}
      {siniestros ? (
        <section
          id={siniestros.ancla}
          className={`${estilos.seccion} ${estilos.conTextura}`}
          style={fondoTextura}
          aria-labelledby="siniestros-titulo"
        >
          <div className={estilos.siniestros}>
            <header className={estilos.siniestrosCabecera}>
              <h2 id="siniestros-titulo" className={estilos.titulo}>
                {siniestros.titulo}
              </h2>
              {siniestros.intro ? <p className={estilos.entradilla}>{siniestros.intro}</p> : null}
            </header>
            {siniestros.pasos.length ? (
              <ol className={estilos.pasos}>
                {siniestros.pasos.map((p) => (
                  <li key={p.numero} className={estilos.paso}>
                    <span className={estilos.pasoNumero} aria-hidden="true">
                      {p.numero}
                    </span>
                    <h3 className={estilos.pasoTitulo}>{p.etiqueta}</h3>
                    <p className={estilos.parrafo}>{p.texto}</p>
                  </li>
                ))}
              </ol>
            ) : null}
            {siniestros.galeria.length ? (
              <div className={estilos.galeriaBloque}>
                <div className={estilos.galeriaCabecera}>
                  <IconShieldCheck size={40} stroke={1.5} aria-hidden="true" />
                  <div>
                    {siniestros.aseguradoras ? (
                      <h3 id="aseguradoras-titulo" className={estilos.galeriaTitulo}>
                        {siniestros.aseguradoras}
                      </h3>
                    ) : null}
                    {siniestros.galeriaTexto ? (
                      <p className={estilos.parrafo}>{siniestros.galeriaTexto}</p>
                    ) : null}
                  </div>
                </div>
                <ul
                  className={estilos.galeria}
                  aria-labelledby={siniestros.aseguradoras ? "aseguradoras-titulo" : undefined}
                  aria-label={siniestros.aseguradoras ? undefined : "Galería de siniestros"}
                >
                  {siniestros.galeria.map((img, i) => (
                    <li
                      key={img.url}
                      // Tamaño de cada foto en el mosaico a 2, 3 y 4 columnas (`tamanosBento`).
                      data-m={claseBento(bento[2][i])}
                      data-t={claseBento(bento[3][i])}
                      data-d={claseBento(bento[4][i])}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt}
                        fill
                        sizes={
                          i === 0
                            ? "(max-width: 767px) 100vw, 50vw"
                            : "(max-width: 767px) 50vw, 25vw"
                        }
                        className={estilos.foto}
                        style={{ objectPosition: img.posicion }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : siniestros.aseguradoras ? (
              <p className={estilos.galeriaTitulo}>{siniestros.aseguradoras}</p>
            ) : null}
            {siniestros.cierre.map((c) => (
              <p key={c} className={estilos.parrafo}>
                {c}
              </p>
            ))}
            {siniestros.boton ? (
              <Link
                href={siniestros.boton.href}
                className={`${estilos.boton} ${estilos.botonNegro}`}
              >
                {siniestros.boton.texto}
                <IconArrowRight size={18} stroke={1.8} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ---------- Solicitar un técnico ---------- */}
      {contacto ? (
        <section id={contacto.ancla} className={estilos.contacto} aria-labelledby="contacto-titulo">
          <div className={estilos.contactoPanel}>
            <IconTool size={40} stroke={1.4} aria-hidden="true" className={estilos.contactoIcono} />
            <h2 id="contacto-titulo" className={`${estilos.titulo} ${estilos.claro}`}>
              {contacto.titulo}
            </h2>
            {contacto.texto ? (
              <p className={`${estilos.parrafo} ${estilos.claro}`}>{contacto.texto}</p>
            ) : null}
            {whatsapp ? (
              <a
                href={whatsapp.href}
                className={`${estilos.boton} ${estilos.botonWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBrandWhatsapp size={20} stroke={1.8} aria-hidden="true" />
                Escríbenos por WhatsApp
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            ) : null}
            {whatsapp ? <p className={estilos.telefono}>{whatsapp.etiqueta}</p> : null}
          </div>
          <div className={estilos.contactoFormulario}>
            <FormularioSolicitud
              tipo="contacto"
              origen={origen}
              siteKey={siteKey}
              whatsapp={whatsapp}
              // El título visible está en el panel: el del formulario (solo lectores) no lo repite.
              titulo="Datos de la solicitud"
              textoBoton={contacto.botonTexto}
              variante="plano"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
