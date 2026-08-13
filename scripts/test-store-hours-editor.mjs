import assert from "node:assert/strict";
import fs from "node:fs";
import { applyStoreHoursUpdate } from "../netlify/functions/store-hours.mjs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(appSource, /data-store-save>Guardar<\/button>/, "Cada dia debe tener un boton Guardar.");
assert.match(appSource, /saveButton\.addEventListener\("click", persist\)/, "El horario se guarda al pulsar el boton.");
assert.doesNotMatch(
  appSource,
  /(?:openInput|closeInput)\.addEventListener\("change", persist\)/,
  "No debe validar mientras el usuario todavia esta completando la hora.",
);
assert.match(appSource, /fetch\("\/api\/store-hours"/, "El horario debe usar una escritura pequena y especifica.");
assert.match(appSource, /saveState\(\{ shared: false \}\);/, "El horario no debe reenviar toda la base por cada dia.");
assert.match(appSource, /Guardado en Netlify/, "Debe confirmar visualmente la persistencia.");
assert.match(appSource, /const editorLocationId = activeLocationId;/, "El editor debe conservar la tienda que se esta modificando.");
assert.match(appSource, /getLocationSettings\(locationId\)/, "Los horarios deben guardarse por separado para cada tienda.");
assert.match(html, /presioná GUARDAR en cada día modificado/);
assert.match(html, /app\.js\?v=54/);

const initial = {
  sales: [{ id: "venta-historica", items: [{ name: "Flat White", qty: 1 }] }],
  settings: { adminPin: "protegido", monthlyOpeningHours: {} },
  locationSettings: {
    barcelona: { monthlyOpeningHours: { "2026-08-01": { open: "09:00", close: "19:00", closed: false } } },
    madrid: { monthlyOpeningHours: {} },
  },
};
const saved = applyStoreHoursUpdate(initial, {
  action: "save",
  locationId: "madrid",
  date: "2026-08-03",
  open: "08:30",
  close: "14:00",
  closed: false,
});
assert.deepEqual(saved.sales, initial.sales, "El guardado puntual no debe alterar ventas historicas.");
assert.deepEqual(saved.locationSettings.madrid.monthlyOpeningHours["2026-08-03"], {
  open: "08:30",
  close: "14:00",
  closed: false,
});
assert.deepEqual(
  saved.locationSettings.barcelona.monthlyOpeningHours,
  initial.locationSettings.barcelona.monthlyOpeningHours,
  "Madrid y Barcelona deben conservar horarios independientes.",
);
const reset = applyStoreHoursUpdate(saved, {
  action: "reset",
  locationId: "madrid",
  date: "2026-08-03",
});
assert.equal(reset.locationSettings.madrid.monthlyOpeningHours["2026-08-03"], undefined);

console.log("OK: los horarios se guardan por dia sin reenviar la base completa a Netlify.");
