import { NavHamburger, NavWrapper } from "@payloadcms/next/client";
import { RenderServerComponent } from "@payloadcms/ui/elements/RenderServerComponent";
import { type EntityToGroup, EntityType, groupNavItems } from "@payloadcms/ui/shared";
import type { PayloadRequest, ServerProps } from "payload";
import { formatAdminURL, PREFERENCE_KEYS } from "payload/shared";

import {
  ENTRADAS_DIRECTAS,
  ETIQUETAS_DEL_MENU,
  ordenarMenu,
  SOLO_ADMINISTRADOR,
  type GrupoDelMenu,
} from "@/lib/panel/menu";
import { COLECCIONES_BUSCABLES, type Comando } from "@/lib/panel/buscador";
import { esAdministrador } from "@/lib/seguridad/acceso";

import { MenuCliente, type EntradaMenu, type GrupoMenu } from "./MenuCliente";
import { Salir } from "./Salir";

/**
 * MENÚ LATERAL PROPIO DEL PANEL (`admin.components.Nav`).
 *
 * POR QUÉ existe: los iconos del sistema de diseño del cliente van en los grupos
 * (primer nivel), y `NavGroup` de Payload no tiene sitio para un icono ni emite
 * `aria-expanded`. Las dos cosas obligan a sustituir el menú completo: Payload
 * solo permite reemplazarlo entero, no pieza a pieza.
 *
 * ── COMPONENTES `@internal` QUE SE USAN, Y POR QUÉ ──────────────────────────
 * Payload los exporta pero los marca `@internal`: pueden cambiar en una
 * actualización SIN aparecer en las notas de versión. Queda escrito aquí para
 * que, si un `npm update` rompe el menú, se sepa dónde mirar. Verificado contra
 * **Payload 3.88.0**. ATENCIÓN: la versión instalada hoy es **3.89.0** (el lock
 * se regeneró el 2026-09-17 y `^3.86.0` resolvió a 3.89.0). Este menú se verificó
 * pintado ya sobre 3.89 y funciona, pero las firmas de la tabla **no se han
 * releído** en esa versión.
 *
 * | Pieza                                | De dónde                        | Qué aporta que no se replica a mano            |
 * | ------------------------------------ | ------------------------------- | ---------------------------------------------- |
 * | `NavWrapper`                         | `@payloadcms/next/client`       | `inert` con el menú cerrado, clases de abierto/animado/hidratado y el contenedor con scroll |
 * | `NavHamburger`                       | `@payloadcms/next/client`       | El botón de cerrar en móvil, atado al contexto del menú |
 * | `AnimateHeight` (en `GrupoNav`)      | `@payloadcms/ui`                | `display: none` al plegar, que saca los enlaces del recorrido de teclado |
 *
 * `groupNavItems`, `EntityType`, `usePreferences`, `useNav`, `useConfig`,
 * `useTranslation`, `Link` y `PREFERENCE_KEYS` son API pública.
 *
 * ── QUÉ SE REPLICA DE `DefaultNav`, PORQUE SE PERDERÍA ──────────────────────
 * 1. **Permisos por rol.** Las entidades se filtran por `visibleEntities` y se
 *    pasan a `groupNavItems` con los `permissions`, que descarta lo que el rol no
 *    puede leer. Sin esto, un editor vería colecciones que no le tocan.
 * 2. **Estado del menú y accesibilidad**: los tres componentes de la tabla.
 * 3. **Página activa** y su barra indicadora: en `MenuCliente`.
 * 4. **Huecos de extensión** `beforeNav`, `beforeNavLinks`, `afterNavLinks` y
 *    `afterNav`, con el mismo orden y las mismas props que Payload.
 *
 * ── LO QUE NO SE REPLICA, DICHO CLARO ───────────────────────────────────────
 * - **`settingsMenu`** (el engranaje sobre cerrar sesión): su componente,
 *   `SettingsMenuButton`, **no se exporta**. Hoy no está configurado, y
 *   `src/collections/grupos.test.ts` falla si alguien lo configura, para que no
 *   desaparezca en silencio.
 * - **`BrowseByFolderButton`**: Payload lo pinta si `folders.browseByFolder`
 *   está activo. No lo usamos, y la misma prueba vigila que siga así.
 *
 * ── PUERTA ABIERTA A COLAPSAR POR DEFECTO ───────────────────────────────────
 * `ABIERTO_POR_DEFECTO` es el único sitio donde se decide qué hace un grupo que
 * el usuario nunca tocó. Ponerlo en `false` deja el menú colapsado de arranque
 * sin tocar nada más; el grupo de la página activa habría que forzarlo abierto
 * aquí mismo, con la ruta de `req`.
 */
