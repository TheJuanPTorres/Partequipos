import { descifrar, type Clave } from "./cifrado";
import { modoCorreo, type CifradoSmtp, type ConfigSmtp } from "./smtp";

/**
 * QUÉ SMTP ESTÁ EN VIGOR (2026-10-27, Juan Pablo): el del PANEL («Correo y formularios», solo
 * administradores) si está completo y su contraseña se puede descifrar; si no, el de las
 * variables de Vercel (`modoCorreo`); si tampoco, ninguno. Función pura: la usan el adaptador
 * de correo, el indicador del panel, la prueba y los avisos.
 *
 * `aviso` explica por qué el panel no manda aunque tenga algo escrito (incompleto, sin clave,
 * contraseña de otra clave). Nunca lleva el usuario ni la contraseña.
 */

type Entorno = Record<string, string | undefined>;

/** Lo guardado en el global (grupo `smtpPanel`), leído en el servidor (la contraseña, cifrada). */
export type DatosSmtpPanel = {
  servidor?: string | null;
  puerto?: number | null;
  cifrado?: CifradoSmtp | null;
  usuario?: string | null;
  contrasenaCifrada?: string | null;
  remitenteCorreo?: string | null;
  remitenteNombre?: string | null;
};

export type SmtpEnVigor =
  | { origen: "panel" | "vercel"; config: ConfigSmtp; aviso?: string }
  | { origen: "ninguno"; motivo: string; aviso?: string };

const t = (v: string | null | undefined) => v?.trim() ?? "";

/** El puerto por defecto de cada cifrado. */
export const PUERTO_POR_DEFECTO: Record<CifradoSmtp, number> = {
  starttls: 587,
  ssl: 465,
  ninguno: 25,
};

export function smtpEnVigor(
  panel: DatosSmtpPanel | null | undefined,
  clave: Clave,
  env: Entorno = process.env,
): SmtpEnVigor {
  const p = panel ?? {};
  const campos: [string, string][] = [
    ["Servidor", t(p.servidor)],
    ["Usuario", t(p.usuario)],
    ["Contraseña", t(p.contrasenaCifrada)],
    ["Correo del remitente", t(p.remitenteCorreo)],
  ];
  const escritos = campos.filter(([, v]) => v);
  let aviso: string | undefined;

  if (escritos.length === campos.length) {
    const cifrado: CifradoSmtp = p.cifrado ?? "starttls";
    const port = p.puerto ?? PUERTO_POR_DEFECTO[cifrado];
    const pass = clave.clave ? descifrar(t(p.contrasenaCifrada), clave.clave) : null;
    if (!clave.clave) {
      aviso = `Los datos del panel no se pueden usar en este entorno: ${clave.motivo}.`;
    } else if (pass === null) {
      aviso =
        "La contraseña guardada en el panel no se puede descifrar en este entorno (se guardó con otra clave): vuelve a escribirla.";
    } else if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      aviso = "El puerto del panel no es válido.";
    } else {
      return {
        origen: "panel",
        config: {
          host: t(p.servidor),
          port,
          cifrado,
          user: t(p.usuario),
          pass,
          fromAddress: t(p.remitenteCorreo),
          fromName: t(p.remitenteNombre) || "Partequipos",
        },
      };
    }
  } else if (escritos.length > 0) {
    const faltan = campos.filter(([, v]) => !v).map(([n]) => n);
    aviso = `Los datos del panel están incompletos (falta: ${faltan.join(", ")}).`;
  }

  const m = modoCorreo(env);
  if (m.modo === "smtp") return { origen: "vercel", config: m.config, ...(aviso ? { aviso } : {}) };
  return { origen: "ninguno", motivo: m.motivo, ...(aviso ? { aviso } : {}) };
}
