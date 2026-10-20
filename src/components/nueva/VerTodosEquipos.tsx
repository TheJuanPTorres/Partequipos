"use client";

import { IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

import { IconoDato } from "@/components/ficha/IconoDato";
import type { TarjetaEquipo } from "@/lib/nueva/paginaMarcaAndres";

import estilos from "./marcaNueva.module.css";
import panel from "./panelEquipos.module.css";

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
 * al enlace al cerrar. El contenido se monta en el primer clic; cerrado no ocupa sitio.
 * Con «reducir movimiento» no hay barrido: un fundido.
 */
export function VerTodosEquipos({
  titulo,
  href,
  total,
  equipos,
  className,
}: {
  titulo: string;
  href: string;
  total: number;
  equipos: TarjetaEquipo[];
  className?: string;
}) {
  const [montado, setMontado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const enlace = useRef<HTMLAnchorElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const empezoFuera = useRef(false);
  const idTitulo = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
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
      >
        Ver todos ({total})
      </Link>
      {montado ? (
        <dialog
          ref={dialogo}
          className={panel.panel}
          aria-labelledby={idTitulo}
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
              <h2 id={idTitulo} className={panel.titulo}>
                {titulo} <span className={panel.cuenta}>({total})</span>
              </h2>
              <button type="button" className={panel.cerrar} onClick={cerrar}>
                <IconX aria-hidden="true" focusable="false" stroke={1.9} size={24} />
                <span className="sr-only">Cerrar el listado</span>
              </button>
            </div>
            <ul className={`${estilos.rejilla} ${panel.lista}`}>
              {equipos.map((e) => (
                <li key={e.id} className={estilos.tarjeta}>
                  <Link href={e.href} className={panel.enlaceEquipo}>
                    <div className={estilos.foto}>
                      {e.foto?.url ? (
                        <Image
                          src={e.foto.url}
                          alt=""
                          fill
                          sizes="(max-width: 767px) 90vw, (max-width: 1024px) 45vw, 400px"
                          className={estilos.fotoImg}
                          style={{ objectPosition: e.foto.posicion }}
                        />
                      ) : null}
                    </div>
                    <span className={estilos.nombre}>{e.nombre}</span>
                    {e.datos.length > 0 ? (
                      <ul className={estilos.datos}>
                        {e.datos.map((d) => (
                          <li key={d.etiqueta} className={estilos.dato}>
                            <IconoDato icono={d.icono} className={estilos.datoIcono} />
                            <span>
                              <strong>{d.etiqueta}:</strong> {d.valor}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
