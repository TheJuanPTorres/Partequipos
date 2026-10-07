"use client";

import { IconCheck, IconChevronRight, IconMinus, IconPlus } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { forwardRef, useId, useState, type KeyboardEvent } from "react";

import type { EnlaceMenu, GrupoMenu, PanelMenu } from "@/lib/megamenu";

import estilos from "./megamenu.module.css";

/**
 * PANEL DEL MEGAMENÚ (ux-9, export 2162 del 2026-10-05; decisiones-home-ux9.md
 * §26). Lo abre `Cabecera`; aquí solo se pinta y se recorre.
 *
 * Acordeones como DIVULGACIÓN, no como `role="menu"`: un botón con
 * `aria-expanded` y `aria-controls` que muestra u oculta su región. Los
 * enlaces están siempre en el HTML del servidor (SEO, CLAUDE.md §3.1).
 */

function Lista({ enlaces, alElegir }: { enlaces: EnlaceMenu[]; alElegir: () => void }) {
  if (enlaces.length === 0) return null;
  return (
    <ul className={estilos.lista}>
      {enlaces.map((e) => (
        <li key={e.href}>
          <Link href={e.href} className={estilos.hoja} onClick={alElegir}>
            <IconCheck aria-hidden="true" focusable="false" stroke={2.5} />
            {e.etiqueta}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Acordeon({
  grupo,
  nivel,
  alElegir,
}: {
  grupo: GrupoMenu;
  nivel: number;
  alElegir: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  return (
    <div className={estilos.acordeon} data-nivel={nivel} data-abierto={abierto ? "si" : "no"}>
      <button
        type="button"
        className={estilos.titulo}
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto(!abierto)}
      >
        {abierto ? (
          <IconMinus aria-hidden="true" focusable="false" stroke={2.5} />
        ) : (
          <IconPlus aria-hidden="true" focusable="false" stroke={2.5} />
        )}
        {/*
         * Logo de la marca (petición del cliente, §26): DECORATIVO, el nombre
         * ya dice la marca. Va dentro de un acordeón cerrado (`hidden`), así
         * que la carga diferida no lo descarga hasta que se abre. Medidas
         * explícitas: sin CLS.
         */}
        {grupo.logo ? (
          <Image
            src={grupo.logo.url}
            alt=""
            width={grupo.logo.width}
            height={grupo.logo.height}
            loading="lazy"
            className={estilos.logo}
          />
        ) : null}
        {grupo.titulo}
      </button>
      <div id={id} className={estilos.contenido} hidden={!abierto}>
        <Lista enlaces={grupo.enlaces} alElegir={alElegir} />
        {grupo.grupos.map((g) => (
          <Acordeon key={g.titulo} grupo={g} nivel={nivel + 1} alElegir={alElegir} />
        ))}
      </div>
    </div>
  );
}

type Props = {
  id: string;
  etiqueta: string;
  panel: PanelMenu;
  abierto: boolean;
  encogida: boolean;
  /**
   * Cerrar: al elegir un enlace (`null`), con Escape o Mayús+Tab desde el
   * primero (`"boton"`), o con Tab desde el último (`"siguiente"`).
   */
  alCerrar: (foco: "boton" | "siguiente" | null) => void;
  alEntrar: () => void;
  alSalir: () => void;
};

export const Megamenu = forwardRef<HTMLElement, Props>(function Megamenu(
  { id, etiqueta, panel, abierto, encogida, alCerrar, alEntrar, alSalir },
  ref,
) {
  /*
   * El panel va DESPUÉS de la cabecera en el DOM (el `clip-path` del encogido
   * lo recortaría dentro). Para que el orden del tabulador siga siendo el de
   * la cabecera: al salir con Tab por el final, se cierra y el foco pasa al
   * enlace que sigue al botón; con Mayús+Tab desde el primero, vuelve al botón.
   */
  const alTeclado = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      alCerrar("boton");
      return;
    }
    if (e.key !== "Tab") return;
    const enfocables = [
      ...e.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    ].filter((el) => el.offsetParent !== null);
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      alCerrar("boton");
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      alCerrar("siguiente");
    }
  };

  return (
    <nav
      ref={ref}
      id={id}
      aria-label={etiqueta}
      className={estilos.panel}
      data-abierto={abierto ? "si" : "no"}
      data-encogida={encogida ? "si" : "no"}
      onKeyDown={alTeclado}
      onMouseEnter={alEntrar}
      onMouseLeave={alSalir}
    >
      <div className={estilos.caja}>
        <Link href={panel.verTodo.href} className={estilos.verTodo} onClick={() => alCerrar(null)}>
          {panel.verTodo.etiqueta}
          <IconChevronRight aria-hidden="true" focusable="false" stroke={2} />
        </Link>
        {panel.grupos.map((g) => (
          <Acordeon key={g.titulo} grupo={g} nivel={1} alElegir={() => alCerrar(null)} />
        ))}
      </div>
    </nav>
  );
});