const ABIERTO_POR_DEFECTO = true;

type PreferenciaNav = {
  groups?: Record<string, { open?: boolean }>;
};

async function leerPreferenciaNav(req?: PayloadRequest): Promise<PreferenciaNav | null> {
  if (!req?.user?.collection) {
    return null;
  }

  /*
   * `sort: '-updatedAt'` explícito, y no el orden por defecto. Payload lee esta
   * preferencia de dos formas distintas —el servidor sin `sort`, el cliente con
   * `-updatedAt`— y con filas duplicadas cada uno cogía una fila diferente
   * (CLAUDE.md §10.26). Aquí se fija el mismo criterio que usa el cliente.
   */
  const { docs } = await req.payload.find({
    collection: "payload-preferences",
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    sort: "-updatedAt",
    where: {
      and: [
        { key: { equals: PREFERENCE_KEYS.NAV } },
        { "user.relationTo": { equals: req.user.collection } },
        { "user.value": { equals: req.user.id } },
      ],
    },
  });

  return (docs?.[0]?.value as PreferenciaNav | undefined) ?? null;
}

export default async function Nav(props: { req?: PayloadRequest } & ServerProps) {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities,
  } = props;

  // Sin permisos resueltos no se puede filtrar por rol: antes nada que enseñar
  // mal. Payload siempre los pasa; esto es la red por si cambia la firma.
  if (!payload?.config || !i18n || !visibleEntities || !permissions) {
    return null;
  }

  const {
    admin: {
      components: { afterNav, afterNavLinks, beforeNav, beforeNavLinks },
    },
    collections,
    globals,
  } = payload.config;

  const entidades: EntityToGroup[] = [
    ...collections
      .filter(({ slug }) => visibleEntities.collections.includes(slug))
      .map((collection) => ({ type: EntityType.collection as const, entity: collection })),
    ...globals
      .filter(({ slug }) => visibleEntities.globals.includes(slug))
      .map((global) => ({ type: EntityType.global as const, entity: global })),
  ];

  const gruposDePayload = groupNavItems(entidades, permissions, i18n);

  const preferencia = await leerPreferenciaNav(req);
  const adminRoute = payload.config.routes.admin;
  const ruta = (path: `/${string}`) => formatAdminURL({ adminRoute, path });
  const admin = esAdministrador(user);

  // Orden de grupos y entradas, nombres y lo técnico solo para el Administrador: `src/lib/panel/menu.ts`.
  const ordenados = ordenarMenu(
    gruposDePayload.map((grupo) => ({
      nombre: typeof grupo.label === "string" ? grupo.label : String(grupo.label),
      entradas: grupo.entities
        .filter((entidad) => admin || !SOLO_ADMINISTRADOR.has(entidad.slug))
        .map((entidad) => ({ entidad, slug: entidad.slug })),
    })),
  );

  // «Solicitudes y contacto» lleva cuántas siguen en «Nueva».
  const contadores: Record<string, number> = {};
  if (visibleEntities.collections.includes("solicitudes")) {
    const { totalDocs } = await payload.count({
      collection: "solicitudes",
      overrideAccess: false,
      req,
      where: { estado: { equals: "nueva" } },
    });
    if (totalDocs > 0) contadores.solicitudes = totalDocs;
  }

  // Las entradas directas (la portada, Servicio técnico y los datos de la empresa), con el acceso de quien mira.
  const slugsDePagina = ENTRADAS_DIRECTAS.flatMap((d) => ("pagina" in d ? [d.pagina] : []));
  const idDePagina = new Map<string, number | string>();
  if (visibleEntities.collections.includes("paginas") && slugsDePagina.length > 0) {
    const { docs } = await payload.find({
      collection: "paginas",
      depth: 0,
      limit: slugsDePagina.length,
      overrideAccess: false,
      pagination: false,
      req,
      select: { slug: true },
      where: { slug: { in: slugsDePagina } },
    });
    for (const doc of docs as { id: number | string; slug?: string | null }[]) {
      if (doc.slug) idDePagina.set(doc.slug, doc.id);
    }
  }
  const directas = new Map<string, EntradaMenu[]>();
  for (const d of ENTRADAS_DIRECTAS) {
    let href: string | null = null;
    if ("pagina" in d) {
      const id = idDePagina.get(d.pagina);
      if (id !== undefined) href = ruta(`/collections/paginas/${id}`);
    } else if ((visibleEntities.globals as string[]).includes(d.global)) {
      href = ruta(`/globals/${d.global}`);
    }
    if (href) {
      directas.set(d.grupo, [
        ...(directas.get(d.grupo) ?? []),
        { clave: d.clave, href, id: `nav-${d.clave}`, label: d.etiqueta },
      ]);
    }
  }

  const nombres = [
    ...ordenados.map((g) => g.nombre),
    ...[...directas.keys()].filter((n) => !ordenados.some((g) => g.nombre === n)),
  ];
  const grupos: GrupoMenu[] = ordenarMenu(
    nombres.map((nombre) => ({ nombre, entradas: [] as { slug: string }[] })),
  )
    .map(({ nombre }) => {
      const dePayload = ordenados.find((g) => g.nombre === nombre)?.entradas ?? [];
      const entradas: EntradaMenu[] = [
        ...(directas.get(nombre as GrupoDelMenu) ?? []),
        ...dePayload.map(({ entidad }) => {
          const global = entidad.type === EntityType.global;
          return {
            clave: `${global ? "global" : "coleccion"}-${entidad.slug}`,
            contador: contadores[entidad.slug],
            href: ruta(global ? `/globals/${entidad.slug}` : `/collections/${entidad.slug}`),
            id: global ? `nav-global-${entidad.slug}` : `nav-${entidad.slug}`,
            label:
              ETIQUETAS_DEL_MENU[entidad.slug] ??
              (typeof entidad.label === "string" ? entidad.label : String(entidad.label)),
          };
        }),
      ];
      return {
        abierto: preferencia?.groups?.[nombre]?.open ?? ABIERTO_POR_DEFECTO,
        entradas,
        nombre,
      };
    })
    .filter((g) => g.entradas.length > 0);

  /*
   * BUSCADOR GLOBAL (Ctrl+K, tanda 23): «Crear …» en cada colección del menú en la que quien mira
   * puede crear (su permiso de Payload), en el orden del menú; y las colecciones donde puede buscar
   * fichas (las que ve). Nunca solicitudes ni usuarios.
   */
  const enMenu = grupos.flatMap((g) =>
    g.entradas.flatMap((e) => (e.clave.startsWith("coleccion-") ? [e.clave.slice(10)] : [])),
  );
  const acciones: Comando[] = enMenu.flatMap((slug) => {
    const coleccion = collections.find((c) => c.slug === slug);
    if (!coleccion || slug === "solicitudes" || slug === "users") return [];
    if (!permissions.collections?.[slug]?.create) return [];
    const singular = coleccion.labels?.singular;
    const nombre = typeof singular === "string" ? singular : slug;
    return [
      {
        id: `crear-${slug}`,
        tipo: "accion" as const,
        etiqueta: `Crear ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)}`,
        href: ruta(`/collections/${slug}/create`),
      },
    ];
  });
  const buscables = COLECCIONES_BUSCABLES.filter((c) => enMenu.includes(c.slug)).map((c) => c.slug);

  const serverProps = { i18n, locale, params, payload, permissions, searchParams, user };
  const clientProps = { documentSubViewType, viewType };
  const renderizar = (Component: unknown) =>
    RenderServerComponent({
      clientProps,
      Component: Component as Parameters<typeof RenderServerComponent>[0]["Component"],
      importMap: payload.importMap,
      serverProps,
    });

  return (
    <NavWrapper baseClass="nav">
      {renderizar(beforeNav)}
      <nav className="nav__wrap">
        {renderizar(beforeNavLinks)}
        <MenuCliente
          acciones={acciones}
          admin={adminRoute}
          api={payload.config.routes.api}
          buscables={buscables}
          grupos={grupos}
        />
        {renderizar(afterNavLinks)}
        <div className="nav__controls">
          <Salir />
        </div>
      </nav>
      {renderizar(afterNav)}
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  );
}
