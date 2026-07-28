import Image from "next/image";
import Link from "next/link";

export type EnlaceItem = {
  href: string;
  titulo: string;
  descripcion?: string | null;
  imagen?: { url: string; alt: string; width: number; height: number } | null;
};

/**
 * Lista de enlaces del catálogo (marcas, tipos o modelos).
 *
 * Deliberadamente sobria y desacoplada del estilo: estructura y semántica
 * correctas con Tailwind mínimo, para que el diseño definitivo de un tercero
 * pueda aplicarse encima sin rehacer el marcado.
 */
export function ListaEnlaces({ items, vacio }: { items: EnlaceItem[]; vacio: string }) {
  if (items.length === 0) {
    return (
      <p className="rounded border border-dashed border-gray-300 p-6 text-center text-gray-600">
        {vacio}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.href} className="rounded-lg border border-gray-200">
          <Link href={item.href} className="flex h-full items-center gap-4 p-4 hover:bg-gray-50">
            {item.imagen ? (
              <Image
                src={item.imagen.url}
                alt={item.imagen.alt}
                width={item.imagen.width}
                height={item.imagen.height}
                className="h-12 w-auto shrink-0 object-contain"
              />
            ) : null}
            <span className="min-w-0">
              <span className="block font-medium text-gray-900">{item.titulo}</span>
              {item.descripcion ? (
                <span className="mt-1 block text-sm text-gray-600">{item.descripcion}</span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
