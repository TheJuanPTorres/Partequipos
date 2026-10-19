import { IconBolt, IconEngine, IconWeight } from "@tabler/icons-react";

import { PlantillaListado } from "@/components/listado/PlantillaListado";
import { TarjetaListado } from "@/components/listado/TarjetaListado";
import type { ResultadoListado } from "@/lib/filtros";
import { CATALOGO_NUEVA } from "@/lib/nueva/filtros";
import type { AmbitoNueva } from "@/lib/nueva/listado";
import type { EquipoNuevoListado, FotoDeTarjeta } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";

/**
 * El listado de maquinaria NUEVA con la plantilla «Categoría secundaria» de
 * ux-9: el índice de nueva y cada categoría, una página cada vez
 * (`src/lib/nueva/listado.ts`). La plantilla, el panel de filtros y la
 * tarjeta son los comunes con usada (`src/components/listado/`).
 */

export function ListadoNueva({
  ambito,
  pagina,
  listado,
}: {
  ambito: AmbitoNueva;
  pagina: number;
  listado: Extract<ResultadoListado<EquipoNuevoListado>, { tipo: "listado" }>;
}) {
  const migas = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Maquinaria pesada nueva", path: rutas.nueva() },
    ...(ambito.tipo === "categoria" && ambito.slug
      ? [{ nombre: ambito.nombre, path: rutas.categoriaNueva(ambito.slug) }]
      : []),
  ];
  if (pagina > 1) migas.push({ nombre: `Página ${pagina}`, path: ambito.ruta(pagina) });

  // Los logos de las marcas salen de los propios equipos (la marca los lleva).
  const logoDeMarca = new Map<string, FotoDeTarjeta>();
  for (const e of ambito.equipos) {
    if (e.marcaRef && e.logo) logoDeMarca.set(e.marcaRef.slug, e.logo);
  }

  return (
    <PlantillaListado
      migas={migas}
      titulo={ambito.titulo}
      pagina={pagina}
      pestanas={ambito.pestanas}
      etiquetaPestanas="Categorías de maquinaria nueva"
      catalogo={CATALOGO_NUEVA}
      listado={listado}
      rutaDe={(n) => `${ambito.ruta(n)}/`}
      elemento={{ singular: "equipo", plural: "equipos" }}
      logoDeMarca={logoDeMarca}
      idLista="tarjetas-nueva"
      vacio="Todavía no hay equipos publicados aquí."
    >
      {listado.elementos.map((e, i) => (
        <TarjetaListado
          key={e.id}
          nombre={e.nombre}
          titulo={[e.tipoRef?.nombre, e.marcaRef?.nombre].filter(Boolean).join(" ") || e.nombre}
          href={e.href}
          codigo={e.codigo}
          foto={e.foto}
          logo={e.logo}
          logoAlt={e.marcaRef?.nombre ?? ""}
          filas={[
            { icono: IconWeight, texto: "Peso operativo", valor: e.datos.peso },
            { icono: IconBolt, texto: "Potencia", valor: e.datos.potencia },
            { icono: IconEngine, texto: "Motor", valor: e.datos.motor },
          ]}
          pdf={e.pdf}
          prioridad={i === 0}
        />
      ))}
    </PlantillaListado>
  );
}
