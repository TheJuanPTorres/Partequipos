import { Revelado } from "@/components/movimiento/Revelado";

import estilos from "./franjaServicios.module.css";

/**
 * FRANJA «Maquinaria pesada · Servicio técnico · Repuestos de calidad» de la
 * plantilla de Andrés de la marca de aditamentos (elementor 4020, 2026-10-20):
 * tres textos revelados por palabras, separados por una línea roja. En el export
 * el tercero va en Geist 16 px normal y los otros dos en 20 px negrita: se pintan
 * los tres iguales (errata, anotada para Andrés).
 *
 * Componente de SERVIDOR (el revelado es el único cliente). Lista, no
 * encabezados: no abren sección.
 */
export function FranjaServicios({ textos }: { textos: readonly string[] }) {
  const lista = textos.map((t) => t.trim()).filter(Boolean);
  if (lista.length === 0) return null;
  return (
    <section className={estilos.franja} aria-label="Lo que ofrecemos">
      <ul className={estilos.lista}>
        {lista.map((t) => (
          <li key={t} className={estilos.item}>
            <Revelado como="span" ritmo="titulo" texto={t} className={estilos.texto} />
          </li>
        ))}
      </ul>
    </section>
  );
}
