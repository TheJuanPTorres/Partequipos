"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import nueva from "./fichaNueva.module.css";

/*
 * LA DESCRIPCIÓN Y LOS BOTONES DE LA FICHA NUEVA, con «Leer más» (dirección, 2026-11-12).
 *
 * En escritorio la foto marca el alto MÍNIMO de la fila: esta envoltura solo aporta a la fila su
 * mínimo (`contain: size` en el CSS: unas líneas, «Leer más» y el alto real de los botones), así
 * que la descripción se recorta en lo que deje la foto, y si los botones no caben, la tarjeta crece. En tablet y móvil
 * la descripción se recorta a unas líneas. Si el texto no cabe, sale «Leer más», que la despliega
 * entera (y «Leer menos» la vuelve a plegar).
 *
 * Es de cliente solo para eso: saber si el texto se corta depende del ancho, del alto de la foto y
 * de la fuente. Se mide al montar, al cambiar el tamaño y al llegar Inter. El texto entero está
 * siempre en el HTML (buscadores y lectores de pantalla). Sin JavaScript no se recorta nada
 * (`<noscript>`).
 */
export function DescripcionPlegable({
  descripcion,
  reserva,
  claseTexto,
  botones,
}: {
  /** La descripción ya pintada; `null` sin descripción (solo los botones). */
  descripcion: ReactNode | null;
  /** Su texto plano: la copia invisible que fija el alto mientras llega Inter (CLS). */
  reserva: string;
  /** Clases tipográficas del texto. */
  claseTexto: string;
  botones: ReactNode;
}) {
  const id = useId();
  const envolturaRef = useRef<HTMLDivElement>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const abiertoRef = useRef(false);
  const [cortado, setCortado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  /*
   * EL ALTO REAL DE LOS BOTONES (tanda 24, BUG-005): el mínimo de la envoltura (`contain: size`)
   * suponía una sola fila de 60 px. Cuando no caben uno al lado del otro (columna estrecha, zoom,
   * letra grande) bajan a dos filas, y «Habla con un experto» se salía por abajo de la tarjeta, que
   * lo cortaba. Ahora el mínimo lleva su alto medido (`--alto-botones`); sin JavaScript, la
   * envoltura no se contiene (`<noscript>`).
   */
  useEffect(() => {
    const envoltura = envolturaRef.current;
    const botones = envoltura?.lastElementChild;
    if (!envoltura || !(botones instanceof HTMLElement) || botones === cajaRef.current) return;
    const medir = () =>
      envoltura.style.setProperty("--alto-botones", `${Math.ceil(botones.offsetHeight)}px`);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(botones);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const caja = cajaRef.current;
    const cuerpo = cuerpoRef.current;
    if (!caja || !cuerpo) return;
    const medir = () => {
      // Desplegada no se corta nada: se mantiene lo medido al plegarla.
      if (abiertoRef.current) return;
      // El cuerpo, no la caja: la copia de la reserva puede medir algo más que el texto.
      setCortado(cuerpo.scrollHeight > caja.clientHeight + 1);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(caja);
    observador.observe(cuerpo);
    void document.fonts?.ready.then(medir);
    return () => observador.disconnect();
  }, []);

  const alternar = () => {
    abiertoRef.current = !abiertoRef.current;
    setAbierto(abiertoRef.current);
    if (!abiertoRef.current) cajaRef.current?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div
      ref={envolturaRef}
      className={nueva.envoltura}
      data-con-descripcion={descripcion ? "" : undefined}
      data-cortado={cortado && !abierto ? "" : undefined}
      data-abierto={abierto ? "" : undefined}
    >
      <noscript>
        <style>{`.${nueva.envoltura}{contain:none!important}.${nueva.descripcion}{max-height:none!important}`}</style>
      </noscript>
      {descripcion ? (
        <div
          ref={cajaRef}
          id={id}
          className={`${nueva.descripcion} ${nueva.reserva} ${claseTexto}`}
          data-reserva={reserva}
          // Plegada a propósito, con «Leer más»: el test de desbordes no la cuenta como cortada.
          data-qa-recorte=""
        >
          <div ref={cuerpoRef} className={nueva.cuerpoDescripcion}>
            {descripcion}
          </div>
        </div>
      ) : null}
      {/* La ranura está siempre: si el botón apareciera de golpe al medir, movería los botones (CLS). */}
      {descripcion ? (
        <div className={nueva.ranuraLeerMas}>
          {cortado || abierto ? (
            <button
              type="button"
              className={`${nueva.leerMas} texto-etiqueta`}
              aria-expanded={abierto}
              aria-controls={id}
              onClick={alternar}
            >
              {abierto ? "Leer menos" : "Leer más"}
              <span className="sr-only"> de la descripción</span>
            </button>
          ) : null}
        </div>
      ) : null}
      {botones}
    </div>
  );
}
