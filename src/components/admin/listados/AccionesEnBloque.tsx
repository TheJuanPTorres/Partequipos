"use client";

import { useConfig, useSelection } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ACCIONES_EN_BLOQUE, type AccionEnBloque } from "@/lib/panel/accionesEnBloque";

/**
 * CAMBIOS EN BLOQUE (tanda 21, tarea 3, fase 2): encima de la lista, con fichas marcadas, botones
 * para mostrarlas u ocultarlas en la web (y, en usadas, marcarlas vendidas o disponibles). Pide
 * confirmación en la propia barra (sin ventanas del navegador) y hace UNA petición a la API con la
 * selección de la lista; al terminar, avisa y recarga la lista. La lógica de qué botones van en
 * cada colección, en `src/lib/panel/accionesEnBloque.ts`.
 */
export default function AccionesEnBloque({ coleccion }: { coleccion: string }) {
  const { count, getQueryParams } = useSelection();
  const { config } = useConfig();
  const router = useRouter();
  const [pendiente, setPendiente] = useState<AccionEnBloque | null>(null);
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const acciones = ACCIONES_EN_BLOQUE[coleccion] ?? [];

  if (acciones.length === 0) return null;
  if (count === 0 && !estado) return null;

  async function hacer(accion: AccionEnBloque) {
    setOcupado(true);
    setEstado(null);
    const n = count;
    try {
      const respuesta = await fetch(
        `${config.serverURL}${config.routes.api}/${coleccion}${getQueryParams()}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accion.datos),
        },
      );
      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        docs?: unknown[];
        errors?: unknown[];
      };
      const fallidas = cuerpo.errors?.length ?? 0;
      if (!respuesta.ok && !cuerpo.docs?.length) throw new Error(String(respuesta.status));
      setEstado(
        fallidas
          ? {
              tipo: "error",
              texto: `${accion.hecho(n - fallidas)} ${fallidas} no se pudieron cambiar.`,
            }
          : { tipo: "ok", texto: accion.hecho(n) },
      );
      router.refresh();
    } catch {
      setEstado({ tipo: "error", texto: "No se pudo hacer el cambio. Inténtalo de nuevo." });
    } finally {
      setOcupado(false);
      setPendiente(null);
    }
  }

  return (
    <div className="pq-en-bloque" role="region" aria-label="Cambios en bloque">
      {count > 0 ? (
        pendiente ? (
          <>
            <span>{pendiente.pregunta(count)}</span>
            <button
              type="button"
              className="pq-en-bloque__boton pq-en-bloque__boton--si"
              disabled={ocupado}
              onClick={() => hacer(pendiente)}
            >
              {ocupado ? "Cambiando…" : "Sí, hacerlo"}
            </button>
            <button
              type="button"
              className="pq-en-bloque__boton"
              disabled={ocupado}
              onClick={() => setPendiente(null)}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <span>{count === 1 ? "1 seleccionada:" : `${count} seleccionadas:`}</span>
            {acciones.map((a) => (
              <button
                key={a.clave}
                type="button"
                className="pq-en-bloque__boton"
                onClick={() => {
                  setEstado(null);
                  setPendiente(a);
                }}
              >
                {a.texto}
              </button>
            ))}
          </>
        )
      ) : null}
      {estado ? (
        <span role="status" className={`pq-en-bloque__estado pq-en-bloque__estado--${estado.tipo}`}>
          {estado.texto}
        </span>
      ) : null}
    </div>
  );
}
