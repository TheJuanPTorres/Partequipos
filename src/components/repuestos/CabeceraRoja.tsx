import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import type { BreadcrumbItem } from "@/lib/seo/jsonLd";

import estilos from "./baldosasColor.module.css";

/**
 * CABECERA ROJA de los índices de marcas (la de `BaldosasColorMarcas`, #417 y #423), suelta: el
 * mismo rojo, la misma tipografía y las mismas esquinas, con las MIGAS visibles encima del `<h1>`.
 * La usa la categoría técnica «Lubricantes», la del selector de marcas (Juan Pablo, 2026-11-04):
 * sin foto, sin texto de presentación y sin icono del ratón, y más baja que la de los índices
 * (300 px desde 768; en móvil, lo que pida el título).
 *
 * Sin desplazamiento al llegar Inter: las migas, el antetítulo y el título reservan su alto con una
 * copia invisible en la fuente de respaldo (la técnica de la cabecera del artículo).
 */
export function CabeceraRoja({
  migas,
  antetitulo,
  titulo,
}: {
  migas: BreadcrumbItem[];
  antetitulo: string;
  titulo: string;
}) {
  return (
    <div className={estilos.marcoCabecera}>
      <header className={`${estilos.cabecera} ${estilos.cabeceraBaja}`}>
        <nav
          aria-label="Ruta de navegación"
          className={`${estilos.migasRojas} ${estilos.reservada}`}
          data-reserva={migas.map((m) => m.nombre).join("   /   ")}
        >
          <ol>
            {migas.map((m, i) =>
              i === migas.length - 1 ? (
                <li key={m.path} aria-current="page">
                  {m.nombre}
                </li>
              ) : (
                <li key={m.path}>
                  <Link href={`${m.path.replace(/\/$/, "")}/`}>{m.nombre}</Link>
                </li>
              ),
            )}
          </ol>
        </nav>
        <h1 className={estilos.h1}>
          <span className={`${estilos.antetitulo} ${estilos.reservada}`} data-reserva={antetitulo}>
            <span>{antetitulo}</span>
          </span>{" "}
          <span className={`${estilos.titulo} ${estilos.reservada}`} data-reserva={titulo}>
            <Revelado como="span" alCargar ritmo="titulo" texto={titulo} />
          </span>
        </h1>
      </header>
    </div>
  );
}
