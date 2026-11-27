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
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import estilos from "./ficha.module.css";
import { encajeDeFoto, sizesDeFoto, teclaGaleria, type FotoFicha } from "@/lib/ficha/sizesGaleria";

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

export type { FotoFicha };

const INTERVALO_MS = 5000;
const MINIATURAS_VISIBLES = 3;

/** La foto grande de la ficha de usados (medido: 586 px a 1440, 41vw). */
const SIZES_FOTO = "(min-width: 1025px) 41vw, (min-width: 768px) 88vw, 85vw";

export function GaleriaFicha({
  fotos,
  nombre,
  sinFondo = false,
  sizesFoto = SIZES_FOTO,
}: {
  fotos: FotoFicha[];
  nombre: string;
  /** Lo que pinta la foto grande. Hasta 1024 px la caja es 4:3 (`sizesDeFoto` ajusta las 3:2). */
  sizesFoto?: string;
  /** Sin el fondo desenfocado de la tarjeta (ficha de maquinaria nueva, fondo neutro). */
  sinFondo?: boolean;
}) {
  const [actual, setActual] = useState(0);
  // Arranca en reproducción (dirección, 2026-10-17); con una sola foto, nada.
  const [reproduciendo, setReproduciendo] = useState(fotos.length > 1);
  // Pausas que no tocan el botón: ratón encima, foco de teclado y galería fuera de la vista.
  const [encima, setEncima] = useState(false);
  const [conFoco, setConFoco] = useState(false);
  const [enVista, setEnVista] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const botonCompleta = useRef<HTMLButtonElement>(null);
  const inicioToque = useRef<number | null>(null);
  const inicioToquePantalla = useRef<number | null>(null);
  const region = useRef<HTMLDivElement>(null);
  const total = fotos.length;

  const carril = useRef<HTMLUListElement>(null);
  const [hayAnteriores, setHayAnteriores] = useState(false);
  const [haySiguientes, setHaySiguientes] = useState(total > MINIATURAS_VISIBLES);
  const conFlechas = total > MINIATURAS_VISIBLES;

  const ir = useCallback((i: number) => setActual(((i % total) + total) % total), [total]);

  // Con «reducir movimiento» no avanza sola.
  const reducido = useSyncExternalStore(
    (aviso) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", aviso);
      return () => m.removeEventListener("change", aviso);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    const el = raiz.current;
    if (!el || total < 2) return;
    const o = new IntersectionObserver(([e]) => setEnVista(!!e?.isIntersecting), {
      threshold: 0.4,
    });
    o.observe(el);
    return () => o.disconnect();
  }, [total]);

  const sonando = reproduciendo && !reducido;
  const avanzando = sonando && total > 1 && enVista && !encima && !conFoco;
  useEffect(() => {
    if (!avanzando) return;
    const t = window.setTimeout(() => setActual((i) => (i + 1) % total), INTERVALO_MS);
    return () => window.clearTimeout(t);
  }, [avanzando, actual, total]);

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
    setReproduciendo(false);
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
      {sinFondo ? null : (
        <div className={estilos.fondoDesenfocado} aria-hidden="true">
          <Image
            key={foto.url}
            src={foto.url}
            alt=""
            fill
            sizes="max(64px, 4vw)"
            className={estilos.fondoFoto}
          />
        </div>
      )}

      <div
        ref={raiz}
        className={estilos.galeria}
        onPointerEnter={(e) => e.pointerType === "mouse" && setEncima(true)}
        onPointerLeave={() => setEncima(false)}
        onFocus={(e) => setConFoco(e.target.matches(":focus-visible"))}
        onBlur={() => setConFoco(false)}
        /*
         * Flechas ←/→ (y Inicio/Fin) con el foco DENTRO de la galería: la foto, las miniaturas o
         * sus botones (tanda 26, t3; patrón de carrusel accesible). Nunca en toda la página, y con
         * una sola foto, nada.
         */
        onKeyDown={(e) => {
          const destino = teclaGaleria(e.key, actual, total, e.altKey || e.ctrlKey || e.metaKey);
          if (destino === null) return;
          e.preventDefault();
          setReproduciendo(false);
          ir(destino);
        }}
      >
        <div
          ref={region}
          className={estilos.visor}
          role="region"
          aria-roledescription="carrusel"
          aria-label={`Fotos de ${nombre}`}
          // Enfocable: las flechas funcionan con la foto, y al hacer clic en ella queda enfocada.
          tabIndex={total > 1 ? 0 : undefined}
          onPointerDown={(e) => {
            inicioToque.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (inicioToque.current === null) return;
            const dx = e.clientX - inicioToque.current;
            inicioToque.current = null;
            if (Math.abs(dx) > 40) {
              setReproduciendo(false);
              ir(actual + (dx < 0 ? 1 : -1));
            } else if (total > 1 && !(e.target as Element).closest("button")) {
              region.current?.focus({ preventScroll: true });
            }
          }}
        >
          <ul
            className={estilos.pista}
            style={{ transform: `translateX(-${actual * 100}%)` }}
            // Con las fotos pasando solas, sin anunciar; quietas, se anuncia la que entra.
            aria-live={sonando ? "off" : "polite"}
          >
            {fotos.map((f, i) => (
              <li
                key={f.url}
                className={estilos.diapositiva}
                inert={i !== actual}
                aria-roledescription="diapositiva"
                aria-label={`${i + 1} de ${total}`}
              >
                {/*
                  Una foto que no cabe en la caja sin perder más del 15 % (vertical, cuadrada,
                  16:9) va ENTERA sobre la misma foto desenfocada; las demás la cubren con su
                  punto focal (tanda 25, t5).
                */}
                {encajeDeFoto(f) === "entera" ? (
                  <Image
                    src={f.url}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="max(64px, 4vw)"
                    className={estilos.fondoDiapositiva}
                  />
                ) : null}
                <Image
                  src={f.url}
                  alt={f.alt}
                  fill
                  priority={i === 0}
                  sizes={sizesDeFoto(sizesFoto, f)}
                  className={
                    encajeDeFoto(f) === "entera"
                      ? `${estilos.fotoVisor} ${estilos.fotoEntera}`
                      : estilos.fotoVisor
                  }
                  style={f.posicion ? { objectPosition: f.posicion } : undefined}
                />
              </li>
            ))}
          </ul>
          {/* El WhatsApp flotante esquiva los controles y las miniaturas (tanda 24, t7). */}
          <div className={estilos.controlesVisor} data-evita-flotante="">
            {total > 1 ? (
              <button
                type="button"
                className={estilos.controlVisor}
                onClick={() => setReproduciendo((r) => !r)}
                aria-label={sonando ? "Pausar las fotos" : "Pasar las fotos solas"}
              >
                {sonando ? (
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
          <div
            className={estilos.miniaturas}
            role="group"
            aria-label="Elegir foto"
            data-evita-flotante=""
          >
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
                      sizes="(max-width: 767px) 30vw, max(180px, 11.25vw)"
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
        // Flechas del teclado: foto anterior y siguiente (tanda 22, punto 31). Escape ya lo
        // cierra el propio <dialog>. Con una sola foto no hay adónde ir.
        onKeyDown={(e) => {
          const destino = teclaGaleria(e.key, actual, total, e.altKey || e.ctrlKey || e.metaKey);
          if (destino === null) return;
          e.preventDefault();
          ir(destino);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}
      >
        {/*
          PANTALLA COMPLETA (tanda 26, t3): la foto ocupa todo lo que puede de la pantalla sin
          recortarse (`contain`), pedida a todo el ancho; los controles van SOBRE la foto, con
          fondo oscuro para leerse sobre cualquier foto. Se pasa también deslizando el dedo.
        */}
        <div
          className={estilos.pantallaMarco}
          onPointerDown={(e) => {
            inicioToquePantalla.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (inicioToquePantalla.current === null) return;
            const dx = e.clientX - inicioToquePantalla.current;
            inicioToquePantalla.current = null;
            if (total > 1 && Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1));
          }}
        >
          <Image
            key={foto.url}
            src={foto.url}
            alt={foto.alt}
            fill
            sizes="100vw"
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
              <p className={estilos.contadorPantalla} aria-live="polite">
                {actual + 1} / {total}
              </p>
            </>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
