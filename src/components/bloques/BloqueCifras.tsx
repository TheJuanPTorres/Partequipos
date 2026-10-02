import type { VistaCifras as Datos } from "@/lib/bloques/vista";

import { Revelado } from "@/components/movimiento/Revelado";

import { Contador } from "./Contador";
import estilos from "./cifras.module.css";

/**
 * BLOQUE «CIFRAS» — tres números que cuentan con su etiqueta (Nosotros de
 * ux-9, contenedor `24d1a631`). Componente de SERVIDOR: lo que se mueve
 * (contador y revelado) son islas de cliente.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-nosotros.md §4):
 * - D1: la etiqueta es un `<p>`, no un `<h2>`: no es un título de sección.
 * - Va como lista: el lector anuncia «lista, 3 elementos».
 */
export function BloqueCifras({ cifras }: Datos) {
  if (cifras.length === 0) return null;
  return (
    <section className={estilos.seccion} aria-label="Partequipos en cifras">
      <ul className={estilos.lista}>
        {cifras.map((c, i) => (
          <li key={c.id ?? i} className={estilos.cifra}>
            <Contador numero={c.numero} prefijo={c.prefijo} sufijo={c.sufijo} />
            <Revelado
              como="p"
              texto={c.etiqueta}
              className={`${estilos.etiqueta} texto-destacado-negrita`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
