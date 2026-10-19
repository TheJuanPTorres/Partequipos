import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { CategoriasMarca } from "@/components/repuestos/CategoriasMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { AyudaWhatsApp } from "@/components/repuestos/modelo/AyudaWhatsApp";
import { PresentacionModelo } from "@/components/repuestos/modelo/PresentacionModelo";
import estilosModelo from "@/components/repuestos/modelo/modelo.module.css";
import { estiloDeMarca } from "@/lib/marca/colorMarca";
import { getModelos, getModeloPorSlug } from "@/lib/queries/getModelos";
import { getCategoriasParaMarca, getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import { categoriasDeMarca } from "@/lib/repuestos/marca";
import { MUESTRAS_MODELO } from "@/lib/repuestos/muestraModelo";
import { rutas } from "@/lib/routes";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { Marca, TiposEquipo } from "@/payload-types";

/**
 * MUESTRA de la página de modelo de repuestos (2026-10-19, diseño propio) con
 * 3 modelos reales: `ex100` (lista de piezas visible), `zx200` y `580sn` (lista
 * oculta en WordPress). Datos del panel más los textos de WordPress que la base
 * aún no tiene (`muestraModelo.ts`). 404 en producción y fuera del sitemap.
 */
export const metadata: Metadata = {
  title: "Muestra · página de modelo de repuestos",
  robots: { index: false, follow: false },
};

const ANCLA_CONTACTO = "modelo-contacto";

export default async function LaboratorioModeloRepuestos({
  params,
}: {
  params: Promise<{ modelo: string }>;
}) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const muestra = MUESTRAS_MODELO[(await params).modelo];
  if (!muestra) notFound();

  const base = (await getModelos()).find((m) => m.slug === muestra.slug);
  const tipoBase = poblado<TiposEquipo>(base?.tipo);
  const modelo = tipoBase ? await getModeloPorSlug(tipoBase.id, muestra.slug) : null;
  const marca = poblado<Marca>(modelo?.marca);
  const tipo = poblado<TiposEquipo>(modelo?.tipo);
  if (!modelo || !marca || !tipo) notFound();

  const [global, categorias, empresa] = await Promise.all([
    getRepuestosMarca(),
    getCategoriasParaMarca(),
    getEmpresa(),
  ]);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const fotos = (Array.isArray(modelo.imagenes) ? modelo.imagenes : [])
    .map((img) => imagenDeMedia(img, modelo.nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null);
  const fotoTipo = imagenDeMedia(tipo.imagen, "");
  const whatsapp = enlaceWhatsApp(
    empresa.whatsapp,
    `Hola, busco repuestos para ${modelo.nombre}.`,
  )?.href;
  // Solo las de la plantilla del tipo, en el orden de WordPress.
  const todas = categoriasDeMarca(categorias);
  const enOrden = muestra.categorias.flatMap((s) =>
    todas.filter((c) => c.href === rutas.categoriaRepuestos(s)),
  );

  return (
    <main className={estilos.pagina} style={estiloDeMarca(marca.colorMarca)}>
      {/* La página ya tiene su formulario: el pie no pinta la tarjeta roja. */}
      <PieSinTarjeta />
      <HeroMarca
        vista={{
          antetitulo: muestra.antetitulo,
          linea1: muestra.titulo,
          linea2: "",
          descripcion: "",
          fondo: fotoTipo ?? imagenDeMedia(marca.fondoHero, ""),
          logo: imagenDeMedia(marca.logo, `Logo de ${marca.nombre.trim()}`),
          logoOscuro: Boolean(marca.logoOscuroEnMenu),
        }}
        anclaSiguiente="modelo-categorias"
        bajo
      />

      <PresentacionModelo
        texto={texto(modelo.descripcion)}
        foto={fotos[0] ?? null}
        solicitarHref={`#${ANCLA_CONTACTO}`}
        whatsapp={whatsapp ?? null}
      />

      <CategoriasMarca
        id="modelo-categorias"
        titulo={muestra.disponibles}
        categorias={enOrden}
        todasEnMovil
      >
        {muestra.piezasVisibles ? (
          <ul className={estilosModelo.piezas}>
            {muestra.piezas.map((p, i) => (
              <li key={`${i}-${p}`}>{p}</li>
            ))}
          </ul>
        ) : null}
      </CategoriasMarca>

      <AyudaWhatsApp
        titulo="ESTAMOS AQUÍ PARA AYUDARLO"
        texto="Escríbenos"
        boton="Whatsapp"
        href={whatsapp ?? null}
        fondo={fotoTipo}
      />

      <ContactoMarca
        id={ANCLA_CONTACTO}
        titulo={texto(global.contactoTitulo)}
        subtitulo="Si deseas más info, contáctanos"
        boton="Enviar solicitud"
        origen={rutas.modelo(marca.slug, segmentoDeTipo(tipo), modelo.slug)}
        siteKey={turnstileSiteKey()}
        whatsapp={enlaceWhatsApp(empresa.whatsapp)}
        marca={modelo.nombre}
        modelo={{ id: modelo.id, nombre: modelo.nombre }}
      />
    </main>
  );
}
