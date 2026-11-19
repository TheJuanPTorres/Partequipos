import { fileURLToPath } from "node:url";

/*
 * Tailwind y, después, la escala proporcional de las pantallas grandes (`--u`, CLAUDE.md §5): el
 * plugin propio pasa los `px` del CSS del sitio (también los que genera Tailwind) a la unidad
 * fluida. El panel y `node_modules` quedan fuera. Con la ruta absoluta: Turbopack resuelve los
 * nombres de plugin desde su propia carpeta, no desde la de este fichero.
 */
const escala = fileURLToPath(new URL("./src/lib/estilos/escalaPostcss.mjs", import.meta.url));

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    [escala]: {},
  },
};

export default config;
