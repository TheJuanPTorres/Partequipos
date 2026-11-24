import type { DashboardViewServerProps } from "@payloadcms/next/views";
import { Gutter } from "@payloadcms/ui";
import {
  IconAlertTriangle,
  IconBackhoe,
  IconBook,
  IconCircleCheck,
  IconMessages,
  IconPhoto,
  IconSearchOff,
  IconExternalLink,
  IconFilePlus,
  IconMessage,
  IconPhotoPlus,
  IconPlus,
  IconSlideshow,
  type Icon,
} from "@tabler/icons-react";
import Link from "next/link";

import { ICONOS_DE_GRUPO } from "@/components/admin/Nav/iconos";
import { idDeGrupo } from "@/lib/panel/menu";
import { fechaExacta, fechaRelativa } from "@/lib/panel/fechas";
import { esGrupoDelMenu, type ClaveCifra, type IconoHabitual } from "@/lib/panel/portada";
import { getPortadaPanel } from "@/lib/queries/getPortadaPanel";

import { Aviso } from "../aviso/Aviso";
import { SOLO_ADMINISTRADOR } from "@/lib/panel/menu";
import { esAdministrador } from "@/lib/seguridad/acceso";

import "./tablero.scss";

/** Icono de cada cifra del tablero (tanda 23). */
const ICONOS_CIFRAS: Record<ClaveCifra, Icon> = {
  solicitudes: IconMessages,
  incompletas: IconAlertTriangle,
  fotos: IconPhoto,
  busquedas: IconSearchOff,
};

/** Icono de cada acción de «Lo más habitual». */
const ICONOS_HABITUALES: Record<IconoHabitual, Icon> = {
  usada: IconBackhoe,
  vendida: IconCircleCheck,
  nueva: IconPlus,
  diapositiva: IconSlideshow,
  articulo: IconFilePlus,
  mensajes: IconMessage,
  imagenes: IconPhotoPlus,
};

const formatoNumero = new Intl.NumberFormat("es-CO");

/*
 * SIN PRECARGA en los enlaces (`prefetch={false}`): la portada tiene unos 60, y
 * con la precarga de Next cada uno pedía su página al servidor nada más abrir
 * el panel (medido en el preview: decenas de GET a /admin/collections/…). La
 * navegación sigue siendo de cliente al pulsar.
 */

/**
 * PORTADA PROPIA DEL PANEL (`admin.components.views.dashboard`, F2 del
 * rediseño, 2026-10-06; decisiones-panel.md §23). Sustituye la cuadrícula de
 * tarjetas de Payload; la plantilla, el menú y las migas siguen siendo suyos.
 *
 * Componente de SERVIDOR: los datos llegan ya calculados con el acceso del
 * usuario (`getPortadaPanel`) y no hay JavaScript de cliente.
 *
 * Fase 2, PR 6 (2026-11-19; plan `2026-11-18-panel-organizacion-fase1.md` §3):
 * «Ver la web» y el manual, «Mensajes» (las 5 solicitudes nuevas más recientes:
 * nombre, tipo y fecha, solo para quien puede leer solicitudes), avisos nuevos
 * y «Lo más habitual» en lugar de «Accesos rápidos».
 */
