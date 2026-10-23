"use client";

import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconLayoutGrid,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import type { PageFlip } from "page-flip";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { textoContador } from "@/lib/documentos/visor";

import estilos from "./visorLibro.module.css";

export type PaginaLibro = {
  alt: string;
  width: number;
  height: number;
  src: string;
  srcSet?: string;
  sizes: string;
  zoomSrcSet?: string;
  zoomSizes: string;
  miniatura: string;
};

/** Por debajo de este ancho del visor, una sola página (y deslizar). */
const ANCHO_MIN_PAGINA = 320;

/**
 * VISOR TIPO LIBRO de un PDF (2026-10-20, petición del cliente). Cliente
 * porque pasa páginas, escucha el teclado y usa la pantalla completa.
 *
 * LIGERO: lo que llega con la página es este componente y las imágenes de la
 * portada (las dos primeras páginas, o la primera en móvil), en una caja con
 * la proporción de la página, así que no hay CLS. `page-flip` (StPageFlip, MIT,
 * ~43 kB sin comprimir) se descarga solo al interactuar (un botón, una tecla o
 * tocar el libro), y nunca pdf.js: las páginas ya son imágenes.
 *
 * ACCESIBLE: botones con nombre, contador anunciado, flechas del teclado
 * (← → Inicio Fin) con el foco en el visor, miniaturas como botones, y el
 * enlace «Descargar PDF» siempre a la vista. Con «reducir movimiento», el paso
 * de página no se anima.
 */
