# «Kit de marca» en las páginas de marca de maquinaria nueva

Diseño del cliente («Kit de marca») para `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/<marca>/`.
Se elige por marca con «Diseño de la página» → «Kit de marca» en el panel; hasta entonces, ninguna
marca cambia.

## Fase 1: Case (PR #353)

Cabecera partida con foto de fondo, placa con el logo, píldora de navegación que sale cuando la
cabecera deja la pantalla, cinta continua de equipos y una sección por tipo con su render recortado
y, si el cliente da permiso, el emblema (águila Old Abe) de fondo. Imágenes por marca y por tipo
desde el panel; el emblema tiene su propia casilla, apagada por defecto en producción.
Siembra: `scripts/marca-kit/marca-kit.ts` (`runbook-marca-kit-case.md`).

## Fase 2: Dynapac, Hitachi y Yanmar

Mismos componentes con **sus datos** y los **respaldos** del diseño: sin foto de fondo (panel
oscuro liso), sin emblema y, en cada tipo, el render si lo hay; si no, la «Imagen de la tarjeta» del
tipo y, si tampoco, la primera foto de sus equipos. El color de la marca sale del campo «Color de
la marca» (`--acento`) y el texto se pone en negro o blanco según el contraste (`--tinta`).
Interruptor: `scripts/marca-kit/marcas-kit-fase2.ts` (`aplicar` / `retirar`, con manifiesto).

### Tipos «paraguas» de Dynapac

«Pavimentadoras» y «Compactadores» agrupan otros tipos (`subtipos`) y no tienen equipos propios.
Como solo se pinta una sección por tipo **con equipos directos**, no generan sección, ni entrada en
la cinta ni en la píldora: sus equipos salen en las secciones de sus subtipos (Pavimentadora, Reglas;
Compactador de suelo, de llantas y de doble rodillo). Sus páginas de tipo siguen listándolos por
grupos como hasta ahora.

### Qué falta pedir al cliente (no está en su kit)

| Marca   | Render de cada tipo                         | Foto de fondo | Emblema          | Logo del kit  |
| ------- | ------------------------------------------- | ------------- | ---------------- | ------------- |
| Dynapac | 5 (pavimentadora, reglas y 3 compactadores) | sí            | sí (rinoceronte) | sí            |
| Hitachi | 2 (excavadora y miniexcavadora)             | sí            | sí (Ojo Hitachi) | no hace falta |
| Yanmar  | 1 (miniexcavadora)                          | sí            | sí (libélula)    | no hace falta |

Hitachi y Yanmar ya tienen logo e imagen de tarjeta en el panel; Dynapac tiene tarjeta y logo.
Cada emblema necesita además el permiso de uso del cliente, como el de Case.
