import Link from "next/link";

import type { BreadcrumbItem } from "@/lib/seo/jsonLd";

/**
 * Migas de pan visibles. Recibe los MISMOS items que alimentan el JSON-LD
 * `BreadcrumbList`, de modo que lo que ve el usuario y lo que lee el rastreador
 * no puedan divergir.
 *
 * El último nivel es la página actual: se marca con `aria-current` y no se
 * enlaza a sí mismo.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegación" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.path} className="flex items-center gap-x-2">
              {isLast ? (
                <span aria-current="page" className="text-gray-900">
                  {item.nombre}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="underline hover:text-gray-900">
                    {item.nombre}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