export function VisorLibro({
  titulo,
  pdf,
  paginas,
  conTitulo = true,
}: {
  titulo: string;
  /** Dentro del texto, el encabezado de la sección ya lo nombra: el título solo para lectores. */
  conTitulo?: boolean;
  pdf: { url: string; tamano: string | null };
  paginas: PaginaLibro[];
}) {
  const id = useId();
  const raiz = useRef<HTMLElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const hostLibro = useRef<HTMLDivElement>(null);
  const libro = useRef<PageFlip | null>(null);
  const cargando = useRef<Promise<PageFlip | null> | null>(null);

  const [activo, setActivo] = useState(false);
  const [indice, setIndice] = useState(0);
  const [dobles, setDobles] = useState(true);
  const [zoom, setZoom] = useState(false);
  const [miniaturas, setMiniaturas] = useState(false);
  const [completa, setCompleta] = useState(false);

  const total = paginas.length;
  const primera = paginas[0]!;
  const proporcion = primera.width / primera.height;

  /** Monta el libro la primera vez que hace falta; las siguientes, el mismo. */
  const asegurar = useCallback((): Promise<PageFlip | null> => {
    if (cargando.current) return cargando.current;
    cargando.current = (async () => {
      const host = hostLibro.current;
      if (!host) return null;
      const { PageFlip } = await import("page-flip");
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // page-flip borra su elemento al destruirse: va en uno propio, no en uno de React.
      const bloque = document.createElement("div");
      bloque.className = estilos.libro!;
      const hojas = paginas.map((p) => {
        const hoja = document.createElement("div");
        hoja.className = estilos.hoja!;
        const img = document.createElement("img");
        img.src = p.src;
        if (p.srcSet) img.srcset = p.srcSet;
        img.sizes = p.sizes;
        img.alt = p.alt;
        img.width = p.width;
        img.height = p.height;
        img.draggable = false;
        hoja.append(img);
        bloque.append(hoja);
        return hoja;
      });
      host.append(bloque);
      const pf = new PageFlip(bloque, {
        width: primera.width,
        height: primera.height,
        size: "stretch",
        minWidth: ANCHO_MIN_PAGINA,
        maxWidth: 4000,
        minHeight: Math.round(ANCHO_MIN_PAGINA / proporcion),
        maxHeight: 6000,
        usePortrait: true,
        showCover: false,
        drawShadow: true,
        maxShadowOpacity: 0.35,
        flippingTime: reducir ? 1 : 700,
        mobileScrollSupport: true,
        showPageCorners: !reducir,
      });
      pf.on("flip", (e) => setIndice(Number(e.data) || 0));
      pf.on("changeOrientation", (e) => setDobles(e.data === "landscape"));
      pf.loadFromHTML(hojas);
      await new Promise<void>((listo) => pf.on("init", () => listo()));
      setDobles(pf.getOrientation() === "landscape");
      setIndice(pf.getCurrentPageIndex());
      libro.current = pf;
      setActivo(true);
      return pf;
    })();
    return cargando.current;
  }, [paginas, primera.width, primera.height, proporcion]);

  useEffect(
    () => () => {
      libro.current?.destroy();
      libro.current = null;
    },
    [],
  );

  useEffect(() => {
    const cambio = () => {
      setCompleta(document.fullscreenElement === raiz.current);
      // El libro se recoloca al nuevo tamaño (page-flip escucha `resize`, no esto).
      requestAnimationFrame(() => libro.current?.update());
    };
    document.addEventListener("fullscreenchange", cambio);
    return () => document.removeEventListener("fullscreenchange", cambio);
  }, []);

  // Abrir o cerrar las miniaturas en pantalla completa cambia el tamaño del libro.
  useEffect(() => {
    requestAnimationFrame(() => libro.current?.update());
  }, [miniaturas, completa]);

  const ir = useCallback(
    async (accion: "anterior" | "siguiente" | "inicio" | "fin" | number) => {
      const pf = await asegurar();
      if (!pf) return;
      if (accion === "anterior") pf.flipPrev();
      else if (accion === "siguiente") pf.flipNext();
      else if (accion === "inicio") pf.turnToPage(0);
      else if (accion === "fin") pf.turnToPage(total - 1);
      else pf.flip(accion);
    },
    [asegurar, total],
  );

  const alTeclado = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const teclas: Record<string, Parameters<typeof ir>[0]> = {
      ArrowLeft: "anterior",
      ArrowRight: "siguiente",
      Home: "inicio",
      End: "fin",
    };
    const accion = teclas[e.key];
    // Con zoom, las flechas mueven la página ampliada (desplazamiento normal).
    if (accion === undefined || zoom) return;
    e.preventDefault();
    void ir(accion);
  };

  const pantallaCompleta = async () => {
    await asegurar();
    if (document.fullscreenElement) await document.exitFullscreen();
    else await raiz.current?.requestFullscreen?.();
  };

  const alternarZoom = async () => {
    await asegurar();
    setZoom((z) => !z);
  };

  const alternarMiniaturas = async () => {
    await asegurar();
    setMiniaturas((m) => !m);
  };

  // Lo que se ve: la página actual y, con el libro abierto, la siguiente.
  const visibles = (dobles ? [indice, indice + 1] : [indice]).filter((i) => i < total);
  const idMiniaturas = `${id}-miniaturas`;

  return (
    <section
      ref={raiz}
      className={estilos.visor}
      aria-label={`Documento: ${titulo}`}
      onKeyDown={alTeclado}
      style={{ ["--proporcion" as string]: String(proporcion) }}
      data-completa={completa ? "" : undefined}
      data-miniaturas={miniaturas ? "" : undefined}
      // Dentro del texto, sale de la columna de lectura al ancho de la página (`RichText`).
      data-ancho-pagina=""
    >
      {conTitulo ? <h3 className={estilos.titulo}>{titulo}</h3> : null}

      <div
        ref={escenario}
        className={estilos.escenario}
        // Tocar o pulsar el libro lo monta; desde ahí lo maneja page-flip.
        onPointerDown={activo ? undefined : () => void asegurar()}
        tabIndex={0}
        aria-label={`${titulo}: usa las flechas ← y → para pasar página`}
        data-activo={activo ? "" : undefined}
        data-zoom={zoom ? "" : undefined}
      >
        {/* Portada: las mismas páginas que abre el libro, en la misma caja. */}
        {!activo ? (
          <div className={estilos.portada} aria-hidden="true">
            {paginas.slice(0, 2).map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- srcset ya calculado en el servidor (`getImageProps`)
              <img
                key={p.src}
                src={p.src}
                srcSet={p.srcSet}
                sizes={p.sizes}
                alt=""
                width={p.width}
                height={p.height}
                loading="lazy"
                decoding="async"
                className={i === 1 ? estilos.segunda : undefined}
              />
            ))}
          </div>
        ) : null}

        {/* page-flip borra su elemento al destruirse: va aquí dentro, fuera de React. */}
        <div ref={hostLibro} className={estilos.hostLibro} />

        {zoom ? (
          <div
            className={estilos.ampliada}
            tabIndex={0}
            aria-label={`Páginas ampliadas: ${textoContador(indice, total, dobles)}`}
          >
            <div className={estilos.ampliadaPaginas}>
              {visibles.map((i) => {
                const p = paginas[i]!;
                return (
                  // eslint-disable-next-line @next/next/no-img-element -- srcset ya calculado en el servidor
                  <img
                    key={p.src}
                    src={p.src}
                    srcSet={p.zoomSrcSet}
                    sizes={p.zoomSizes}
                    alt={p.alt}
                    width={p.width}
                    height={p.height}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/*
        En el teléfono, los controles le dejan su columna al botón flotante de
        WhatsApp (CSS); si aun así lo pisan, el botón sube (`WhatsAppFlotante`).
      */}
      <div className={estilos.controles} data-evita-flotante="">
        <button
          type="button"
          className={estilos.boton}
          onClick={() => void ir("anterior")}
          disabled={indice === 0}
          aria-label="Página anterior"
        >
          <IconChevronLeft aria-hidden="true" size={20} />
        </button>
        <p className={estilos.contador} aria-live="polite">
          <span className={estilos.soloLectores}>Página </span>
          {activo ? (
            textoContador(indice, total, dobles)
          ) : (
            // Antes de montar el libro no se sabe si caben dos: lo decide el CSS por el ancho.
            <>
              <span className={estilos.siDobles}>{textoContador(0, total, true)}</span>
              <span className={estilos.siUna}>{textoContador(0, total, false)}</span>
            </>
          )}
        </p>
        <button
          type="button"
          className={estilos.boton}
          onClick={() => void ir("siguiente")}
          disabled={visibles.at(-1) === total - 1}
          aria-label="Página siguiente"
        >
          <IconChevronRight aria-hidden="true" size={20} />
        </button>

        <span className={estilos.separador} aria-hidden="true" />

        <button
          type="button"
          className={estilos.boton}
          onClick={() => void alternarMiniaturas()}
          aria-expanded={miniaturas}
          aria-controls={idMiniaturas}
          aria-label="Miniaturas"
        >
          <IconLayoutGrid aria-hidden="true" size={20} />
        </button>
        <button
          type="button"
          className={estilos.boton}
          onClick={() => void alternarZoom()}
          aria-pressed={zoom}
          aria-label={zoom ? "Quitar el zoom" : "Ampliar"}
        >
          {zoom ? (
            <IconZoomOut aria-hidden="true" size={20} />
          ) : (
            <IconZoomIn aria-hidden="true" size={20} />
          )}
        </button>
        <button
          type="button"
          className={estilos.boton}
          onClick={() => void pantallaCompleta()}
          aria-pressed={completa}
          aria-label={completa ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {completa ? (
            <IconArrowsMinimize aria-hidden="true" size={20} />
          ) : (
            <IconArrowsMaximize aria-hidden="true" size={20} />
          )}
        </button>

        <a href={pdf.url} className={estilos.descargar} rel="noopener noreferrer" data-descargar="">
          <IconDownload aria-hidden="true" size={18} />
          Descargar PDF
          {pdf.tamano ? <span className={estilos.tamano}> ({pdf.tamano})</span> : null}
        </a>
      </div>

      <ul id={idMiniaturas} className={estilos.miniaturas} hidden={!miniaturas}>
        {miniaturas
          ? paginas.map((p, i) => (
              <li key={p.src}>
                <button
                  type="button"
                  className={estilos.miniatura}
                  onClick={() => void ir(i)}
                  aria-current={visibles.includes(i) ? "page" : undefined}
                  aria-label={`Ir a la página ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya calculada en el servidor */}
                  <img
                    src={p.miniatura}
                    alt=""
                    width={64}
                    height={Math.round(64 / proporcion)}
                    loading="lazy"
                  />
                  <span aria-hidden="true">{i + 1}</span>
                </button>
              </li>
            ))
          : null}
      </ul>
    </section>
  );
}
