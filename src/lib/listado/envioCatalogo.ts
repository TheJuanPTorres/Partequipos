/**
 * ¿Es este envío el del FORMULARIO DE FILTROS del catálogo? Solo entonces lo toma `ZonaCatalogo`
 * y navega con el router (`scroll: false`).
 *
 * Se mira el ATRIBUTO `method`, no la propiedad: un formulario con acción de servidor de React
 * (el de solicitud, `FormularioSolicitud`) no lleva `method`, y su propiedad `form.method` vale
 * `"get"` por defecto. Con la propiedad, la zona se quedaba también con el envío de «Avísame
 * cuando llegue una» del estado vacío de usados (y con el del formulario del final de esa página):
 * navegaba a la `action` de relleno de React con los campos en la URL y la página respondía
 * «Página no encontrada» (fallo en el sitio publicado, 2026-10-23). El formulario de filtros
 * declara `method="get"` (`PanelFiltrosListado`).
 */
export function esEnvioDelCatalogo(formulario: Pick<Element, "getAttribute">): boolean {
  return formulario.getAttribute("method")?.trim().toLowerCase() === "get";
}
