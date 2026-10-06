// Marca oficial de Microsoft (los cuatro cuadros) tal cual la publica su guía
// de marca: cuatro colores fijos, SIN contenedor detrás. Va desnuda sobre la
// superficie del botón — un logo dentro de una placa lee como plantilla, y
// además las brand guidelines de Microsoft exigen el símbolo sin alterar.
// Los colores son constantes de marca, así que NO se tokenizan ni cambian con
// el tema; lo que cambia alrededor es la superficie del botón.
export function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className ?? "size-4"} aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}
