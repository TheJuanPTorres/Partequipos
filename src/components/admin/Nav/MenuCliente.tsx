"use client";

import { IconSearch } from "@tabler/icons-react";
import { Link } from "@payloadcms/ui";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { EVENTO_ABRIR_PALETA, PaletaComandos } from "@/components/admin/buscador/PaletaComandos";
import { coincide, type Comando } from "@/lib/panel/buscador";
import { entradaActiva } from "@/lib/panel/menu";

import { GrupoNav } from "./GrupoNav";

export type EntradaMenu = {
  /** Única en el menú (una colección puede salir dos veces: su lista y una entrada directa). */
  clave: string;
  href: string;
  id: string;
  label: string;
  /** Un número junto al nombre (las solicitudes nuevas). */
  contador?: number;
};

export type GrupoMenu = {
  abierto: boolean;
  entradas: EntradaMenu[];
  nombre: string;
};

/**
 * Lista de grupos y entradas del menú. Es la parte de cliente porque necesita la
 * ruta actual (`usePathname`) para marcar la página activa.
 *
 * Réplica deliberada de `DefaultNavClient` de Payload 3.88 en tres puntos, que
 * son los que se perderían al reemplazar el menú:
 *
 * 1. **Página activa:** misma comprobación que Payload
 *    (`startsWith` + siguiente carácter «/» o ninguno), para que
 *    `/collections/marcas` no se active estando en `/collections/marcas-lubricante`; y, desde
 *    las entradas directas (2026-11-18), una sola: la de href más largo (`entradaActiva`).
 * 2. **La barra indicadora** (`nav__link-indicator`) se pinta en la entrada
 *    activa: es lo que distingue la página actual del hover (docs/design-tokens.md,
 *    fase 3).
 * 3. **La entrada de la página actual NO es un enlace**, igual que en Payload: es
 *    un `div`. Un enlace a la página en la que ya estás es ruido para quien
 *    navega con teclado o lector.
 *
 * Las etiquetas y los enlaces llegan hechos del servidor (`Nav`), así que aquí no hace falta
 * `getTranslation` ni `formatAdminURL`.
 */
export function MenuCliente({
  grupos,
  acciones,
  buscables,
  admin,
  api,
}: {
  grupos: GrupoMenu[];
  /** «Crear …» de las colecciones en que puede crear quien mira (buscador Ctrl+K). */
  acciones: Comando[];
  /** Colecciones donde la paleta busca fichas. */
  buscables: string[];
  admin: string;
  api: string;
}) {
  const pathname = usePathname();
  const activa = entradaActiva(
    pathname,
    grupos.flatMap((g) => g.entradas),
  );

  // Filtro de texto del menú (tanda 23): por el nombre de la entrada o de su grupo, sin tildes.
  const [filtro, setFiltro] = useState("");
  const visibles = useMemo(
    () =>
      grupos
        .map((g) => ({
          ...g,
          entradas: g.entradas.filter((e) => coincide(`${e.label} ${g.nombre}`, filtro)),
        }))
        .filter((g) => g.entradas.length > 0),
    [grupos, filtro],
  );
  const filtrando = filtro.trim().length > 0;

  // Las secciones de la paleta son las mismas entradas del menú, con su grupo.
  const secciones: Comando[] = useMemo(
    () =>
      grupos.flatMap((g) =>
        g.entradas.map((e) => ({
          id: `seccion-${e.clave}`,
          tipo: "seccion" as const,
          etiqueta: e.label,
          contexto: g.nombre,
          href: e.href,
        })),
      ),
    [grupos],
  );

  return (
    <>
      <div className="pq-menu-busqueda">
        <button
          className="pq-menu-buscar"
          onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_PALETA))}
          type="button"
        >
          <IconSearch aria-hidden="true" size={16} />
          <span>Buscar en el panel</span>
          <kbd aria-label="atajo Control más K">Ctrl K</kbd>
        </button>
        <input
          aria-label="Filtrar el menú"
          className="pq-menu-filtro"
          onChange={(e) => setFiltro(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setFiltro("")}
          placeholder="Filtrar el menú"
          type="search"
          value={filtro}
        />
      </div>
      <PaletaComandos
        acciones={acciones}
        admin={admin}
        api={api}
        buscables={buscables}
        secciones={secciones}
      />
      {filtrando && visibles.length === 0 ? (
        <p className="pq-menu-vacio" role="status">
          Nada en el menú coincide con «{filtro.trim()}». Prueba con Ctrl+K: busca también fichas.
        </p>
      ) : null}
      {visibles.map((grupo) => (
        <GrupoNav
          abierto={grupo.abierto}
          forzarAbierto={filtrando}
          key={grupo.nombre}
          nombre={grupo.nombre}
        >
          {grupo.entradas.map((entrada) => {
            const contenido = (
              <>
                {entrada.clave === activa ? <div className="nav__link-indicator" /> : null}
                <span className="nav__link-label">{entrada.label}</span>
                {entrada.contador ? (
                  <span className="pq-nav-contador">
                    {entrada.contador}
                    <span className="sr-only"> sin atender</span>
                  </span>
                ) : null}
              </>
            );

            if (pathname === entrada.href) {
              return (
                <div className="nav__link" id={entrada.id} key={entrada.clave}>
                  {contenido}
                </div>
              );
            }

            return (
              <Link
                className="nav__link"
                href={entrada.href}
                id={entrada.id}
                key={entrada.clave}
                prefetch={false}
              >
                {contenido}
              </Link>
            );
          })}
        </GrupoNav>
      ))}
    </>
  );
}
