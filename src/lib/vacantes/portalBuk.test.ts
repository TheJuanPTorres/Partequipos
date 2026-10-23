import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AGENTE_LECTOR,
  leerPortalBuk,
  MarcadoCambiado,
  parsearPortalBuk,
  URL_PORTAL_BUK,
} from "./portalBuk";

/*
 * HTML INVENTADO con la forma del listado de Buk (leído el 2026-10-23): la
 * lista de list.js y una tarjeta por vacante. Ni cargos ni enlaces reales.
 */
const tarjeta = (cargo: string, lugar: string, codigo: string) => `
        <div class="jobs__card bg-basic-50 border-basic-400 pa-3 rounded-sm mb-3">
          <div class="row jobs__card-container">
            <div class="col-md-8 job__card-name">
              <b class="fw-700 line-height-5 font-size-16">${cargo}</b>
              <p class="d-none">Área ${cargo}</p>
              <div class="jobs__card-info">
                <span>${lugar}</span>
              </div>
            </div>
            <div class="col-md-4 jobs__card-btn d-flex justify-content-end">
              <a class="btn btn-secondary" target="_blank" rel="noopener" href="https://partequipos.buk.co/s/${codigo}">
                <span class="btn-label">Ver Empleo</span>
              </a>
            </div>
          </div>
        </div>`;

const pagina = (tarjetas: string) => `<!doctype html><html><body>
  <section id=Trabaja_Con_Nosotros class= no-curve>
    <h2 class="text-center">¡Trabaja Con Nosotros!</h2>
    <div data-paginate-list="{&quot;showOnLoad&quot;:true}">
      <form><input class="search form-control" type="search" name="filter" placeholder="Buscar empleos"></form>
      <div class="list">${tarjetas}
      </div>
    </div>
  </section></body></html>`;

describe("lector del portal de Buk", () => {
  it("saca cargo legible, ciudad y enlace de cada tarjeta", () => {
    const html = pagina(
      tarjeta("ANALISTA TIC - BOGOTÁ", "Bogotá, Bogotá, D.C.", "AAA111") +
        tarjeta("AUXILIAR DE BODEGA &amp; DESPACHOS- CÓRDOBA", "Montería, Córdoba", "BBB222"),
    );
    assert.deepEqual(parsearPortalBuk(html), [
      { cargo: "Analista TIC", ciudad: "Bogotá", enlace: "https://partequipos.buk.co/s/AAA111" },
      {
        cargo: "Auxiliar de bodega & despachos",
        ciudad: "Montería",
        enlace: "https://partequipos.buk.co/s/BBB222",
      },
    ]);
  });

  it("una lista vacía es «no hay vacantes», no un fallo", () => {
    assert.deepEqual(parsearPortalBuk(pagina("")), []);
  });

  it("sin la lista, MarcadoCambiado (no «cero vacantes»)", () => {
    assert.throws(
      () => parsearPortalBuk("<html><body>Mantenimiento</body></html>"),
      MarcadoCambiado,
    );
  });

  it("una tarjeta sin ciudad o sin enlace de Buk, MarcadoCambiado", () => {
    const sinCiudad = pagina(tarjeta("CARGO", "", "CCC333"));
    assert.throws(() => parsearPortalBuk(sinCiudad), MarcadoCambiado);
    const otroHost = pagina(
      tarjeta("CARGO", "Cali, Valle", "x").replace(
        "https://partequipos.buk.co/s/x",
        "https://otro.example/s/x",
      ),
    );
    assert.throws(() => parsearPortalBuk(otroHost), MarcadoCambiado);
  });

  it("no repite una vacante que sale dos veces", () => {
    const una = tarjeta("CARGO UNO", "Cali, Valle", "DDD444");
    assert.equal(parsearPortalBuk(pagina(una + una)).length, 1);
  });

  it("pide la página con su User-Agent, sin seguir redirecciones", async () => {
    let pedido: { url: string; init?: RequestInit } | null = null;
    const fetchFalso = (async (url: string, init?: RequestInit) => {
      pedido = { url, init };
      return new Response(pagina(tarjeta("CARGO", "Cali, Valle", "EEE555")), {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }) as unknown as typeof fetch;
    const vacantes = await leerPortalBuk(fetchFalso);
    assert.equal(vacantes.length, 1);
    assert.ok(pedido);
    const { url, init } = pedido as { url: string; init?: RequestInit };
    assert.equal(url, URL_PORTAL_BUK);
    assert.equal(init?.redirect, "manual");
    assert.equal((init?.headers as Record<string, string>)["User-Agent"], AGENTE_LECTOR);
  });

  it("lanza con un código distinto de 200 (también una redirección) o algo que no es HTML", async () => {
    const con = (status: number, tipo = "text/html") =>
      (async () =>
        new Response("x", {
          status,
          headers: { "content-type": tipo },
        })) as unknown as typeof fetch;
    await assert.rejects(leerPortalBuk(con(302)), /HTTP 302/);
    await assert.rejects(leerPortalBuk(con(503)), /HTTP 503/);
    await assert.rejects(leerPortalBuk(con(200, "application/json")), /no devolvió HTML/);
  });
});
