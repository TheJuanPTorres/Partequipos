/**
 * Los estilos del modo administración, como TEXTO dentro del módulo (los inyecta `ModoAdmin`), y no
 * en un `.module.css`: así viajan en el mismo trozo de código que solo descarga quien tiene sesión,
 * y ni una clase del modo administración entra en las hojas de estilo públicas.
 *
 * Medidas en px fijos (no pasan por la escala de pantallas grandes): es una herramienta, no diseño.
 * Colores: tinta casi negra con texto blanco (17:1) y el rojo de marca para el foco y «Editar»
 * (blanco sobre #d92035, 4,99:1).
 */
export const ALTO_FRANJA = 44;

export const ESTILOS = `
html[data-modo-admin] { scroll-padding-top: ${ALTO_FRANJA}px; }
html[data-modo-admin] body { padding-top: ${ALTO_FRANJA}px; }
html[data-modo-admin] body > header { top: ${ALTO_FRANJA}px; }

.pqma-franja {
  position: fixed; inset: 0 0 auto 0; z-index: 2147483000; height: ${ALTO_FRANJA}px;
  display: flex; align-items: center; gap: 4px; padding: 0 12px;
  background: #171717; color: #fff; font: 500 14px/1.2 system-ui, sans-serif;
  overflow-x: auto; white-space: nowrap; scrollbar-width: none;
}
.pqma-franja::-webkit-scrollbar { display: none; }
.pqma-aviso {
  margin-right: auto; padding-right: 12px; font-weight: 400; color: #e5e5e5;
  flex: 0 1 auto; min-width: 96px; overflow: hidden; text-overflow: ellipsis;
}
.pqma-franja > a, .pqma-franja > button { flex: none; }
.pqma-aviso strong { color: #fff; font-weight: 600; }
.pqma-quien { color: #d4d4d4; }
.pqma-boton {
  display: inline-flex; align-items: center; min-height: 32px; padding: 0 10px; border: 0;
  border-radius: 6px; background: transparent; color: #fff; font: inherit; cursor: pointer;
  text-decoration: none;
}
.pqma-boton:hover { background: #404040; }
.pqma-boton[aria-pressed="true"] { background: #404040; }
.pqma-boton--principal { background: #d92035; }
.pqma-boton--principal:hover { background: #b81a2c; }
.pqma-franja :focus-visible, .pqma-editar:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.pqma-tecla { margin-left: 6px; padding: 1px 5px; border: 1px solid #737373; border-radius: 4px; font-size: 12px; color: #d4d4d4; }

.pqma-capa { position: absolute; inset: 0 auto auto 0; width: 0; height: 0; z-index: 2147482000; }
.pqma-marco {
  position: absolute; pointer-events: none; border: 2px dashed #d92035; border-radius: 4px;
  opacity: 0; transition: opacity 120ms ease;
}
.pqma-editar {
  position: absolute; display: inline-flex; align-items: center; min-height: 32px; padding: 0 12px;
  border-radius: 6px; background: #d92035; color: #fff; font: 600 14px/1.2 system-ui, sans-serif;
  text-decoration: none; white-space: nowrap; box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
  opacity: 0; pointer-events: none; transition: opacity 120ms ease;
}
.pqma-bloque[data-activo] .pqma-marco, .pqma-bloque:focus-within .pqma-marco { opacity: 1; }
.pqma-bloque[data-activo] .pqma-editar, .pqma-editar:focus, .pqma-editar:hover {
  opacity: 1; pointer-events: auto;
}
/* Sin ratón (táctil) no hay «pasar por encima»: los botones se ven siempre. */
@media (hover: none) {
  .pqma-editar { opacity: 1; pointer-events: auto; }
}
@media (max-width: 700px) {
  .pqma-quien, .pqma-tecla { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .pqma-marco, .pqma-editar { transition: none; }
}
@media print {
  .pqma-franja, .pqma-capa { display: none; }
  html[data-modo-admin] body { padding-top: 0; }
}
`;
