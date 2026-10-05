import {
  IconBrandFacebookFilled,
  IconBrandInstagramFilled,
  IconBrandLinkedinFilled,
  IconBrandTiktokFilled,
  IconBrandWhatsapp,
  IconBrandXFilled,
  IconBrandYoutubeFilled,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { enlaceWhatsApp } from "@/lib/navegacion";
import { columnasDelPie, hrefTelefono, redesDelPie, type ColumnaPie, type RedPie } from "@/lib/pie";
import { getPie } from "@/lib/queries/getPie";
import { getEmpresa, getLogo } from "@/lib/queries/getSeo";
import { imagenDeMedia } from "@/lib/utils/relations";
import { seoConfig } from "@/lib/seo/config";

import { BuscadorPie } from "./BuscadorPie";
import estilos from "./pie.module.css";

/**
 * PIE DEL SITIO — ux-9 (export 2178 de Andrés, que sustituye al 2696). Server Component: solo el lema
 * que se revela es de cliente. Valores en `pie.module.css`.
 *
 * CONTENIDO: el global `pie` de Payload (lema, texto de la empresa, columnas y
 * texto del botón). Redes y contacto salen del global `seo` (`getEmpresa`, con
 * respaldo en `seoConfig`), fuente única del
 * JSON-LD `Organization`.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-home-ux9.md §13):
 * - Enlaces SIN destino no se pintan. «Trabaja con nosotros», «Zona de
 *   clientes» y «Financiación» esperan su URL del cliente: en el preview van a
 *   /contactanos/ como destino provisional (datos del global, no código).
 * - Redes: las del panel que el pie sabe pintar (las cinco de ux-9 y
 *   Instagram), con su nombre real; el export trae etiquetas cruzadas. En el
 *   orden de ux-9 (LinkedIn, X, Facebook, TikTok, YouTube; Instagram al final).
 *   Iconos RELLENOS de Tabler, los equivalentes de los Font Awesome de ux-9
 *   (Font Awesome sería una dependencia nueva).
 * - Franja legal inferior (Ley 1581), con dirección, teléfono y correo (el
 *   correo, desde la fase 6: antes solo estaba en el bloque previo de la home).
 * - «Somos una empresa…» es párrafo, no `<h3>`: los títulos de columna son
 *   `<h2>`, el nivel siguiente al `<h1>` de cualquier página.
 * - Buscador PROVISIONAL (dirección, 2026-10-05): el campo y el botón de
 *   ux-9, pero solo anuncian «Buscador disponible pronto» y no navegan
 *   (`BuscadorPie`), hasta que se apruebe el buscador.
 * - La máquina decorativa NO está en el repositorio (es público): se sube a
 *   `Media` y se elige en el global `pie`. Con §10.38 activa, la de ux-9.
 */

// ux-9 pinta LinkedIn, X, Facebook, TikTok y YouTube; Instagram es nuestra.
const ICONOS: Record<RedPie, typeof IconBrandFacebookFilled> = {
  LinkedIn: IconBrandLinkedinFilled,
  X: IconBrandXFilled,
  Facebook: IconBrandFacebookFilled,
  Instagram: IconBrandInstagramFilled,
  TikTok: IconBrandTiktokFilled,
  YouTube: IconBrandYoutubeFilled,
};

function Columna({
  columna,
  id,
  children,
}: {
  columna: ColumnaPie;
  id: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={estilos.columna} aria-labelledby={id}>
      <h2 id={id} className={`${estilos.tituloColumna} texto-destacado-negrita`}>
        {columna.titulo}
      </h2>
      <ul className={`${estilos.lista} texto-cuerpo`}>
        {columna.enlaces.map((e) => (
          <li key={`${e.etiqueta}-${e.href}`}>
            {e.interno ? (
              <Link href={e.href} className={estilos.enlace}>
                {e.etiqueta}
              </Link>
            ) : (
              <a href={e.href} className={estilos.enlace}>
                {e.etiqueta}
              </a>
            )}
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}

export async function Footer() {
  const [pie, empresa, logo] = await Promise.all([getPie(), getEmpresa(), getLogo()]);
  const telefono = hrefTelefono(empresa.telefono);
  const columnas = columnasDelPie(pie.columnas, empresa.telefono);
  // Decorativa: sin nombre accesible (`alt` vacío y `aria-hidden`).
  const decorativa = imagenDeMedia(pie.imagenDecorativa, "");
  // Enlaces legales del global, en su orden (la migración pone primero el de
  // tratamiento de datos, Ley 1581 de 2012). Sin texto o sin enlace, no salen.
  const legalesEnOrden = (pie.legales ?? []).flatMap((l) =>
    l.etiqueta?.trim() && l.enlace?.trim()
      ? [{ etiqueta: l.etiqueta.trim(), href: l.enlace.trim() }]
      : [],
  );
  // En el orden de ux-9, escriba el panel el que escriba (`ORDEN_REDES`).
  const redes = redesDelPie(empresa.redes).map((r) => ({ ...r, Icono: ICONOS[r.nombre] }));

  return (
    <footer className={estilos.pie} data-con-imagen={decorativa ? "" : undefined}>
      {/* Sin lema o sin texto del botón (global aún vacío), la tarjeta no se pinta. */}
      {pie.lema && pie.textoBoton ? (
        <div className={estilos.marco}>
          <div className={estilos.tarjeta}>
            {decorativa ? (
              <Image
                src={decorativa.url}
                alt=""
                aria-hidden="true"
                width={decorativa.width}
                height={decorativa.height}
                sizes="518px"
                loading="lazy"
                className={estilos.decorativa}
              />
            ) : null}
            <Revelado
              como="p"
              texto={pie.lema}
              ritmo="titulo"
              escalon={0.08}
              duracion={0.75}
              className={`${estilos.lema} texto-titulo-bloque`}
            />
            <a
              href={enlaceWhatsApp(empresa.whatsapp)}
              className={`${estilos.whatsapp} texto-etiqueta`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden="true" focusable="false" stroke={1.75} />
              {pie.textoBoton}
            </a>
          </div>
        </div>
      ) : null}

      <div className={estilos.panel}>
        <div className={estilos.empresa}>
          <Image
            src={logo.sitio.src}
            alt={seoConfig.siteName}
            width={logo.sitio.width}
            height={logo.sitio.height}
            className={estilos.logo}
          />
          <div>
            {pie.empresaTitulo ? <p className={estilos.lemaEmpresa}>{pie.empresaTitulo}</p> : null}
            {pie.empresaTexto ? <p className={estilos.textoEmpresa}>{pie.empresaTexto}</p> : null}
          </div>
        </div>
        <div className={estilos.hueco}>
          <BuscadorPie />
        </div>

        <div className={estilos.columnas}>
          {columnas.map((c, i) => (
            <Columna key={c.titulo} columna={c} id={`pie-columna-${i + 1}`}>
              {/* Las redes van bajo la ÚLTIMA columna, como en ux-9 («Contacto»). */}
              {i === columnas.length - 1 && redes.length > 0 ? (
                <ul className={estilos.redes}>
                  {redes.map(({ url, nombre, Icono }) => (
                    <li key={url}>
                      <a
                        href={url}
                        className={estilos.red}
                        aria-label={`${nombre} de Partequipos`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icono aria-hidden="true" focusable="false" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Columna>
          ))}
        </div>
      </div>

      <div className={estilos.legal}>
        <nav aria-label="Legal">
          <ul>
            {legalesEnOrden.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.etiqueta}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <address>
          {empresa.direccion}, {empresa.ciudad} · <a href={telefono}>{empresa.telefono}</a> ·{" "}
          <a href={`mailto:${empresa.correo}`}>{empresa.correo}</a> · © {new Date().getFullYear()}{" "}
          {seoConfig.siteName}
        </address>
      </div>
    </footer>
  );
}
