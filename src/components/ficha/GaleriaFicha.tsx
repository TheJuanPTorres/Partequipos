"use client";

import {
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconPlayerPause,
  IconPlayerPlay,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import estilos from "./ficha.module.css";

/**
 * GALERÍA DE LA FICHA (ux-9, ficha V2: `uc_slider_image` + `remote_tabs`).
 *
 * Por qué es de cliente: cambia de foto al pulsar una miniatura, se reproduce
 * sola si se pide y abre la foto a pantalla completa. Todas las fotos van en
 * el HTML (lo que ve Google); las que no se ven, `inert`.
 *
 * Lo que replica de lo pintado: foto grande con las miniaturas debajo
 * sincronizadas, los botones de reproducir y de pantalla completa arriba a la
 * izquierda, y el FONDO DESENFOCADO de la tarjeta, que sigue a la foto (en
 * ux-9 son copias desenfocadas a mano de cada foto; aquí es la misma foto a
 * 64 px con `filter: blur`, sin fichero aparte).
 *
 * Se aparta (docs/diseno/decisiones-ficha.md): los botones de reproducir y
 * pantalla completa se ven sobre cualquier foto (en ux-9 casi no se
 * distinguen), la miniatura activa lleva un borde rojo y se puede deslizar con
 * el dedo. Con movimiento reducido, los cambios son instantáneos.
 */

export type FotoFicha = { url: string; alt: string; width: number; height: number };

const INTERVALO_MS = 3000;
const MINIATURAS_VISIBLES = 3;

export function GaleriaFicha({ fotos, nombre }: { fotos: FotoFicha[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const botonCompleta = useRef<HTMLButtonElement>(null);
  const inicioToque = useRef<number | null>(null);
  const total = fotos.length;

  const carril = useRef<HTMLUListElement>(null);
  const [hayAnteriores, setHayAnteriores] = useState(false);
  const [haySiguientes, setHaySiguientes] = useState(total > MINIATURAS_VISIBLES);
  const conFlechas = total > MINIATURAS_VISIBLES;

  const ir = useCallback((i: number) => setActual(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (!reproduciendo || total < 2) return;
    const t = window.setInterval(() => setActual((i) => (i + 1) % total), INTERVALO_MS);
    return () => window.clearInterval(t);
  }, [reproduciendo, total]);

  const medirCarril = useCallback(() => {
    const c = carril.current;
    if (!c) return;
    setHayAnteriores(c.scrollLeft > 4);
    setHaySiguientes(c.scrollLeft + c.clientWidth < c.scrollWidth - 4);
  }, []);

  // Lleva el carril al grupo de 3 que contiene la miniatura `i` (solo en horizontal).
  const mostrarGrupo = useCallback((grupo: number) => {
    const c = carril.current;
    const li = c?.children[grupo * MINIATURAS_VISIBLES] as HTMLElement | undefined;
    if (!c || !li) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    c.scrollTo({ left: li.offsetLeft - 3, behavior: reducido ? "auto" : "smooth" });
  }, []);

  const pasarMiniaturas = (sentido: 1 | -1) => {
    const c = carril.current;
    if (!c) return;
    const li = c.children[0] as HTMLElement | undefined;
    const paso = li ? (li.offsetWidth + 10) * MINIATURAS_VISIBLES : c.clientWidth;
    const grupo = Math.round(c.scrollLeft / paso) + sentido;
    mostrarGrupo(Math.max(0, Math.min(grupo, Math.ceil(total / MINIATURAS_VISIBLES) - 1)));
  };

  // Al cambiar la foto grande, el carril muestra la miniatura activa.
  useEffect(() => {
    const c = carril.current;
    if (!c || total <= MINIATURAS_VISIBLES) return;
    const li = c.children[actual] as HTMLElement | undefined;
    if (!li) return;
    const visible =
      li.offsetLeft - 3 >= c.scrollLeft - 1 &&
      li.offsetLeft + li.offsetWidth <= c.scrollLeft + c.clientWidth + 4;
    if (!visible) mostrarGrupo(Math.floor(actual / MINIATURAS_VISIBLES));
  }, [actual, total, mostrarGrupo]);

  const abrir = () => {
    setReproduciendo(false);
    dialogo.current?.showModal();
  };
  const cerrar = () => {
    dialogo.current?.close();
    botonCompleta.current?.focus();
  };

  if (total === 0) return null;
  const foto = fotos[actual]!;

  return (
    <>
      {/* Fondo de toda la tarjeta: la foto actual, desenfocada. */}
      <div className={estilos.fondoDesenfocado} aria-hidden="true">
        <Image
          key={foto.url}
          src={foto.url}
          alt=""
          fill
          sizes="64px"
          className={estilos.fondoFoto}
        />
      </div>

      <div className={estilos.galeria}>
        <div
          className={estilos.visor}
          role="region"
          aria-roledescription="carrusel"
          aria-label={`Fotos de ${nombre}`}
          onPointerDown={(e) => {
            inicioToque.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (inicioToque.current === null) return;
            const dx = e.clientX - inicioToque.current;
            inicioToque.current = null;
            if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1));
          }}
        >
          <ul className={estilos.pista} style={{ transform: `translateX(-${actual * 100}%)` }}>
            {fotos.map((f, i) => (
              <li
                key={f.url}
                className={estilos.diapositiva}
                inert={i !== actual}
                aria-roledescription="diapositiva"
                aria-label={`${i + 1} de ${total}`}
              >
                <Image
                  src={f.url}
                  alt={f.alt}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1025px) 41vw, (min-width: 768px) 88vw, 85vw"
                  className={estilos.fotoVisor}
                />
              </li>
            ))}
          </ul>
          <div className={estilos.controlesVisor}>
            {total > 1 ? (
              <button
                type="button"
                className={estilos.controlVisor}
                onClick={() => setReproduciendo((r) => !r)}
                aria-label={reproduciendo ? "Pausar las fotos" : "Pasar las fotos solas"}
              >
                {reproduciendo ? (
                  <IconPlayerPause aria-hidden="true" stroke={2} />
                ) : (
                  <IconPlayerPlay aria-hidden="true" stroke={2} />
                )}
              </button>
            ) : null}
            <button
              ref={botonCompleta}
              type="button"
              className={estilos.controlVisor}
              onClick={abrir}
              aria-label="Ver la foto a pantalla completa"
            >
              <IconMaximize aria-hidden="true" stroke={2} />
            </button>
          </div>
        </div>

        {total > 1 ? (
          <div className={estilos.miniaturas} role="group" aria-label="Elegir foto">
            {conFlechas ? (
              <button
                type="button"
                className={estilos.flechaMiniaturas}
                onClick={() => pasarMiniaturas(-1)}
                disabled={!hayAnteriores}
                aria-label="Miniaturas anteriores"
              >
                <IconChevronLeft aria-hidden="true" stroke={2} />
              </button>
            ) : null}
            <ul ref={carril} className={estilos.carrilMiniaturas} onScroll={medirCarril}>
              {fotos.map((f, i) => (
                <li key={f.url}>
                  <button
                    type="button"
                    className={estilos.miniatura}
                    aria-current={i === actual ? "true" : undefined}
                    aria-label={`Ver la foto ${i + 1} de ${total}`}
                    onClick={() => {
                      setReproduciendo(false);
                      ir(i);
                    }}
                  >
                    <Image
                      src={f.url}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 30vw, 180px"
                      className={estilos.fotoMiniatura}
                    />
                  </button>
                </li>
              ))}
            </ul>
            {conFlechas ? (
              <button
                type="button"
                className={estilos.flechaMiniaturas}
                onClick={() => pasarMiniaturas(1)}
                disabled={!haySiguientes}
                aria-label="Miniaturas siguientes"
              >
                <IconChevronRight aria-hidden="true" stroke={2} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <dialog
        ref={dialogo}
        className={estilos.pantallaCompleta}
        aria-label={`Foto ${actual + 1} de ${total} de ${nombre}`}
        onClose={() => botonCompleta.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}
      >
        <div className={estilos.pantallaMarco}>
          <Image
            src={foto.url}
            alt={foto.alt}
            width={foto.width}
            height={foto.height}
            sizes="90vw"
            className={estilos.pantallaFoto}
          />
          <button
            type="button"
            className={`${estilos.controlPantalla} ${estilos.cerrarPantalla}`}
            onClick={cerrar}
            aria-label="Cerrar"
          >
            <IconX aria-hidden="true" stroke={2} />
          </button>
          {total > 1 ? (
            <>
              <button
                type="button"
                className={`${estilos.controlPantalla} ${estilos.anteriorPantalla}`}
                onClick={() => ir(actual - 1)}
                aria-label="Foto anterior"
              >
                <IconChevronLeft aria-hidden="true" stroke={2} />
              </button>
              <button
                type="button"
                className={`${estilos.controlPantalla} ${estilos.siguientePantalla}`}
                onClick={() => ir(actual + 1)}
                aria-label="Foto siguiente"
              >
                <IconChevronRight aria-hidden="true" stroke={2} />
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
