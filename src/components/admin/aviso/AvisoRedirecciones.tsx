import { Aviso } from "./Aviso";

/**
 * Ayuda arriba de cada redirección: un ejemplo de «Desde» y «Hacia» válidos,
 * que antes solo se veían al fallar la validación (F4).
 */
export default function AvisoRedirecciones() {
  return (
    <Aviso titulo="Cómo se escribe una redirección" tono="info">
      <p>
        «Desde»: la dirección antigua, empezando por «/». Ej.:{" "}
        <code>/repuestos-viejo/modelo-x/</code>
      </p>
      <p>
        «Hacia»: una dirección del sitio que exista, o una completa con https://. Ej.:{" "}
        <code>/contactanos/</code>
      </p>
      <p>
        Usa 301 salvo que el cambio sea temporal. Las de origen «Cambio de dirección web» las crea
        el sitio solo: no hace falta tocarlas.
      </p>
    </Aviso>
  );
}
