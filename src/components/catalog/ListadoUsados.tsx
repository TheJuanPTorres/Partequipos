import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Ordenar } from "@/components/catalog/filtros/Ordenar";
import { Paginacion } from "@/components/catalog/filtros/Paginacion";
import { PanelFiltros } from "@/components/catalog/filtros/PanelFiltros";
import { SeleccionActual } from "@/components/catalog/filtros/SeleccionActual";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  chipsDe,
  conConsulta,
  enlaceCon,
  ordenesDe,
  valoresElegidos,
  type ResultadoListado,
} from "@/lib/filtros";
import type { UnidadUsada } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import type { Ambito } from "@/lib/usados/listado";
import { posicionFocal } from "@/lib/utils/relations";

/**
 * Ancho con el que se piden las miniaturas de las tarjetas (ver el `<Image>`).
 * Con `object-contain` en 160 px de alto, una foto 4:3 se pinta a ~213 px de
 * ancho en todos los tamaños. Con 256, el srcset de 1x/2x sale de 256 y 640 px:
 * basta para una pantalla de densidad 3. Con 400 salía de 640 y 828, unas 3
 * veces de más en escritorio (medido en el sitio publicado, 2026-10-14).
 */
const ANCHO_MINIATURA = 256;

/**
 * El listado de maquinaria USADA de una categoría o de una marca, una página
 * cada vez, con los filtros del módulo común (`src/lib/filtros/`, componentes
 * en `./filtros/`). Lo comparten la página 1 (la URL del registro) y
 * `…/pagina/<n>/` (`src/lib/usados/listado.ts`).
 *
 * Aquí sí se renderiza el inventario: las unidades no tienen URL propia
 * (ADR 0007), así que esta ruta es su único escaparate. Solo se listan las
 * disponibles; las vendidas se marcan, no se borran.
 */
export function ListadoUsados({
  ambito,
  pagina,
  listado,
}: {
  ambito: Ambito;
  pagina: number;
  listado: Extract<ResultadoListado<UnidadUsada>, { tipo: "listado" }>;
}) {
  const {
    elementos: unidades,
    total,
    totalSinFiltros,
    paginas,
    seleccion,
    facetas,
    consulta,
  } = listado;
  const { registro, catalogo } = ambito;
  const rutaDe = (n: number) => `${ambito.ruta(n)}/`;
  const rutaBase = rutaDe(1);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Usada", path: rutas.usada() },
    { nombre: registro.nombre, path: ambito.ruta(1) },
  ];
  if (pagina > 1) {
    breadcrumbs.push({ nombre: `Página ${pagina}`, path: ambito.ruta(pagina) });
  }
  // Sin ninguna unidad (no por los filtros): un estado vacío amable en lugar
  // de «0 unidades disponibles», con el camino a contactar.
  const sinUnidades = totalSinFiltros === 0;
  const vacio =
    ambito.tipo === "categoria"
      ? "Por ahora no hay unidades disponibles en esta categoría"
      : "Por ahora no hay unidades disponibles de esta marca";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">
        {ambito.titulo}
        {pagina > 1 ? <span className="font-normal text-gray-600"> · página {pagina}</span> : null}
      </h1>

      {registro.descripcion ? (
        <p className="mt-3 max-w-2xl text-gray-600">{registro.descripcion}</p>
      ) : null}

      {ambito.enlaces.length ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {ambito.enlaces.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="text-gray-900 underline underline-offset-2">
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 gap-8 lg:grid lg:grid-cols-[15rem_1fr]">
        {totalSinFiltros > 0 ? (
          <aside aria-label="Filtros">
            <PanelFiltros
              accion={rutaBase}
              facetas={facetas}
              orden={seleccion.orden}
              ordenPorDefecto={catalogo.ordenes[0].valor}
              activos={valoresElegidos(seleccion)}
            />
          </aside>
        ) : null}

        <section aria-labelledby="unidades-heading" className="mt-6 lg:col-start-2 lg:mt-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="unidades-heading" className="text-xl font-medium text-gray-900">
              {sinUnidades
                ? vacio
                : listado.filtrado && total !== totalSinFiltros
                  ? `${total} de ${totalSinFiltros} ${totalSinFiltros === 1 ? "unidad disponible" : "unidades disponibles"}`
                  : `${total} ${total === 1 ? "unidad disponible" : "unidades disponibles"}`}
              {paginas > 1 ? (
                <span className="font-normal text-gray-600">
                  {" "}
                  · página {pagina} de {paginas}
                </span>
              ) : null}
            </h2>
            {total > 1 ? <Ordenar opciones={ordenesDe(rutaBase, catalogo, seleccion)} /> : null}
          </div>

          <div className="mt-3">
            <SeleccionActual
              chips={chipsDe(rutaBase, catalogo, seleccion, facetas)}
              limpiar={enlaceCon(rutaBase, catalogo, seleccion, { limpiar: true })}
            />
          </div>

          {sinUnidades ? (
            <div className="mt-4 rounded border border-dashed border-gray-300 p-6 text-center text-gray-600">
              <p>
                El inventario cambia con frecuencia. Cuéntanos qué máquina buscas y te avisamos
                cuando entre una.
              </p>
              <Link
                href="/contactanos/"
                className="mt-3 inline-block font-medium text-gray-900 underline underline-offset-2"
              >
                Contáctanos
              </Link>
            </div>
          ) : unidades.length === 0 ? (
            <p className="mt-4 rounded border border-dashed border-gray-300 p-6 text-center text-gray-600">
              Ninguna unidad cumple estos filtros. Quita alguno para ver más.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {unidades.map((unidad) => (
                <TarjetaUsada key={unidad.id} unidad={unidad} />
              ))}
            </ul>
          )}

          <Paginacion
            actual={pagina}
            total={paginas}
            hrefDe={(n) => conConsulta(rutaDe(n), consulta)}
          />
        </section>
      </div>
    </main>
  );
}

