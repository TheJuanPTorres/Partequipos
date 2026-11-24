"use client";

import { IconLogout } from "@tabler/icons-react";
import { Link, useConfig, useTranslation } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";
import { useEffect } from "react";

import { ponerPistaModoAdmin, quitarPistaModoAdmin } from "@/lib/panel/pistaModoAdmin";

import { TAMANO_ICONO } from "./iconos";

/**
 * Botón de cerrar sesión. Mismo marcado, misma ruta y mismas etiquetas
 * accesibles que el `Logout` de Payload 3.88; lo único que cambia es el icono,
 * que pasa a ser el de Tabler para no mezclar familias (regla del sistema del
 * cliente).
 *
 * Modo administración sobre la web (tanda 23): este botón solo se pinta con sesión, así que al
 * montarse deja la PISTA `pq-modo-admin` en el navegador, y al pulsarlo la quita
 * (`src/lib/panel/pistaModoAdmin.ts`; no es autorización).
 *
 * `aria-label` y `title` salen de la traducción de Payload
 * (`authentication:logOut`), no de una cadena escrita aquí: así el panel en
 * español lo dice igual que el resto de la interfaz.
 */
export function Salir({ tabIndex = 0 }: { tabIndex?: number }) {
  const { t } = useTranslation();
  const {
    config: {
      admin: {
        routes: { logout: rutaSalir },
      },
      routes: { admin: adminRoute },
    },
  } = useConfig();

  useEffect(() => ponerPistaModoAdmin(), []);

  return (
    <Link
      aria-label={t("authentication:logOut")}
      className="nav__log-out"
      href={formatAdminURL({ adminRoute, path: rutaSalir })}
      onClick={() => quitarPistaModoAdmin()}
      prefetch={false}
      tabIndex={tabIndex}
      title={t("authentication:logOut")}
    >
      <IconLogout aria-hidden="true" size={TAMANO_ICONO} />
    </Link>
  );
}
