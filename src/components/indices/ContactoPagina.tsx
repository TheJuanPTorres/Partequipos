import { IconBuildingSkyscraper, IconMail, IconPhoneCall } from "@tabler/icons-react";
import Image from "next/image";
import { Fragment } from "react";

import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { Revelado } from "@/components/movimiento/Revelado";
import estilosMarca from "@/components/repuestos/marca.module.css";
import type { CanalContacto } from "@/lib/indices/paginasIndice";
import { textoDias, textoHora } from "@/lib/seo/horario";
import type { Tramo } from "@/lib/seo/horario";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./contacto.module.css";

const ICONOS = {
  telefono: IconPhoneCall,
  correo: IconMail,
  direccion: IconBuildingSkyscraper,
} as const;

/**
 * PÁGINA «CONTÁCTANOS» (plantilla de Andrés, docs/diseno/decisiones-indices-
 * contacto.md): antetítulo y título, la foto y el formulario de la página de
 * marca (con «Estoy interesado en» y «Quién soy»), «Canales adicionales» en tres
 * tarjetas con los datos del GLOBAL DE LA EMPRESA, y el horario de atención.
 *
 * Lo que se aparta de ux-9:
 * - El título es el `<h1>` (en ux-9, `<h2>`) y se corrige la errata «con nosotro».
 * - El horario de atención (que la página ya mostraba) va bajo las tarjetas.
 * - El teléfono y el correo son enlaces (`tel:` y `mailto:`).
 * - La foto y la máquina decorativa son decorativas (`alt` vacío); la foto se
 *   oculta en móvil, como en ux-9.
 */
export function ContactoPagina({
  antetitulo,
  titulo,
  tituloCanales,
  tituloHorario,
  foto,
  decorativa,
  canales,
  horario,
  formulario,
}: {
  antetitulo: string;
  titulo: string;
  tituloCanales: string;
  tituloHorario: string;
  foto: ImagenLista | null;
  decorativa: ImagenLista | null;
  canales: CanalContacto[];
  horario: Tramo[];
  formulario: {
    origen: string;
    siteKey: string | null;
    whatsapp?: { href: string; etiqueta: string };
  };
}) {
  return (
    <section className={estilos.pagina} aria-labelledby="contacto-titulo">
      {antetitulo ? <p className={estilos.antetitulo}>{antetitulo}</p> : null}
      <Revelado
        como="h1"
        id="contacto-titulo"
        alCargar
        ritmo="titulo"
        texto={titulo}
        className={estilos.titulo}
      />

      <div className={estilos.cuerpo}>
        {foto ? (
          <div className={estilos.foto}>
            <Image
              src={foto.url}
              alt=""
              fill
              priority
              sizes="(max-width: 767px) 0px, (max-width: 1024px) 300px, 420px"
              className={estilos.fotoImg}
              style={{ objectPosition: foto.posicion }}
            />
          </div>
        ) : null}

        <div className={estilosMarca.formulario}>
          <FormularioSolicitud
            tipo="contacto"
            origen={formulario.origen}
            siteKey={formulario.siteKey}
            whatsapp={formulario.whatsapp}
            titulo="Escríbenos"
            textoBoton="Enviar"
            clasificacion
            variante="plano"
          />
        </div>
      </div>

      {canales.length > 0 ? (
        <div className={estilos.canales}>
          {decorativa ? (
            <Image
              src={decorativa.url}
              alt=""
              width={decorativa.width}
              height={decorativa.height}
              sizes="(max-width: 767px) 80vw, 430px"
              className={estilos.decorativa}
            />
          ) : null}
          {tituloCanales ? <h2 className={estilos.tituloCanales}>{tituloCanales}</h2> : null}
          <ul className={estilos.tarjetas}>
            {canales.map((c) => {
              const Icono = ICONOS[c.clave];
              const valor = c.href ? (
                <a href={c.href} className={estilos.valorEnlace}>
                  {c.valor}
                </a>
              ) : (
                c.valor
              );
              return (
                <li key={c.clave} className={estilos.canal}>
                  <h3 className={estilos.etiqueta}>{c.etiqueta}</h3>
                  <p className={estilos.valor}>
                    <Icono
                      aria-hidden="true"
                      focusable="false"
                      stroke={1.75}
                      className={estilos.icono}
                    />
                    <span>{valor}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {horario.length > 0 ? (
        <div className={estilos.horario}>
          <h2 className={estilos.tituloHorario}>{tituloHorario || "Horario de atención"}</h2>
          <dl className={estilos.lista}>
            {horario.map((t) => (
              <Fragment key={`${t.dias.join("-")}-${t.abre}`}>
                <dt className={estilos.dias}>{textoDias(t.dias)}</dt>
                <dd>
                  <time dateTime={t.abre}>{textoHora(t.abre)}</time> a{" "}
                  <time dateTime={t.cierra}>{textoHora(t.cierra)}</time>
                </dd>
              </Fragment>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