function TarjetaUsada({ unidad }: { unidad: UnidadUsada }) {
  const { foto } = unidad;
  return (
    <li className="rounded-lg border border-gray-200 p-4">
      {foto?.url && foto.width && foto.height ? (
        <Image
          src={foto.url}
          alt={foto.alt || unidad.nombre}
          // Ancho de MINIATURA, no el original: el srcset de 1x/2x sale de aquí
          // (256 y 640 px), y la tarjeta pinta la foto a ~213 × 160 px. Con el
          // ancho original pedía hasta 4 veces de más; con
          // `sizes`, cada tarjeta llevaba 12 anchos en el srcset y el HTML del
          // listado crecía ~65 % (medido en el preview, 2026-10-13).
          width={ANCHO_MINIATURA}
          height={Math.round((ANCHO_MINIATURA * foto.height) / foto.width)}
          className="mb-3 h-40 w-full object-contain"
          style={{ objectPosition: posicionFocal(foto.focalX, foto.focalY) }}
        />
      ) : null}

      <h3 className="font-medium text-gray-900">{unidad.nombre}</h3>

      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        {unidad.anio ? (
          <div className="flex gap-1">
            <dt className="font-medium">Año:</dt>
            <dd>{unidad.anio}</dd>
          </div>
        ) : null}
        {typeof unidad.horometro === "number" ? (
          <div className="flex gap-1">
            <dt className="font-medium">Horómetro:</dt>
            <dd>{unidad.horometro.toLocaleString("es-CO")} h</dd>
          </div>
        ) : null}
        {typeof unidad.pesoOperativo === "number" ? (
          <div className="flex gap-1">
            <dt className="font-medium">Peso:</dt>
            <dd>{unidad.pesoOperativo.toLocaleString("es-CO")} t</dd>
          </div>
        ) : null}
        {unidad.ubicacion ? (
          <div className="flex gap-1">
            <dt className="font-medium">Ubicación:</dt>
            <dd>{unidad.ubicacion}</dd>
          </div>
        ) : null}
      </dl>

      {unidad.descripcion ? (
        <p className="mt-2 text-sm text-gray-700">{unidad.descripcion}</p>
      ) : null}
    </li>
  );
}
