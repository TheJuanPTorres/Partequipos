"use client";

import { useFormFields } from "@payloadcms/ui";

import { esquemaDelMenu, filasDesdeCampos, type LineaEsquema } from "@/lib/cabecera/arbol";

/**
 * VISTA PREVIA DEL MENÚ, EN ESQUEMA (tanda 25, tarea 2; campo `ui`: no guarda nada). Con lo que
 * hay escrito en «Enlaces del menú» —también antes de guardar—, el árbol de lo que saldrá en la
 * cabecera: cada fila de la barra, sus apartados y los enlaces de cada grupo. Lo que no sale va
 * tachado, con el motivo. Las listas automáticas se llenan con el catálogo: aquí solo se nombra
 * su fuente; el menú real se ve en el sitio al guardar.
 */
export default function EsquemaMenu() {
  // El formulario llega plano; se pasa como texto para que el componente solo se repinte cuando
  // cambia algo de «Enlaces del menú».
  const texto = useFormFields(([campos]) =>
    JSON.stringify(
      esquemaDelMenu(
        filasDesdeCampos(
          Object.fromEntries(
            Object.entries(campos)
              .filter(([ruta]) => ruta.startsWith("enlaces."))
              .map(([ruta, campo]) => [ruta, campo?.value]),
          ),
        ),
      ),
    ),
  );
  const lineas = JSON.parse(texto) as LineaEsquema[];

  return (
    <section className="pq-esquema-menu" aria-labelledby="pq-esquema-menu-titulo">
      <h3 id="pq-esquema-menu-titulo">Vista previa del menú (esquema)</h3>
      <p className="pq-esquema-menu__nota">
        Así queda el menú con lo escrito arriba, también antes de guardar. Lo tachado no sale. Las
        listas automáticas se llenan solas con el catálogo.
      </p>
      {lineas.length === 0 ? (
        <p>Aún no hay ninguna fila en «Enlaces del menú».</p>
      ) : (
        <ul>
          {lineas.map((l, i) => (
            <li key={i} data-nivel={l.nivel} data-sale={l.sale ? "si" : "no"}>
              <span className="pq-esquema-menu__texto">{l.texto}</span>
              <span className="pq-esquema-menu__detalle">{l.detalle}</span>
              {!l.sale ? (
                <span className="pq-esquema-menu__motivo">
                  No sale{l.motivo ? `: ${l.motivo}` : ""}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
