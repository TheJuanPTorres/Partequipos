"use client";

import { IconCheck, IconChevronRight, IconMinus, IconPlus } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { forwardRef, memo, useId, useState, type CSSProperties, type KeyboardEvent } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import {
  panelConTarjetas,
  type EnlaceMenu,
  type GrupoMenu,
  type PanelMenu,
  type TarjetaMenu,
} from "@/lib/megamenu";

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
            {e.nota ? <span className={estilos.nota}> · {e.nota}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * TARJETAS CON FOTO (las categorías técnicas de Repuestos, 2026-10-20): foto y
 * nombre, como las tarjetas de categorías del sitio, en versión compacta; 5 por
 * fila en escritorio y tablet y 2 en el teléfono, con la última fila centrada (regla
 * del #281). La foto es DECORATIVA (el nombre ya nombra la tarjeta), diferida y
 * pedida a su tamaño: va dentro de un acordeón cerrado (`hidden`), así que no se
 * descarga hasta que se abre. La caja tiene proporción fija: sin CLS.
 */
function Tarjetas({ tarjetas, alElegir }: { tarjetas: TarjetaMenu[]; alElegir: () => void }) {
  if (tarjetas.length === 0) return null;
  return (
    <ul className={estilos.tarjetas}>
      {tarjetas.map((t) => (
        <li key={t.href} className={estilos.tarjetaCaja}>
          <Link href={t.href} className={estilos.tarjeta} onClick={alElegir}>
            <span className={estilos.tarjetaFoto}>
              {t.imagen ? (
                <Image
                  src={t.imagen.url}
                  width={t.imagen.width}
                  height={t.imagen.height}
                  alt=""
                  sizes="(max-width: 767px) 45vw, (max-width: 1024px) 19vw, 130px"
                  loading="lazy"
                />
              ) : null}
            </span>
            <span className={estilos.tarjetaNombre}>{t.etiqueta}</span>
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
          <LogoMarca
            logo={{ ...grupo.logo, oscuro: grupo.logo.oscuro === true }}
            alt=""
            sizes="96px"
            loading="lazy"
            className={estilos.logo}
          />
        ) : null}
        {grupo.titulo}
      </button>
      <div id={id} className={estilos.contenido} hidden={!abierto}>
        <Lista enlaces={grupo.enlaces} alElegir={alElegir} />
        {grupo.tarjetas ? <Tarjetas tarjetas={grupo.tarjetas} alElegir={alElegir} /> : null}
        {grupo.grupos.map((g) => (
          <Acordeon key={g.titulo} grupo={g} nivel={nivel + 1} alElegir={alElegir} />
        ))}
      </div>
    </div>
  );
}

/**
 * El CONTENIDO de un panel —«Ver todo», los acordeones y los enlaces finales
 * (la política de garantías)—, común al megamenú de escritorio y al menú móvil
 * (2026-10-20): los dos pintan lo mismo.
 */
export function ContenidoMenu({ panel, alElegir }: { panel: PanelMenu; alElegir: () => void }) {
  return (
    <>
      <Link href={panel.verTodo.href} className={estilos.verTodo} onClick={alElegir}>
        {panel.verTodo.etiqueta}
        <IconChevronRight aria-hidden="true" focusable="false" stroke={2} />
      </Link>
      {panel.grupos.map((g) => (
        <Acordeon key={g.titulo} grupo={g} nivel={1} alElegir={alElegir} />
      ))}
      {(panel.finales ?? []).map((e) => (
        // Un enlace suelto con el recuadro de los acordeones de nivel 1.
        <div key={e.href} className={estilos.acordeon} data-nivel={1}>
          <Link
            href={e.href}
            className={`${estilos.titulo} ${estilos.tituloEnlace}`}
            onClick={alElegir}
          >
            <IconChevronRight aria-hidden="true" focusable="false" stroke={2.5} />
            {e.etiqueta}
          </Link>
        </div>
      ))}
    </>
  );
}

/**
 * MENÚ MÓVIL (2026-10-20): una entrada con panel es su enlace y, al lado, un
 * botón que despliega el MISMO contenido que el megamenú de escritorio
 * (`ContenidoMenu`). Divulgación con `aria-expanded`; los enlaces están en el
 * HTML del servidor aunque estén plegados.
 */
export function SubmenuMovil({
  etiqueta,
  href,
  actual,
  panel,
  claseEnlace,
  alElegir,
}: {
  etiqueta: string;
  href: string;
  actual: "page" | undefined;
  panel: PanelMenu;
  claseEnlace?: string;
  alElegir: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  return (
    <>
      <div className={estilos.filaMovil}>
        <Link href={href} className={claseEnlace} aria-current={actual}>
          {etiqueta}
        </Link>
        <button
          type="button"
          className={estilos.abrirMovil}
          aria-expanded={abierto}
          aria-controls={id}
          aria-label={`${abierto ? "Cerrar" : "Abrir"} el menú de ${etiqueta}`}
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? (
            <IconMinus aria-hidden="true" focusable="false" stroke={2.5} />
          ) : (
            <IconPlus aria-hidden="true" focusable="false" stroke={2.5} />
          )}
        </button>
      </div>
      <div id={id} className={estilos.movil} hidden={!abierto}>
        <ContenidoMenu panel={panel} alElegir={alElegir} />
      </div>
    </>
  );
}

type Props = {
  id: string;
  etiqueta: string;
  panel: PanelMenu;
  abierto: boolean;
  /** Dónde acaba la cabecera (px): el panel empieza ahí. `null`: el valor de reserva del CSS. */
  arriba: number | null;
  /**
   * Cerrar: al elegir un enlace (`null`), con Escape o Mayús+Tab desde el
   * primero (`"boton"`), o con Tab desde el último (`"siguiente"`).
   */
  alCerrar: (clave: string, foco: "boton" | "siguiente" | null) => void;
  alEntrar: (clave: string) => void;
  alSalir: () => void;
  /** Clave del panel: las funciones de arriba son comunes y estables, así que el panel no se vuelve a pintar con cada cambio de la cabecera. */
  clave: string;
};

export const Megamenu = memo(
  forwardRef<HTMLElement, Props>(function Megamenu(
    { id, etiqueta, panel, abierto, arriba, alCerrar, alEntrar, alSalir, clave },
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
        alCerrar(clave, "boton");
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
        alCerrar(clave, "boton");
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        alCerrar(clave, "siguiente");
      }
    };

    return (
      <nav
        ref={ref}
        id={id}
        aria-label={etiqueta}
        className={estilos.panel}
        data-abierto={abierto ? "si" : "no"}
        data-ancho={panelConTarjetas(panel) ? "amplio" : undefined}
        style={arriba === null ? undefined : ({ "--mega-arriba": `${arriba}px` } as CSSProperties)}
        onKeyDown={alTeclado}
        onMouseEnter={() => alEntrar(clave)}
        onMouseLeave={alSalir}
      >
        <div className={estilos.caja}>
          <ContenidoMenu panel={panel} alElegir={() => alCerrar(clave, null)} />
        </div>
      </nav>
    );
  }),
);
