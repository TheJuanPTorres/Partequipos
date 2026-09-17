"use client";

import { Link, useConfig } from "@payloadcms/ui";
import { EntityType } from "@payloadcms/ui/shared";
import { usePathname } from "next/navigation";
import { formatAdminURL } from "payload/shared";

import { GrupoNav } from "./GrupoNav";

export type EntradaMenu = {
  label: string;
  slug: string;
  type: EntityType;
};

export type GrupoMenu = {
  abierto: boolean;
  entradas: EntradaMenu[];
  nombre: string;
};

/**
 * Lista de grupos y entradas del menú. Es la parte de cliente porque necesita la
 * ruta actual (`usePathname`) para marcar la página activa.
 *
 * Réplica deliberada de `DefaultNavClient` de Payload 3.88 en tres puntos, que
 * son los que se perderían al reemplazar el menú:
 *
 * 1. **Página activa:** misma comprobación que Payload
 *    (`startsWith` + siguiente carácter «/» o ninguno), para que
 *    `/collections/marcas` no se active estando en `/collections/marcas-lubricante`.
 * 2. **La barra indicadora** (`nav__link-indicator`) se pinta en la entrada
 *    activa: es lo que distingue la página actual del hover (docs/design-tokens.md,
 *    fase 3).
 * 3. **La entrada de la página actual NO es un enlace**, igual que en Payload: es
 *    un `div`. Un enlace a la página en la que ya estás es ruido para quien
 *    navega con teclado o lector.
 *
 * Las etiquetas llegan ya traducidas del servidor (`groupNavItems` resuelve la
 * i18n), así que aquí no hace falta `getTranslation`.
 */
export function MenuCliente({ grupos }: { grupos: GrupoMenu[] }) {
  const pathname = usePathname();
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();

  return (
    <>
      {grupos.map((grupo) => (
        <GrupoNav abierto={grupo.abierto} key={grupo.nombre} nombre={grupo.nombre}>
          {grupo.entradas.map((entrada) => {
            const href = formatAdminURL({
              adminRoute,
              path:
                entrada.type === EntityType.global
                  ? `/globals/${entrada.slug}`
                  : `/collections/${entrada.slug}`,
            });
            const id =
              entrada.type === EntityType.global
                ? `nav-global-${entrada.slug}`
                : `nav-${entrada.slug}`;
            const activa =
              pathname.startsWith(href) && ["/", undefined].includes(pathname[href.length]);

            const contenido = (
              <>
                {activa ? <div className="nav__link-indicator" /> : null}
                <span className="nav__link-label">{entrada.label}</span>
              </>
            );

            if (pathname === href) {
              return (
                <div className="nav__link" id={id} key={entrada.slug}>
                  {contenido}
                </div>
              );
            }

            return (
              <Link className="nav__link" href={href} id={id} key={entrada.slug} prefetch={false}>
                {contenido}
              </Link>
            );
          })}
        </GrupoNav>
      ))}
    </>
  );
}
