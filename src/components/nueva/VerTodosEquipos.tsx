"use client";

import { IconArrowRight, IconCircleCheck, IconX } from "@tabler/icons-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";

import panel from "./panelEquipos.module.css";

/** Una fila del panel. Sin `href`, el nombre como texto (un modelo que WordPress nombra sin página). */
export type ElementoPanel = { id: number | string; nombre: string; href: string | null };

/**
 * «VER TODOS (N)»: abre un PANEL que sube desde la parte inferior de la pantalla con el
 * listado completo de los equipos del tipo (petición del cliente, 2026-10-20).
 *
 * MEJORA PROGRESIVA: es un enlace a la página del tipo (que sigue existiendo para
 * Google y otros enlaces), así que sin JavaScript —o con Ctrl, ⌘, Mayús o botón
 * central— va a esa página. Con JavaScript, el clic normal abre el panel.
 *
 * El panel es un `<dialog>` nativo con `showModal()`: foco atrapado, Esc, título
 * anunciado y la página de detrás inerte. Se añade la X y el clic fuera. El foco vuelve
 * al enlace «Ver todos» al cerrar; al abrir, el foco va al título del panel. El contenido se monta en el primer clic; cerrado no ocupa sitio.
 * Con «reducir movimiento» no hay barrido: un fundido.
 *
 * También lo usa la página de MARCA DE REPUESTOS (dirección, 2026-10-21): el «Ver todo» de
 * cada tarjeta de tipo o serie abre el panel con sus modelos (`etiqueta`, `describedBy`), con
 * un enlace discreto a la página completa del tipo (`enlacePagina`) y la barra en el color de
 * la marca (`acento`).
 */
export function VerTodosEquipos({
  titulo,
  href,
  total,
  equipos,
  className,
  etiqueta,
  describedBy,
  enlacePagina,
  acento,
}: {
  titulo: string;
  href: string;
  total: number;
  equipos: ElementoPanel[];
  className?: string;
  /** El contenido del enlace; por defecto «Ver todos (N)». */
  etiqueta?: ReactNode;
  /** `aria-describedby` del enlace (la tarjeta a la que pertenece). */
  describedBy?: string;
  /** Texto de un enlace discreto, al pie del panel, a la página completa (`href`). */
  enlacePagina?: string;
  /** Color de la barra del panel; sin él, el `--acento` de la página o un gris oscuro. */
  acento?: string | null;
}) {
  const [montado, setMontado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const enlace = useRef<HTMLAnchorElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const empezoFuera = useRef(false);
  const idTitulo = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      // El foco inicial va al título (decisión de dirección, 2026-10-20): se anuncia el panel y
      // el Tab siguiente llega al botón de cerrar y al listado.
      tituloRef.current?.focus();
    }
  }, [abierto, montado]);

  function alPulsar(e: MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setMontado(true);
    setAbierto(true);
  }

  function cerrar() {
    const d = dialogo.current;
    if (!d || !d.open || cerrando) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      d.close();
      return;
    }
    setCerrando(true);
    // Red de seguridad por si `animationend` no llega (pestaña en segundo plano).
    window.setTimeout(() => dialogo.current?.open && dialogo.current.close(), 700);
  }

  return (
    <>
      <Link
        ref={enlace}
        href={href}
        className={className}
        onClick={alPulsar}
        aria-haspopup="dialog"
        aria-describedby={describedBy}
      >
        {etiqueta ?? `Ver todos (${total})`}
      </Link>
      {montado ? (
        <dialog
          ref={dialogo}
          className={panel.panel}
          aria-labelledby={idTitulo}
          style={acento ? ({ "--acento": acento } as CSSProperties) : undefined}
          data-panel-equipos=""
          data-cerrando={cerrando ? "" : undefined}
          // Esc: el cierre pasa por la animación de bajada.
          onCancel={(e) => {
            e.preventDefault();
            cerrar();
          }}
          onClose={() => {
            setAbierto(false);
            setCerrando(false);
            enlace.current?.focus();
          }}
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
            <span className={panel.barra} aria-hidden="true" />
            <span className={panel.asa} aria-hidden="true" />
            <div className={panel.cabecera}>
              <h2 id={idTitulo} ref={tituloRef} tabIndex={-1} className={panel.titulo}>
                {titulo} <span className={panel.cuenta}>({total})</span>
              </h2>
              <button type="button" className={panel.cerrar} onClick={cerrar}>
                <IconX aria-hidden="true" focusable="false" stroke={1.9} size={24} />
                <span className="sr-only">Cerrar el listado</span>
              </button>
            </div>
            <div className={panel.cuerpo}>
              <ul className={panel.lista}>
                {equipos.map((e) => (
                  <li key={e.id}>
                    {e.href ? (
                      <Link href={e.href} className={panel.item}>
                        <span className={panel.marca} aria-hidden="true">
                          <IconCircleCheck focusable="false" stroke={1.9} size={26} />
                        </span>
                        <span className={panel.nombreItem}>{e.nombre}</span>
                        <span className={panel.flecha} aria-hidden="true">
                          <IconArrowRight focusable="false" stroke={2.2} size={22} />
                        </span>
                      </Link>
                    ) : (
                      <span className={`${panel.item} ${panel.itemSinEnlace}`}>
                        <span className={panel.marca} aria-hidden="true">
                          <IconCircleCheck focusable="false" stroke={1.9} size={26} />
                        </span>
                        <span className={panel.nombreItem}>{e.nombre}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {enlacePagina ? (
                <p className={panel.pie}>
                  <Link href={href} className={panel.enlacePagina}>
                    {enlacePagina}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
