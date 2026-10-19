"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./indiceEditorial.module.css";

/**
 * LA FOTO QUE SIGUE AL CURSOR en la cabecera «Índice editorial».
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): depende del puntero. Solo
 * se activa con ratón fino («hover» y «pointer: fine») y sin «reducir
 * movimiento»; entonces marca la sección (`data-con-cursor`) para que las
 * miniaturas se vuelvan transparentes (sin dejar de ocupar su sitio: sin CLS).
 *
 * - Ratón: la foto de la marca del nombre que se pisa, junto al cursor (con
 *   `transform`, un fotograma por movimiento).
 * - Teclado: al enfocar un nombre, la foto aparece a su derecha.
 * - Las fotos (a 360 px) solo se descargan en escritorio: el contenedor está
 *   oculto en táctil, y una imagen diferida oculta no se pide.
 */
export function FotoQueSigue({ fotos }: { fotos: { id: number; foto: ImagenLista }[] }) {
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = capa.current;
    const seccion = el?.closest<HTMLElement>("[data-indice-marcas]");
    if (!el || !seccion) return;
    const fino = matchMedia("(hover: hover) and (pointer: fine)");
    const reducido = matchMedia("(prefers-reduced-motion: reduce)");
    if (!fino.matches || reducido.matches) return;
    seccion.dataset.conCursor = "";

    let frame = 0;
    let x = 0;
    let y = 0;
    const colocar = () => {
      frame = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const mostrar = (id: string | undefined) => {
      for (const f of el.querySelectorAll<HTMLElement>("[data-foto]")) {
        if (f.dataset.foto === id) f.dataset.visible = "";
        else delete f.dataset.visible;
      }
      if (id) el.dataset.activa = "";
      else delete el.dataset.activa;
    };
    const entrada = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>("[data-marca]") : null;

    const mover = (e: PointerEvent) => {
      const a = entrada(e.target);
      mostrar(a?.dataset.marca);
      // A la derecha y por encima del cursor, sin tapar el nombre.
      x = e.clientX + 28;
      y = e.clientY - el.offsetHeight / 2;
      if (!frame) frame = requestAnimationFrame(colocar);
    };
    const salir = () => mostrar(undefined);
    const foco = (e: FocusEvent) => {
      const a = entrada(e.target);
      if (!a || !a.matches(":focus-visible")) return;
      const r = a.getBoundingClientRect();
      x = Math.min(innerWidth - el.offsetWidth - 16, r.left + r.width * 0.6);
      y = r.top + r.height / 2 - el.offsetHeight / 2;
      colocar();
      mostrar(a.dataset.marca);
    };
    const desenfoque = () => mostrar(undefined);

    const lista = seccion.querySelector("ol");
    lista?.addEventListener("pointermove", mover);
    lista?.addEventListener("pointerleave", salir);
    lista?.addEventListener("focusin", foco);
    lista?.addEventListener("focusout", desenfoque);
    addEventListener("scroll", salir, { passive: true });
    return () => {
      lista?.removeEventListener("pointermove", mover);
      lista?.removeEventListener("pointerleave", salir);
      lista?.removeEventListener("focusin", foco);
      lista?.removeEventListener("focusout", desenfoque);
      removeEventListener("scroll", salir);
      if (frame) cancelAnimationFrame(frame);
      delete seccion.dataset.conCursor;
    };
  }, []);

  return (
    <div ref={capa} className={estilos.capa} aria-hidden="true">
      {fotos.map(({ id, foto }) => (
        <div key={id} className={estilos.capaFoto} data-foto={String(id)}>
          <Image
            src={foto.url}
            alt=""
            fill
            sizes="360px"
            className={estilos.capaImg}
            style={{ objectPosition: foto.posicion }}
          />
        </div>
      ))}
    </div>
  );
}
