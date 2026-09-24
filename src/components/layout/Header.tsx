import Link from "next/link";

import { navegacionPrincipal } from "@/lib/navegacion";
import { SLUG_PORTADA, getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { seoConfig } from "@/lib/seo/config";

import { LogoCabecera } from "./LogoCabecera";

/**
 * Cabecera con la navegación principal del sitio.
 *
 * Server Component. Solo el logo es de cliente (`LogoCabecera`): necesita saber
 * si la ruta es la portada para ser su `<h1>`. Sin menú desplegable en móvil a propósito — en pantallas pequeñas los
 * enlaces pasan a varias líneas, que es accesible y no requiere interactividad.
 * El diseño definitivo decidirá si hace falta un menú plegable.
 */
export async function Header() {
  /*
   * El título de la portada da nombre al <h1> del logo en `/` (D1). Consulta
   * memoizada por petición (`cache()`): en la portada es la misma que hace la
   * página. Sin portada, el nombre del sitio.
   */
  const portada = await getPaginaPorSlug(SLUG_PORTADA);
  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <LogoCabecera
          src={seoConfig.logoPath}
          nombreSitio={seoConfig.siteName}
          tituloPortada={portada?.titulo ?? seoConfig.siteName}
        />

        <nav aria-label="Navegación principal">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {navegacionPrincipal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-gray-700 hover:text-gray-900 hover:underline"
                >
                  {item.etiqueta}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`tel:${seoConfig.contact.phone.replace(/\s/g, "")}`}
                className="font-medium text-gray-900 hover:underline"
              >
                {seoConfig.contact.phone}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
