/**
 * LÍNEA DE COMANDO para `scripts/preview/con-entorno.ts`. El cargador lanza el
 * comando por shell (en Windows, `npx` y `payload` son `.cmd`), y
 * `spawnSync(cmd, args, { shell: true })` **junta los argumentos con espacios
 * sin comillas**: una ruta como `C:\Users\Juan Torres\x.cjs` llegaba partida
 * en dos. Aquí se entrecomilla cada parte que lo necesite, según la shell.
 *
 * Límite conocido: en `cmd.exe` un `%VAR%` se expande aunque vaya entre
 * comillas. Ningún comando del proyecto lo usa como texto literal.
 */

/** Lo que no necesita comillas en ninguna de las dos shells. */
const SEGURO = /^[\w@+=:,./\\-]+$/;

export function citarArgumento(arg: string, plataforma: NodeJS.Platform): string {
  if (arg !== "" && SEGURO.test(arg)) return arg;
  if (plataforma === "win32") {
    // Reglas de CommandLineToArgvW: las barras que preceden a una comilla se
    // duplican, y la comilla se escapa con una barra; las del final, también.
    const escapado = arg.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, "$1$1");
    return `"${escapado}"`;
  }
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

export function lineaDeComando(partes: string[], plataforma: NodeJS.Platform): string {
  return partes.map((p) => citarArgumento(p, plataforma)).join(" ");
}
