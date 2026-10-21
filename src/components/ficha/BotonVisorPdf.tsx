"use client";

import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { VisorLibro } from "@/components/documentos/VisorLibro";
import { paginasDelLibro } from "@/lib/documentos/paginasLibro";
import type { PaginaVisor } from "@/lib/documentos/visor";

import { VentanaFicha } from "./VentanaFicha";

/**
 * «FICHA TÉCNICA» de la ficha de maquinaria nueva (2026-10-21): abre el PDF del
 * equipo en el VISOR tipo libro (#295), en una ventana emergente.
 *
 * MEJORA PROGRESIVA: es un enlace al PDF, así que sin JavaScript —o con Ctrl,
 * ⌘, Mayús o el botón central— lo abre en otra pestaña. Si el documento aún no
 * tiene sus «Páginas como imágenes», también: el visor necesita las páginas.
 *
 * LIGERO: el HTML solo lleva la URL y las medidas de cada página; los `srcset`
 * se calculan al abrir, y el libro (`page-flip`) se descarga al interactuar con
 * él, como en el bloque «Documento en visor».
 */
export function BotonVisorPdf({
  titulo,
  pdf,
  paginas,
  className,
  children,
}: {
  /** Título de la ventana y del visor, p. ej. «Ficha técnica: Excavadora Hitachi ZX130-5B». */
  titulo: string;
  pdf: { url: string; tamano: string | null };
  paginas: PaginaVisor[];
  className?: string;
  children: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  const [montada, setMontada] = useState(false);
  const enlace = useRef<HTMLAnchorElement>(null);
  const conVisor = paginas.length > 0;
  const libro = useMemo(() => (montada ? paginasDelLibro(paginas) : []), [montada, paginas]);
  const primera = paginas[0];

  function alPulsar(e: MouseEvent<HTMLAnchorElement>) {
    if (!conVisor) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setMontada(true);
    setAbierta(true);
  }

  return (
    <>
      <a
        ref={enlace}
        href={pdf.url}
        className={className}
        target="_blank"
        rel="noopener"
        onClick={alPulsar}
        aria-haspopup={conVisor ? "dialog" : undefined}
      >
        {children}
        {conVisor ? null : <span className="sr-only"> (PDF, se abre en otra pestaña)</span>}
      </a>
      {montada && primera ? (
        <VentanaFicha
          abierta={abierta}
          titulo={titulo}
          style={{ ["--proporcion" as string]: String(primera.width / primera.height) }}
          alCerrar={() => {
            setAbierta(false);
            enlace.current?.focus();
          }}
        >
          <VisorLibro titulo={titulo} pdf={pdf} paginas={libro} conTitulo={false} />
        </VentanaFicha>
      ) : null}
    </>
  );
}
