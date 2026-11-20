"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { EVENTO_ABRIR_COOKIES } from "@/lib/analitica/config";
import { clasificarClic } from "@/lib/analitica/eventos";
import {
  activarAnalitica,
  decisionDe,
  desactivarAnalitica,
  enviarEvento,
  guardarDecision,
  leerGuardado,
  SIN_LEER,
  suscribir,
} from "@/lib/analitica/navegador";

import estilos from "./avisoCookies.module.css";

/**
 * AVISO DE COOKIES Y ANALÍTICA (dirección, 2026-11-20; Ley 1581 de 2012).
 *
 * - Mientras el visitante no decide, se pinta el aviso con «Aceptar», «Rechazar» y «Configurar»,
 *   y NO se carga nada de Google. Al aceptar se carga Analytics; al rechazar, nada.
 * - «Configurar cookies», en el pie, lo reabre para cambiar la decisión.
 * - Con Analytics activo, este mismo componente mide los clics (WhatsApp, llamada, «Cotizar» y
 *   ficha técnica) con UN oyente en el documento: ningún botón del sitio cambia.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): la decisión vive en el navegador.
 * SIN CLS: es un recuadro fijo, fuera del flujo; no está en el HTML del servidor y aparece al
 * hidratar. El botón flotante de WhatsApp lo esquiva (`data-evita-flotante`).
 */
export function AvisoCookies({ id, politica }: { id: string; politica: string }) {
  const guardado = useSyncExternalStore(suscribir, leerGuardado, () => SIN_LEER);
  const decision = decisionDe(guardado);
  const pendiente = guardado !== SIN_LEER && decision === null;

  /** Abierto desde el pie, o con «Configurar». */
  const [configurando, setConfigurando] = useState(false);
  const [marcada, setMarcada] = useState(false);
  const recuadro = useRef<HTMLElement>(null);
  const idTitulo = useId();
  const idAnalitica = useId();
  const visible = pendiente || configurando;

  // La decisión manda: con permiso se carga (o reactiva) Analytics; sin él —rechazada o aún sin
  // decidir— queda apagado y lo ocurrido hasta entonces no se envía después.
  const permiso = guardado === SIN_LEER ? "sin-leer" : decision?.analitica ? "si" : "no";
  useEffect(() => {
    if (permiso === "si") activarAnalitica(id);
    else if (permiso === "no") desactivarAnalitica(id);
  }, [permiso, id]);

  // «Configurar cookies» del pie.
  useEffect(() => {
    const abrir = () => {
      setMarcada(decisionDe(leerGuardado())?.analitica ?? false);
      setConfigurando(true);
      requestAnimationFrame(() => recuadro.current?.focus());
    };
    window.addEventListener(EVENTO_ABRIR_COOKIES, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_COOKIES, abrir);
  }, []);

  // El botón flotante de WhatsApp recalcula su sitio al aparecer o irse el aviso.
  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, [visible, configurando]);

  // Clics que se miden. En captura: un botón que abre una ventana cancela el clic después.
  useEffect(() => {
    const alPulsar = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a, button");
      if (!el) return;
      const ventana = el.closest("dialog");
      const evento = clasificarClic({
        href: el instanceof HTMLAnchorElement ? el.href : null,
        texto: `${el.textContent ?? ""} ${el.getAttribute("aria-label") ?? ""}`,
        marca: el.getAttribute("data-analitica"),
        ventana: `${ventana?.getAttribute("aria-label") ?? ""} ${
          ventana?.querySelector("h1, h2, h3")?.textContent ?? ""
        }`,
        abreVentana: el.getAttribute("aria-haspopup") === "dialog",
      });
      if (evento) enviarEvento(evento.nombre, evento.parametros);
    };
    document.addEventListener("click", alPulsar, true);
    return () => document.removeEventListener("click", alPulsar, true);
  }, []);

  if (!visible) return null;

  const decidir = (analitica: boolean) => {
    guardarDecision(analitica);
    setConfigurando(false);
  };

  return (
    <section
      ref={recuadro}
      tabIndex={-1}
      aria-labelledby={idTitulo}
      className={estilos.aviso}
      data-evita-flotante
      onKeyDown={(e) => {
        // Escape cierra sin cambiar nada, solo si ya había una decisión.
        if (e.key === "Escape" && !pendiente) setConfigurando(false);
      }}
    >
      <h2 id={idTitulo} className={estilos.titulo}>
        {configurando ? "Configurar cookies" : "Usamos cookies"}
      </h2>
      {configurando ? (
        <>
          <ul className={estilos.opciones}>
            <li>
              <span className={estilos.opcion}>
                <input type="checkbox" checked disabled aria-label="Necesarias, siempre activas" />
                <span>
                  <strong>Necesarias</strong> (siempre activas): hacen que el sitio funcione y
                  recuerdan esta elección.
                </span>
              </span>
            </li>
            <li>
              <label htmlFor={idAnalitica} className={estilos.opcion}>
                <input
                  id={idAnalitica}
                  type="checkbox"
                  checked={marcada}
                  onChange={(e) => setMarcada(e.target.checked)}
                />
                <span>
                  <strong>Analítica</strong>: Google Analytics, para saber qué páginas se visitan y
                  mejorar el sitio. Sin publicidad.
                </span>
              </label>
            </li>
          </ul>
          <p className={estilos.texto}>
            Más información en nuestra <Link href={politica}>política de tratamiento de datos</Link>
            .
          </p>
          <div className={estilos.botones}>
            <button type="button" className={estilos.principal} onClick={() => decidir(marcada)}>
              Guardar selección
            </button>
            <button type="button" className={estilos.secundario} onClick={() => decidir(true)}>
              Aceptar todas
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={estilos.texto}>
            Con tu permiso usamos cookies de analítica (Google Analytics) para saber cómo se usa el
            sitio y mejorarlo. Puedes aceptarlas, rechazarlas o elegir. Más información en nuestra{" "}
            <Link href={politica}>política de tratamiento de datos</Link>.
          </p>
          <div className={estilos.botones}>
            <button type="button" className={estilos.principal} onClick={() => decidir(true)}>
              Aceptar
            </button>
            <button type="button" className={estilos.principal} onClick={() => decidir(false)}>
              Rechazar
            </button>
            <button
              type="button"
              className={estilos.secundario}
              onClick={() => {
                setMarcada(false);
                setConfigurando(true);
              }}
            >
              Configurar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
