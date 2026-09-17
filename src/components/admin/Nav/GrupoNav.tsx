"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { AnimateHeight, useNav, usePreferences } from "@payloadcms/ui";
import { PREFERENCE_KEYS } from "payload/shared";
import { useState } from "react";

import { ICONOS_DE_GRUPO, TAMANO_ICONO } from "./iconos";

/**
 * Grupo del menú lateral. Sustituye a `NavGroup` de Payload para poder añadir
 * dos cosas que su versión no tiene:
 *
 * 1. **Icono del grupo**, del sistema de diseño del cliente.
 * 2. **`aria-expanded` y `aria-controls`.** El botón de Payload 3.88 solo lleva
 *    `class`, `tabindex` y `type` (comprobado en el código instalado): con un
 *    lector de pantalla no se anuncia si el grupo está abierto o cerrado.
 *
 * Lo demás se conserva igual que en Payload, a propósito:
 *
 * - **El estado se guarda por usuario** en las preferencias, con la misma clave
 *   (`nav`) y la misma forma (`groups[nombre].open`), así que lo que el editor
 *   tenía plegado sigue plegado.
 * - **`AnimateHeight`** es el componente de Payload, que al cerrar pone
 *   `display: none`: los enlaces de un grupo plegado no se alcanzan con el
 *   teclado. Replicarlo a mano habría sido fácil de hacer mal.
 * - **`tabIndex = -1` con el menú cerrado** (móvil), que es lo que impide
 *   tabular hacia un menú que no se ve.
 *
 * `abierto` llega resuelto desde el servidor. Hoy es siempre «abierto salvo que
 * el usuario lo plegara»; si dirección decide que los grupos arranquen
 * colapsados, se cambia ESE cálculo (un valor por defecto en el servidor) y aquí
 * no hay que tocar nada.
 */
export function GrupoNav({
  abierto,
  children,
  nombre,
}: {
  abierto: boolean;
  children: React.ReactNode;
  nombre: string;
}) {
  const [plegado, setPlegado] = useState(!abierto);
  const [animar, setAnimar] = useState(false);
  const { setPreference } = usePreferences();
  const { navOpen } = useNav();

  const Icono = ICONOS_DE_GRUPO[nombre];
  const idContenido = `nav-grupo-contenido-${nombre}`;

  function alternar() {
    setAnimar(true);
    // `merge: true` y la misma forma que Payload: no se pisan otros grupos.
    void setPreference(PREFERENCE_KEYS.NAV, { groups: { [nombre]: { open: plegado } } }, true);
    setPlegado(!plegado);
  }

  return (
    <div
      className={["nav-group", nombre, plegado && "nav-group--collapsed"].filter(Boolean).join(" ")}
      id={`nav-group-${nombre}`}
    >
      <button
        aria-controls={idContenido}
        aria-expanded={!plegado}
        className={`nav-group__toggle nav-group__toggle--${plegado ? "collapsed" : "open"}`}
        onClick={alternar}
        tabIndex={!navOpen ? -1 : 0}
        type="button"
      >
        <div className="nav-group__label">
          {Icono ? <Icono aria-hidden="true" size={TAMANO_ICONO} /> : null}
          {nombre}
        </div>
        <div className="nav-group__indicator">
          <IconChevronDown
            aria-hidden="true"
            className={`nav-group__chevron${plegado ? "" : " nav-group__chevron--abierto"}`}
            size={TAMANO_ICONO}
          />
        </div>
      </button>
      <AnimateHeight duration={animar ? 200 : 0} height={plegado ? 0 : "auto"} id={idContenido}>
        <div className="nav-group__content">{children}</div>
      </AnimateHeight>
    </div>
  );
}
