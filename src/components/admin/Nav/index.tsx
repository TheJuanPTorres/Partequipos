import { NavHamburger, NavWrapper } from "@payloadcms/next/client";
import { RenderServerComponent } from "@payloadcms/ui/elements/RenderServerComponent";
import { type EntityToGroup, EntityType, groupNavItems } from "@payloadcms/ui/shared";
import type { PayloadRequest, ServerProps } from "payload";
import { PREFERENCE_KEYS } from "payload/shared";

import { MenuCliente, type GrupoMenu } from "./MenuCliente";
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
 * **Payload 3.88.0**.
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

  const grupos: GrupoMenu[] = gruposDePayload.map((grupo) => {
    const nombre = typeof grupo.label === "string" ? grupo.label : String(grupo.label);
    const guardado = preferencia?.groups?.[nombre]?.open;
    return {
      abierto: guardado ?? ABIERTO_POR_DEFECTO,
      entradas: grupo.entities.map((entidad) => ({
        label: typeof entidad.label === "string" ? entidad.label : String(entidad.label),
        slug: entidad.slug,
        type: entidad.type,
      })),
      nombre,
    };
  });

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
        <MenuCliente grupos={grupos} />
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
