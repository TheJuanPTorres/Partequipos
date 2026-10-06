import type { DashboardViewServerProps } from "@payloadcms/next/views";
import { Gutter } from "@payloadcms/ui";
import {
  IconFilePlus,
  IconFileUpload,
  IconPhotoPlus,
  IconPlus,
  type Icon,
} from "@tabler/icons-react";
import Link from "next/link";

import { ICONOS_DE_GRUPO } from "@/components/admin/Nav/iconos";
import { idDeGrupo } from "@/lib/panel/menu";
import { fechaExacta, fechaRelativa } from "@/lib/panel/fechas";
import { esGrupoDelMenu, rutaCrear } from "@/lib/panel/portada";
import { getPortadaPanel } from "@/lib/queries/getPortadaPanel";

import { Aviso } from "../aviso/Aviso";

/** Accesos rápidos: solo los que el rol puede crear. */
const ACCESOS: { slug: string; texto: string; icono: Icon }[] = [
  { slug: "equipos-nuevos", texto: "Nueva máquina", icono: IconPlus },
  { slug: "articulos", texto: "Nuevo artículo", icono: IconFilePlus },
  { slug: "media", texto: "Subir imagen", icono: IconPhotoPlus },
  { slug: "documentos", texto: "Subir documento", icono: IconFileUpload },
];

const formatoNumero = new Intl.NumberFormat("es-CO");

/**
 * PORTADA PROPIA DEL PANEL (`admin.components.views.dashboard`, F2 del
 * rediseño, 2026-10-06; decisiones-panel.md §23). Sustituye la cuadrícula de
 * tarjetas de Payload; la plantilla, el menú y las migas siguen siendo suyos.
 *
 * Componente de SERVIDOR: los datos llegan ya calculados con el acceso del
 * usuario (`getPortadaPanel`) y no hay JavaScript de cliente. De
 * «solicitudes» solo se muestran contadores.
 */
export default async function Portada(props: DashboardViewServerProps) {
  const { payload, permissions, user, visibleEntities } = props;
  if (!user || !permissions || !visibleEntities) return null;

  const visibles = {
    collections: visibleEntities.collections as string[],
    globals: visibleEntities.globals as string[],
  };
  const { avisos, tarjetas, recientes } = await getPortadaPanel(
    payload,
    user,
    permissions,
    visibles,
  );
  const permisos = permissions.collections as Record<string, { create?: boolean }> | undefined;
  const accesos = ACCESOS.filter(
    (a) => visibles.collections.includes(a.slug) && Boolean(permisos?.[a.slug]?.create),
  );
  const ahora = new Date();

  return (
    <Gutter className="pq-portada">
      <header className="pq-portada__cabecera">
        <h1 className="pq-portada__titulo">Panel de control</h1>
        <p className="pq-portada__saludo">Hola. Esto es lo que hay hoy en el sitio.</p>
      </header>

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
                    {a.texto} {a.enlace ? <Link href={a.enlace.href}>{a.enlace.texto}</Link> : null}
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

      {accesos.length ? (
        <section aria-labelledby="pq-portada-accesos" className="pq-portada__seccion">
          <h2 className="pq-portada__subtitulo" id="pq-portada-accesos">
            Accesos rápidos
          </h2>
          <ul className="pq-portada__accesos">
            {accesos.map(({ slug, texto, icono: Icono }) => (
              <li key={slug}>
                <Link className="pq-portada__acceso" href={rutaCrear(slug)}>
                  <Icono aria-hidden="true" size={16} />
                  {texto}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
                      <Link className="pq-portada__entrada-enlace" href={e.href}>
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
                <Link className="pq-portada__reciente-titulo" href={r.href}>
                  {r.titulo}
                </Link>
                <span className="pq-portada__reciente-coleccion">{r.coleccion}</span>
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
