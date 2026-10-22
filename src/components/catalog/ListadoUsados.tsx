import { IconCalendar, IconClockHour4, IconWeight } from "@tabler/icons-react";
import Link from "next/link";

import { PlantillaListado } from "@/components/listado/PlantillaListado";
import { TarjetaListado } from "@/components/listado/TarjetaListado";
import type { ResultadoListado } from "@/lib/filtros";
import type { Animacion } from "@/lib/listado/animaciones";
import type { UnidadUsada } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import estilosListado from "@/components/listado/listado.module.css";
import { EstadoVacioUsados } from "@/components/usados/EstadoVacioUsados";
import type { Ambito, AvisoVacio, DatosVacio } from "@/lib/usados/listado";
import { AVISO_SIN_UNIDADES } from "@/lib/usados/vacia";

const numero = (n: number) => n.toLocaleString("es-CO");

/**
 * El listado de maquinaria USADA de una categoría o de una marca, una página
 * cada vez (`src/lib/usados/listado.ts`), con la MISMA plantilla que el de
 * nueva («Categoría secundaria» de ux-9; 2026-10-18, petición del cliente):
 * cabecera, filtros a la izquierda (en las categorías, con los botones de
 * categoría encima, `pestanasEnLateral`), ordenar, vista lista/rejilla y tarjetas con peso, año y horas.
 * Categorías, filtros, orden y paginación cambian solo el catálogo, sin recargar
 * (`navegacionCliente`, 2026-10-21); sin JavaScript, como siempre. Con las
 * animaciones encendidas en `src/lib/listado/animaciones.ts` (2026-10-21).
 * Las piezas son las comunes (`src/components/listado/`).
 *
 * Solo se listan las disponibles; las vendidas se marcan, no se borran. Sin
 * ninguna unidad, el AVISO PROVISIONAL («Por ahora no hay unidades
 * disponibles», con Contáctanos y WhatsApp) o, si el global «Páginas índice»
 * lo elige, el estado vacío diseñado (`EstadoVacioUsados`). Dirección,
 * 2026-10-19: en el sitio publicado solo van diseños de Andrés.
 */
export function ListadoUsados({
  ambito,
  pagina,
  listado,
  vacio,
  aviso,
  animaciones = [],
}: {
  ambito: Ambito;
  pagina: number;
  listado: Extract<ResultadoListado<UnidadUsada>, { tipo: "listado" }>;
  /** Sin ninguna unidad: el estado vacío diseñado (alternativas y «Avísame»). */
  vacio: DatosVacio | null;
  /** Sin ninguna unidad y con el interruptor en «Provisional»: el aviso sencillo. */
  aviso?: AvisoVacio | null;
  /** Las animaciones que se pintan (`animacionesActivas`). */
  animaciones?: Animacion[];
}) {
  const { registro, catalogo } = ambito;
  const migas = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Usada", path: rutas.usada() },
    { nombre: registro.nombre, path: ambito.ruta(1) },
  ];
  if (pagina > 1) migas.push({ nombre: `Página ${pagina}`, path: ambito.ruta(pagina) });

  return (
    <PlantillaListado
      migas={migas}
      titulo={ambito.titulo}
      pagina={pagina}
      descripcion={registro.descripcion}
      enlaces={ambito.enlaces}
      pestanas={ambito.pestanas}
      etiquetaPestanas="Categorías"
      pestanasEnLateral
      navegacionCliente
      animaciones={animaciones}
      catalogo={catalogo}
      listado={listado}
      rutaDe={(n) => `${ambito.ruta(n)}/`}
      elemento={{ singular: "unidad", plural: "unidades" }}
      idLista="tarjetas-usada"
      vacio={
        vacio ? (
          <EstadoVacioUsados datos={vacio} origen={`${ambito.ruta(pagina)}/`} />
        ) : aviso ? (
          <div className={estilosListado.vacio}>
            <p>{AVISO_SIN_UNIDADES}</p>
            <p>
              <Link href="/contactanos/">Contáctanos</Link>
              {aviso.whatsapp ? (
                <>
                  {" o "}
                  <a href={aviso.whatsapp.href} target="_blank" rel="noopener noreferrer">
                    escríbenos por WhatsApp
                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                </>
              ) : null}{" "}
              y te avisamos cuando llegue una.
            </p>
          </div>
        ) : (
          AVISO_SIN_UNIDADES
        )
      }
    >
      {listado.elementos.map((u, i) => (
        <TarjetaListado
          key={u.id}
          nombre={u.nombre}
          titulo={u.nombre}
          // La página de la unidad (2026-10-16); sin dirección web aún, sin enlace.
          href={
            u.slug && u.categoriaRef ? `${rutas.unidadUsada(u.categoriaRef.slug, u.slug)}/` : null
          }
          foto={u.foto}
          filas={[
            {
              icono: IconWeight,
              texto: "Peso operativo",
              valor: typeof u.pesoOperativo === "number" ? `${numero(u.pesoOperativo)} t` : null,
            },
            { icono: IconCalendar, texto: "Año", valor: u.anio ? String(u.anio) : null },
            {
              icono: IconClockHour4,
              texto: "Horas",
              valor: typeof u.horometro === "number" ? `${numero(u.horometro)} h` : null,
            },
          ]}
          prioridad={i === 0}
          flecha={animaciones.includes("A3")}
          fundido={animaciones.includes("A6")}
        />
      ))}
    </PlantillaListado>
  );
}
