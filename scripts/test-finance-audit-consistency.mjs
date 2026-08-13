import assert from "node:assert/strict";
import fs from "node:fs";
import { mergeBistroSaleDetail } from "../netlify/functions/_shared.mjs";

const previous = {
  id: "bistro-barcelona-ticket-1",
  bistroId: "bistro-ticket-1",
  date: "2026-08-05",
  detailStatus: "complete",
  detailAttempts: 2,
  items: [
    { name: "Flat White", qty: 2 },
    { name: "Cookie", qty: 1 },
    { name: "Banana Bread", qty: 1 },
  ],
};

const monthlyVersion = {
  ...previous,
  detailAttempts: 0,
  items: [{ name: "Flat White", qty: 2 }],
};

const merged = mergeBistroSaleDetail(monthlyVersion, previous, "barcelona");
assert.deepEqual(merged.items, previous.items, "La lectura mensual no debe reemplazar el detalle diario completo.");
assert.equal(merged.detailAttempts, 2, "Deben conservarse los intentos de detalle ya realizados.");
assert.equal(merged.detailStatus, "complete");

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.match(appSource, /const barcelonaMetrics = calcDayMetricsForLocation\(dateKey, 'barcelona'\)/);
assert.match(appSource, /const madridMetrics = calcDayMetricsForLocation\(dateKey, 'madrid'\)/);
assert.match(appSource, /function calcDayMetrics\(date\) \{\s*return calcDayMetricsForLocation\(date, activeLocationId\);/);
assert.match(
  appSource,
  /syncBistrosoftDay\(finTodayDate, true, \{ skipItemEnrichment: true \}\)/,
  "Al elegir una fecha debe hacer primero una lectura rapida sin bloquear la interfaz.",
);
assert.match(
  appSource,
  /startBistrosoftDayDetailRepair\(\{ automatic: true \}\)/,
  "Una fecha incompleta debe iniciar automaticamente su reparacion puntual.",
);
assert.match(
  appSource,
  /details-day-start/,
  "La reparacion puntual debe usar su propio trabajo de fondo.",
);
assert.match(
  appSource,
  /startBistrosoftMissingBackfillOnce\(\)/,
  "La apertura como administrador debe iniciar la carga unica de dias pasados incompletos.",
);
assert.match(
  appSource,
  /details-auto-start/,
  "La carga unica debe quedar controlada por Netlify y no por el navegador.",
);

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /class="role-back-button" id="backToStep1a"/);
assert.match(html, /id="finSyncDay"[^>]*>CARGAR PRODUCTOS DEL DÍA<\/button>/);
assert.equal((html.match(/id="backToStep1a"/g) || []).length, 1, "El botón Volver debe tener un ID único.");

console.log("OK: Finanzas repara productos por fecha en segundo plano y conserva Auditoria.");
