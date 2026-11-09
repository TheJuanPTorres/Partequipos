import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { LogoEnCaja, tamanoCaja } from "@/components/marca/LogoEnCaja";
import { conRecorte } from "@/lib/marca/recorteLogo";
import { CAJA_BANNER, CAJA_BANNER_MOVIL } from "@/lib/marca/tamanoOptico";
import type { BannerConLogo } from "@/lib/nueva/bannerMarca";

import estilos from "./bannerMarca.module.css";

/**
 * BANNER DE MARCA de la página general de un tipo de maquinaria nueva (2026-10-26, prototipo del
 * cliente «Excavadoras nuevas» portado sin Tailwind; lógica en `src/lib/nueva/bannerMarca.ts`).
 * Escritorio: el logo sobre una forma del color de la marca con borde diagonal y esquinas
 * redondeadas (con otra más oscura detrás), el título en `<h2>` sobre un tono claro de la marca y,
 * a la derecha, la foto de la marca teñida con su color que se oscurece hacia «Ver marca».
 * Móvil (≤ 767 px): tarjeta blanca con el bloque de color del logo, el título y una flecha.
 * Sin logo, el nombre de la marca en el bloque; sin foto, el banner en su color.
 *
 * EL LOGO (dirección, 2026-11-09, la regla del selector #432/#439; `bannerConLogo`): sobre la forma
 * de color, el de la baldosa de la marca de repuestos con su color (o el de siempre sobre una
 * plaquita blanca), SIN filtros; en móvil, el de siempre con sus colores sobre la tarjeta blanca.
 * Los dos en una caja fija con el mismo tamaño óptico (`LogoEnCaja`, sin márgenes medidos).
 */
export async function BannerMarcaTipo({
  id,
  titulo,
  marca,
  banner,
  nivel = "h2",
}: {
  /** `id` del título. */
  id: string;
  titulo: string;
  marca: { nombre: string; href: string };
  banner: BannerConLogo;
  /** El nivel del título: `h3` si el banner va bajo el `<h2>` de su sección. */
  nivel?: "h2" | "h3";
}) {
  const Titulo = nivel;
  const { vista, sobreColor } = banner;
  const [escritorio, movil] = await Promise.all([
    conRecorte(sobreColor.logo),
    conRecorte(banner.movil),
  ]);
  const nombreLogo = banner.movil?.alt ?? sobreColor.logo?.alt ?? null;
  const variables = {
    "--acento": vista.acento,
    "--acento-oscuro": vista.acentoOscuro,
    "--banner-fondo": vista.fondo,
    "--banner-tinta": vista.tintaTitulo,
  } as CSSProperties;
  return (
    <header className={estilos.banner} style={variables}>
      {vista.foto ? (
        <span aria-hidden="true" className={estilos.foto}>
          <Image
            src={vista.foto.url}
            alt=""
            fill
            sizes="(max-width: 1024px) 60vw, 820px"
            style={{ objectFit: "cover", objectPosition: vista.foto.posicion }}
          />
          <span className={estilos.fotoTinte} />
          <span className={estilos.fotoSombra} />
        </span>
      ) : null}
      <span aria-hidden="true" className={estilos.formaAtras} />
      <span aria-hidden="true" className={estilos.forma} />

      <div className={estilos.logoCaja} data-tinta={vista.tintaLogo}>
        {escritorio || movil ? (
          <>
            {escritorio ? (
              <span className={estilos.cajaEscritorio} style={tamanoCaja(CAJA_BANNER)}>
                <LogoEnCaja
                  logo={escritorio}
                  caja={CAJA_BANNER}
                  className={estilos.version}
                  placa={sobreColor.placa}
                  loading="lazy"
                />
              </span>
            ) : null}
            {movil ? (
              <span className={estilos.cajaMovil} style={tamanoCaja(CAJA_BANNER_MOVIL)}>
                <LogoEnCaja
                  logo={movil}
                  caja={CAJA_BANNER_MOVIL}
                  className={estilos.version}
                  loading="lazy"
                />
              </span>
            ) : null}
            {nombreLogo ? <span className={estilos.soloLectores}>{nombreLogo}</span> : null}
          </>
        ) : (
          <span className={estilos.logoTexto}>{marca.nombre}</span>
        )}
      </div>

      <div className={estilos.texto}>
        <Titulo id={id} className={estilos.titulo}>
          {titulo}
        </Titulo>
      </div>

      <div className={estilos.accion}>
        <Link href={marca.href} aria-label={`Ver marca ${marca.nombre}`} className={estilos.ver}>
          <span className={estilos.verTexto}>Ver marca</span>
          <IconArrowRight aria-hidden="true" size={18} stroke={2.2} />
        </Link>
      </div>
    </header>
  );
}
