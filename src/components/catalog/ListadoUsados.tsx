import { IconBarcode, IconCalendar, IconClockHour4, IconWeight } from "@tabler/icons-react";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { IconBell, IconBrandWhatsapp } from "@tabler/icons-react";
import { turnstileSiteKey } from "@/lib/turnstile";
import { conMensaje } from "@/lib/whatsapp";
import { PlantillaListado } from "@/components/listado/PlantillaListado";
import { TarjetaListado } from "@/components/listado/TarjetaListado";
import type { ResultadoListado } from "@/lib/filtros";
import type { Animacion } from "@/lib/listado/animaciones";
import type { UnidadUsada } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import estilosListado from "@/components/listado/listado.module.css";
import { EstadoVacioUsados } from "@/components/usados/EstadoVacioUsados";
import type { Ambito, AvisoVacio, DatosVacio } from "@/lib/usados/listado";
import { camposDeAditamento } from "@/lib/usados/aditamentos";
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
  avisoFiltros,
}: {
  /** WhatsApp para «Avísame» cuando los filtros no dejan ninguna unidad. */
  avisoFiltros?: AvisoVacio | null;
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

  // El mensaje de WhatsApp del estado «los filtros no dejan ninguna»: lo que se busca y con qué filtros.
  const whatsappConFiltros = (filtros: string[]) =>
    avisoFiltros?.whatsapp
      ? conMensaje(
          avisoFiltros.whatsapp,
          `Hola, quiero información sobre ${ambito.titulo}${filtros.length ? ` (${filtros.join(", ")})` : ""}.`,
        )
      : undefined;

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
      avisame={(filtros) => (
        <BotonAvisame
          origen={`${ambito.ruta(pagina)}/`}
          referencia={`${ambito.titulo}${filtros.length ? ` · ${filtros.join(", ")}` : ""}`}
          whatsapp={whatsappConFiltros(filtros)}
          descripcion="Déjanos tus datos y te escribimos en cuanto entre una unidad como la que buscas. Ya indicamos los filtros que elegiste; si quieres algo más concreto, cuéntanoslo en el mensaje."
        />
      )}
      escribenos={(filtros) => {
        const wa = whatsappConFiltros(filtros);
        return wa ? <BotonWhatsApp href={wa.href} /> : null;
      }}
      vacio={
        vacio ? (
          <EstadoVacioUsados datos={vacio} origen={`${ambito.ruta(pagina)}/`} />
        ) : aviso ? (
          <div className={estilosListado.vacio}>
            <p>{AVISO_SIN_UNIDADES}</p>
            <div className={estilosListado.acciones2}>
              <BotonAvisame
                origen={`${ambito.ruta(pagina)}/`}
                referencia={ambito.titulo}
                whatsapp={aviso.whatsapp}
                descripcion="Déjanos tus datos y te escribimos en cuanto entre una unidad. Si buscas un modelo, un año o unas horas concretas, cuéntanoslo en el mensaje."
              />
              {aviso.whatsapp ? <BotonWhatsApp href={aviso.whatsapp.href} /> : null}
            </div>
          </div>
        ) : (
          AVISO_SIN_UNIDADES
        )
      }
    >
      {listado.elementos.map((u, i) => {
        // Aditamentos (2026-10-23): la descripción corta bajo el título y el serial como un dato más.
        const { serial, descripcionCorta } = camposDeAditamento(u.categoriaRef?.slug, u);
        return (
          <TarjetaListado
            key={u.id}
            nombre={u.nombre}
            titulo={u.nombre}
            // La página de la unidad (2026-10-16); sin dirección web aún, sin enlace.
            href={
              u.slug && u.categoriaRef ? `${rutas.unidadUsada(u.categoriaRef.slug, u.slug)}/` : null
            }
            foto={u.foto}
            resumen={descripcionCorta}
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
              { icono: IconBarcode, texto: "Serial", valor: serial },
            ]}
            prioridad={i === 0}
            flecha={animaciones.includes("A3")}
            fundido={animaciones.includes("A6")}
          />
        );
      })}
    </PlantillaListado>
  );
}

/** El botón verde de WhatsApp de los avisos de usados sin unidades (pestaña nueva). */
function BotonWhatsApp({ href }: { href: string }) {
  return (
    <a
      href={href}
      className={estilosListado.whatsappVerde}
      target="_blank"
      rel="noopener noreferrer"
    >
      <IconBrandWhatsapp size={20} stroke={2} aria-hidden="true" />
      Escríbenos por WhatsApp
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}

/** «Avísame cuando llegue una»: el botón rojo que abre la ventana del formulario con el contexto del listado. */
function BotonAvisame({
  origen,
  referencia,
  whatsapp,
  descripcion,
}: {
  origen: string;
  referencia: string;
  whatsapp?: { href: string; etiqueta: string };
  descripcion: string;
}) {
  return (
    <BotonFormulario
      href="/contactanos/"
      className={estilosListado.avisame}
      formulario={{
        tipo: "cotizacion",
        origen,
        siteKey: turnstileSiteKey(),
        whatsapp,
        referencia: { texto: `${referencia} (avísame cuando llegue una)` },
        titulo: "Avísame cuando llegue una",
        descripcion,
        textoBoton: "Avísame",
      }}
    >
      <IconBell size={20} stroke={2} aria-hidden="true" />
      Avísame cuando llegue una
    </BotonFormulario>
  );
}
