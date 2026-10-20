import { IconBolt, IconEngine, IconWeight } from "@tabler/icons-react";

import { PlantillaListado } from "@/components/listado/PlantillaListado";
import { TarjetaListado } from "@/components/listado/TarjetaListado";
import type { ResultadoListado } from "@/lib/filtros";
import { CATALOGO_NUEVA } from "@/lib/nueva/filtros";
import type { AmbitoNueva } from "@/lib/nueva/listado";
import { logoDeMarca, type LogoMarca } from "@/lib/marca/logoMarca";
import type { EquipoNuevoListado } from "@/lib/queries/getMaquinaria";
import { getLogosMarca } from "@/lib/queries/getLogosMarca";
import { rutas } from "@/lib/routes";

/**
 * El listado de maquinaria NUEVA con la plantilla «Categoría secundaria» de
 * ux-9: el índice de nueva y cada categoría, una página cada vez
 * (`src/lib/nueva/listado.ts`). La plantilla, el panel de filtros y la
 * tarjeta son los comunes con usada (`src/components/listado/`).
 */

export async function ListadoNueva({
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

  // El logo de cada marca, el de todo el sitio (`logoMarca.ts`): el de repuestos si es la misma.
  const indice = await getLogosMarca();
  const logoDe = (e: EquipoNuevoListado) =>
    logoDeMarca(
      { nombre: e.marcaRef?.nombre, logo: e.logo, logoOscuroEnMenu: e.logoOscuro },
      indice,
    );
  const logosDeMarca = new Map<string, LogoMarca>();
  for (const e of ambito.equipos) {
    const logo = logoDe(e);
    if (e.marcaRef && logo) logosDeMarca.set(e.marcaRef.slug, logo);
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
      logoDeMarca={logosDeMarca}
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
          logo={logoDe(e)}
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