export default async function Portada(props: DashboardViewServerProps) {
  const { payload, permissions, user, visibleEntities } = props;
  if (!user || !permissions || !visibleEntities) return null;

  // Lo técnico (Redirecciones, Usuarios, Animaciones y Fuentes), solo para el Administrador, como en el menú.
  const admin = esAdministrador(user);
  const paraElRol = (slugs: string[]) =>
    admin ? slugs : slugs.filter((s) => !SOLO_ADMINISTRADOR.has(s));
  const visibles = {
    collections: paraElRol(visibleEntities.collections as string[]),
    globals: paraElRol(visibleEntities.globals as string[]),
  };
  const { cifras, mios, avisos, tarjetas, recientes, habituales, mensajes, manual } =
    await getPortadaPanel(payload, user, permissions, visibles);
  const ahora = new Date();

  return (
    <Gutter className="pq-portada">
      <header className="pq-portada__cabecera">
        <h1 className="pq-portada__titulo">Panel de control</h1>
        <p className="pq-portada__saludo">Hola. Esto es lo que hay hoy en el sitio.</p>
        <ul className="pq-portada__enlaces">
          <li>
            {/* El sitio publicado, en otra pestaña: es el mismo dominio que el panel. */}
            <a className="pq-portada__enlace" href="/" rel="noopener" target="_blank">
              <IconExternalLink aria-hidden="true" size={16} />
              Ver la web
              <span className="pq-solo-lector"> (se abre en otra pestaña)</span>
            </a>
          </li>
          {manual ? (
            <li>
              <a className="pq-portada__enlace" href={manual} rel="noopener" target="_blank">
                <IconBook aria-hidden="true" size={16} />
                Manual del panel
                <span className="pq-solo-lector"> (PDF, se abre en otra pestaña)</span>
              </a>
            </li>
          ) : null}
        </ul>
      </header>

      {/* TABLERO (tanda 23, punto 3): cifras, lo último que editaste y accesos rápidos grandes. */}
      {cifras.length ? (
        <section aria-labelledby="pq-tablero-cifras" className="pq-tablero">
          <h2 className="pq-solo-lector" id="pq-tablero-cifras">
            Resumen
          </h2>
          <ul className="pq-tablero__cifras">
            {cifras.map((c) => {
              const Icono = ICONOS_CIFRAS[c.clave];
              return (
                <li key={c.clave}>
                  <Link
                    prefetch={false}
                    className={`pq-tablero__cifra pq-tablero__cifra--${c.tono}`}
                    href={c.href}
                  >
                    <span className="pq-tablero__cifra-cabecera">
                      <Icono aria-hidden="true" size={20} />
                      {c.etiqueta}
                    </span>
                    <span className="pq-tablero__cifra-valor">{formatoNumero.format(c.valor)}</span>
                    <span className="pq-tablero__cifra-detalle">{c.detalle}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {habituales.length ? (
        <section aria-labelledby="pq-portada-habitual" className="pq-portada__seccion">
          <h2 className="pq-portada__subtitulo" id="pq-portada-habitual">
            Accesos rápidos
          </h2>
          <ul className="pq-tablero__accesos">
            {habituales.map(({ clave, texto, href }) => {
              const Icono = ICONOS_HABITUALES[clave];
              return (
                <li key={clave}>
                  <Link prefetch={false} className="pq-tablero__acceso" href={href}>
                    <Icono aria-hidden="true" size={28} />
                    <span>{texto}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="pq-tablero-mios" className="pq-portada__seccion">
        <h2 className="pq-portada__subtitulo" id="pq-tablero-mios">
          Lo último que editaste
        </h2>
        {mios.length ? (
          <ol className="pq-portada__recientes">
            {mios.map((r) => (
              <li className="pq-portada__reciente" key={`${r.slug}-${r.href}`}>
                <Link prefetch={false} className="pq-portada__reciente-titulo" href={r.href}>
                  {r.titulo}
                </Link>
                <span className="pq-portada__reciente-coleccion">{r.coleccion}</span>
                <time
                  className="pq-portada__reciente-fecha"
                  dateTime={r.actualizado}
                  title={fechaExacta(r.actualizado)}
                >
                  {fechaRelativa(r.actualizado, ahora)}
                  <span className="pq-solo-lector">, {fechaExacta(r.actualizado)}</span>
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="pq-portada__vacio">
            Aún no has guardado nada. Lo que edites saldrá aquí para volver rápido.
          </p>
        )}
      </section>

      {mensajes ? (
        <section aria-labelledby="pq-portada-mensajes" className="pq-portada__seccion">
          <h2 className="pq-portada__subtitulo" id="pq-portada-mensajes">
            Mensajes
          </h2>
          {mensajes.lista.length ? (
            <ol className="pq-portada__recientes">
              {mensajes.lista.map((m) => (
                <li className="pq-portada__reciente" key={m.id}>
                  <Link prefetch={false} className="pq-portada__reciente-titulo" href={m.href}>
                    {m.nombre}
                  </Link>
                  <span className="pq-portada__reciente-coleccion">{m.tipo}</span>
                  <time
                    className="pq-portada__reciente-fecha"
                    dateTime={m.creado}
                    title={fechaExacta(m.creado)}
                  >
                    {fechaRelativa(m.creado, ahora)}
                    <span className="pq-solo-lector">, {fechaExacta(m.creado)}</span>
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="pq-portada__vacio">No hay mensajes nuevos sin atender.</p>
          )}
          <p className="pq-portada__ver-todas">
            <Link prefetch={false} href={mensajes.todas}>
              Ver todos los mensajes nuevos
            </Link>
          </p>
        </section>
      ) : null}

      <section aria-labelledby="pq-portada-avisos" className="pq-portada__seccion">
        <h2 className="pq-portada__subtitulo" id="pq-portada-avisos">
          Necesita atención
        </h2>
        {avisos.length ? (
          <ul className="pq-portada__avisos">
            {avisos.map((a) => (
              <li key={a.clave}>
                <Aviso className="pq-portada__aviso" tono={a.tono}>
                  <p>
                    {a.texto}{" "}
                    {a.enlace ? (
                      <Link prefetch={false} href={a.enlace.href}>
                        {a.enlace.texto}
                      </Link>
                    ) : null}
                  </p>
                </Aviso>
              </li>
            ))}
          </ul>
        ) : (
          <Aviso tono="exito">
            <p>Todo en orden: no hay nada que necesite tu atención.</p>
          </Aviso>
        )}
      </section>

      <section aria-labelledby="pq-portada-secciones" className="pq-portada__seccion">
        <h2 className="pq-portada__subtitulo" id="pq-portada-secciones">
          Secciones
        </h2>
        <div className="pq-portada__tarjetas">
          {tarjetas.map((t) => {
            const Icono = esGrupoDelMenu(t.nombre) ? ICONOS_DE_GRUPO[t.nombre] : null;
            const idTitulo = `pq-portada-grupo-${idDeGrupo(t.nombre)}`;
            return (
              <section aria-labelledby={idTitulo} className="pq-portada__tarjeta" key={t.nombre}>
                <h3 className="pq-portada__tarjeta-titulo" id={idTitulo}>
                  {Icono ? <Icono aria-hidden="true" size={16} /> : null}
                  {t.nombre}
                </h3>
                <ul className="pq-portada__entradas">
                  {t.entradas.map((e) => (
                    <li className="pq-portada__entrada" key={e.slug}>
                      <Link prefetch={false} className="pq-portada__entrada-enlace" href={e.href}>
                        <span className="pq-portada__entrada-nombre">{e.etiqueta}</span>
                        {e.contador !== null ? (
                          <span className="pq-portada__contador">
                            {formatoNumero.format(e.contador)}
                          </span>
                        ) : null}
                      </Link>
                      {e.detalle ? <span className="pq-portada__detalle">{e.detalle}</span> : null}
                      {e.hrefCrear ? (
                        <Link
                          prefetch={false}
                          aria-label={`Crear en ${e.etiqueta}`}
                          className="pq-portada__crear"
                          href={e.hrefCrear}
                          title={`Crear en ${e.etiqueta}`}
                        >
                          <IconPlus aria-hidden="true" size={14} />
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="pq-portada-recientes" className="pq-portada__seccion">
        <h2 className="pq-portada__subtitulo" id="pq-portada-recientes">
          Lo último modificado
        </h2>
        {recientes.length ? (
          <ol className="pq-portada__recientes">
            {recientes.map((r) => (
              <li className="pq-portada__reciente" key={`${r.slug}-${r.href}`}>
                <Link prefetch={false} className="pq-portada__reciente-titulo" href={r.href}>
                  {r.titulo}
                </Link>
                <span className="pq-portada__reciente-coleccion">
                  {r.coleccion}
                  <span className="pq-portada__reciente-editor">
                    {r.editor === "—" ? " · —" : ` · por ${r.editor}`}
                  </span>
                </span>
                <time
                  className="pq-portada__reciente-fecha"
                  dateTime={r.actualizado}
                  title={fechaExacta(r.actualizado)}
                >
                  {fechaRelativa(r.actualizado, ahora)}
                  {/* La fecha exacta también para el lector de pantalla y el teclado. */}
                  <span className="pq-solo-lector">, {fechaExacta(r.actualizado)}</span>
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="pq-portada__vacio">Todavía no hay nada modificado que puedas ver.</p>
        )}
      </section>
    </Gutter>
  );
}
