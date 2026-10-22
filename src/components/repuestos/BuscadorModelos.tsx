"use client";

import { IconSearch } from "@tabler/icons-react";
import { useEffect, useId, useState } from "react";

import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import {
  coincideModelo,
  columnaEscritorio,
  columnaTablet,
  normalizarBusqueda,
} from "@/lib/repuestos/buscarModelo";

import { AyudaModelo } from "./AyudaModelo";
import mejoras from "./mejoras.module.css";

/**
 * R1 (dirección, 2026-10-21): «Busca tu modelo» en la página de tipo de repuestos. Filtra las
 * tarjetas de la sección al escribir, sin distinguir mayúsculas, guiones ni espacios
 * (`normalizarBusqueda`), y enseña TODAS las coincidencias, también las que el recorte a 2
 * filas escondía. Dice cuántas hay (región `aria-live`) y, sin ninguna, ofrece R4.
 *
 * No toca el HTML de las tarjetas, que sigue siendo el del servidor: marca la sección con
 * `data-buscando`, cada tarjeta que coincide con `data-coincide` y cada serie sin ninguna con
 * `data-sin-coincidencias`; el CSS (`marca.module.css`) hace el resto. La última fila de los
 * resultados se centra como la regla de las tarjetas (#281) con `--col-e` y `--col-t`.
 *
 * Sin JavaScript no aparece (`@media (scripting: none)`): no podría filtrar nada.
 */
export function BuscadorModelos({
  seccion,
  ejemplo,
  ayuda,
}: {
  /** El `id` de la sección de modelos. */
  seccion: string;
  /** Un modelo del tipo para el texto de ayuda («p. ej. ZX200»). */
  ejemplo: string | null;
  /** R4 en el «sin resultados»; `null` si R4 está apagada. */
  ayuda: { formulario: ConfigFormulario; anclaContacto: string } | null;
}) {
  const id = useId();
  const [consulta, setConsulta] = useState("");
  const [encontrados, setEncontrados] = useState<number | null>(null);

  // Al salir de la página (navegación del cliente), la sección vuelve a como vino.
  useEffect(
    () => () => {
      const sec = document.getElementById(seccion);
      sec?.removeAttribute("data-buscando");
      sec?.querySelectorAll("ul").forEach(limpiar);
    },
    [seccion],
  );

  const aviso =
    encontrados === null
      ? ""
      : encontrados === 0
        ? `Ningún modelo coincide con «${consulta.trim()}».`
        : encontrados === 1
          ? "1 modelo coincide."
          : `${encontrados} modelos coinciden.`;

  return (
    <div className={mejoras.buscador} data-mejora="R1" role="search">
      <label htmlFor={id} className={mejoras.buscadorEtiqueta}>
        Busca tu modelo
      </label>
      <div className={mejoras.buscadorCaja}>
        <IconSearch aria-hidden="true" focusable="false" stroke={2} size={20} />
        <input
          id={id}
          type="search"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setEncontrados(filtrar(seccion, e.target.value));
          }}
          placeholder={ejemplo ? `p. ej. ${ejemplo}` : undefined}
          autoComplete="off"
          spellCheck={false}
          className={mejoras.buscadorCampo}
        />
      </div>
      <p className={mejoras.buscadorCuenta} aria-live="polite" aria-atomic="true">
        {aviso}
      </p>
      {encontrados === 0 && ayuda ? (
        <AyudaModelo
          formulario={ayuda.formulario}
          anclaContacto={ayuda.anclaContacto}
          className={mejoras.ayudaSinResultados}
        />
      ) : null}
    </div>
  );
}

function limpiar(ul: Element) {
  ul.closest("[data-grupo-modelos]")?.removeAttribute("data-sin-coincidencias");
  ul.querySelectorAll<HTMLLIElement>(":scope > li").forEach((li) => {
    li.removeAttribute("data-coincide");
    li.style.removeProperty("--col-e");
    li.style.removeProperty("--col-t");
  });
}

/** Marca la sección según lo escrito y devuelve cuántos modelos coinciden (`null`: sin consulta). */
function filtrar(seccion: string, consulta: string): number | null {
  const sec = document.getElementById(seccion);
  if (!sec) return null;
  const q = normalizarBusqueda(consulta);
  const listas = [...sec.querySelectorAll("ul")].filter((ul) =>
    ul.querySelector(":scope > li[data-buscar]"),
  );
  if (!q) {
    sec.removeAttribute("data-buscando");
    for (const ul of listas) limpiar(ul);
    return null;
  }
  sec.setAttribute("data-buscando", "");
  let total = 0;
  for (const ul of listas) {
    const lis = [...ul.querySelectorAll<HTMLLIElement>(":scope > li[data-buscar]")];
    const si = lis.filter((li) => coincideModelo(li.dataset.buscar ?? "", q));
    total += si.length;
    for (const li of lis) {
      li.toggleAttribute("data-coincide", si.includes(li));
      li.style.removeProperty("--col-e");
      li.style.removeProperty("--col-t");
    }
    si.forEach((li, i) => {
      const e = columnaEscritorio(i, si.length);
      const t = columnaTablet(i, si.length);
      if (e) li.style.setProperty("--col-e", e);
      if (t) li.style.setProperty("--col-t", t);
    });
    ul.closest("[data-grupo-modelos]")?.toggleAttribute("data-sin-coincidencias", si.length === 0);
  }
  return total;
}
