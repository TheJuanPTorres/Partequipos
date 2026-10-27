"use client";

import { IconCheck, IconChevronUp, IconPhoto, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import panel from "@/components/nueva/panelEquipos.module.css";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./kit.module.css";

type Logo = Pick<ImagenLista, "url" | "alt" | "width" | "height"> & { oscuro?: boolean };

export type TipoPildora = {
  clave: string;
  nombre: string;
  /** El render del tipo (o su foto de respaldo); sin ninguno, el respaldo neutro del panel. */
  imagen?: ImagenLista | null;
  /** `true` si es el render recortado: se ve entero, sin recortes. */
  recortado?: boolean;
};

const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * La PÍLDORA DEL KIT EN MÓVIL Y TABLET (≤ 1024 px; 2026-10-27, dirección): en lugar de la barra
 * de escritorio, un BOTÓN COMPACTO abajo y centrado con el logo, el tipo de la sección visible y
 * su posición («Excavadoras · 3 de 7») y una flechita. Al tocarlo abre el PANEL INFERIOR del
 * sitio (el del #355, `panelEquipos.module.css`) con todos los tipos de la marca en su rejilla
 * de tarjetas (render o foto y nombre) y el actual marcado; tocar uno cierra el panel y baja a
 * esa sección. Lo muestra y lo esconde `PildoraKit` (se esconde al bajar y vuelve al subir).
 *
 * El panel es un `<dialog>` con `showModal()`: foco atrapado, Esc y la página de detrás inerte.
 * Al abrir, el foco va al título del panel; al cerrar, vuelve al botón, y al elegir un tipo, al
 * título de su sección. Con «reducir movimiento», nada se anima.
 */
export function BotonTiposKit({
  nombre,
  logo,
  tipos,
  activa,
  visible,
}: {
  nombre: string;
  logo: Logo | null;
  tipos: TipoPildora[];
  activa: string | null;
  visible: boolean;
}) {
  const [montado, setMontado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  /** El tipo elegido en el panel: al cerrarse, se baja a su sección. */
  const destino = useRef<string | null>(null);
  const empezoFuera = useRef(false);
  const idTitulo = useId();

  const indice = Math.max(
    0,
    tipos.findIndex((t) => t.clave === activa),
  );
  const actual = tipos[indice];

  useEffect(() => {
    const d = dialogo.current;
    if (d && abierto && !d.open) {
      d.showModal();
      tituloRef.current?.focus();
    }
  }, [abierto, montado]);

  function cerrar() {
    const d = dialogo.current;
    if (!d || !d.open || cerrando) return;
    if (reducido()) {
      d.close();
      return;
    }
    setCerrando(true);
    // Red de seguridad por si `animationend` no llega (pestaña en segundo plano).
    window.setTimeout(() => dialogo.current?.open && dialogo.current.close(), 700);
  }

  /** Ya cerrado el panel (la página vuelve a desplazarse): baja a la sección o devuelve el foco. */
  function alCerrar() {
    setAbierto(false);
    setCerrando(false);
    const clave = destino.current;
    destino.current = null;
    const seccion = clave ? document.getElementById(clave) : null;
    if (!seccion) {
      boton.current?.focus();
      return;
    }
    seccion.scrollIntoView({ behavior: reducido() ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${clave}`);
    // El foco, al título de la sección (el botón se esconde al bajar).
    const titulo = seccion.querySelector<HTMLElement>("h2") ?? seccion;
    if (!titulo.hasAttribute("tabindex")) titulo.setAttribute("tabindex", "-1");
    titulo.focus({ preventScroll: true });
  }

  if (!actual) return null;

  return (
    <>
      <button
        ref={boton}
        type="button"
        className={estilos.botonTipos}
        data-visible={visible ? "" : undefined}
        // Escondido, no se lee ni se enfoca.
        inert={!visible}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => {
          setMontado(true);
          setAbierto(true);
        }}
      >
        <span className={estilos.botonTiposLogo}>
          {logo ? (
            <LogoMarca logo={{ ...logo, oscuro: logo.oscuro ?? false }} alt="" sizes="64px" />
          ) : (
            <span>{nombre}</span>
          )}
        </span>
        <span className={estilos.botonTiposTexto}>
          <span className={estilos.botonTiposTipo}>{actual.nombre}</span>
          <span className={estilos.botonTiposPosicion}>
            {" · "}
            {indice + 1} de {tipos.length}
          </span>
        </span>
        <IconChevronUp
          className={estilos.botonTiposFlecha}
          aria-hidden="true"
          focusable="false"
          stroke={2.4}
          size={18}
        />
        <span className="sr-only">: ver los tipos de máquina {nombre}</span>
      </button>

      {montado ? (
        <dialog
          ref={dialogo}
          className={`${panel.panel} ${estilos.panelTipos}`}
          aria-labelledby={idTitulo}
          data-panel-equipos=""
          data-cerrando={cerrando ? "" : undefined}
          onCancel={(e) => {
            e.preventDefault();
            cerrar();
          }}
          onClose={alCerrar}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && cerrando) dialogo.current?.close();
          }}
          onPointerDown={(e) => {
            empezoFuera.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && empezoFuera.current) cerrar();
          }}
        >
          <div className={panel.hoja}>
            <span className={panel.asa} aria-hidden="true" />
            <div className={panel.cabecera}>
              <h2 id={idTitulo} ref={tituloRef} tabIndex={-1} className={panel.titulo}>
                Tipos de máquina {nombre} <span className={panel.cuenta}>({tipos.length})</span>
              </h2>
              <button type="button" className={panel.cerrar} onClick={cerrar}>
                <IconX aria-hidden="true" focusable="false" stroke={1.9} size={24} />
                <span className="sr-only">Cerrar el listado</span>
              </button>
            </div>
            <div className={panel.cuerpo}>
              <ul className={panel.lista}>
                {tipos.map((t, i) => {
                  const esActual = t.clave === actual.clave;
                  return (
                    <li key={t.clave} style={{ "--i": Math.min(i, 12) } as CSSProperties}>
                      <a
                        href={`#${t.clave}`}
                        className={panel.item}
                        data-actual={esActual ? "" : undefined}
                        aria-current={esActual ? "location" : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          destino.current = t.clave;
                          cerrar();
                        }}
                      >
                        <span className={panel.foto}>
                          {t.imagen ? (
                            <Image
                              src={t.imagen.url}
                              alt=""
                              fill
                              sizes="(max-width: 767px) 50vw, 33vw"
                              className={t.recortado ? estilos.panelTiposRender : panel.fotoImg}
                              style={{ objectPosition: t.imagen.posicion }}
                            />
                          ) : (
                            <IconPhoto
                              className={panel.fotoVacia}
                              aria-hidden="true"
                              focusable="false"
                              stroke={1.4}
                              size={40}
                            />
                          )}
                        </span>
                        {esActual ? (
                          <span className={panel.check} aria-hidden="true">
                            <IconCheck focusable="false" stroke={3} size={18} />
                          </span>
                        ) : null}
                        <span className={panel.nombreItem}>
                          {t.nombre}
                          {esActual ? <span className="sr-only"> (sección actual)</span> : null}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
