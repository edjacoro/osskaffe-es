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

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /class="role-back-button" id="backToStep1a"/);
assert.equal((html.match(/id="backToStep1a"/g) || []).length, 1, "El botón Volver debe tener un ID único.");

console.log("OK: Auditoria usa el calculo diario, preserva el mejor detalle y Team tiene Volver.");
