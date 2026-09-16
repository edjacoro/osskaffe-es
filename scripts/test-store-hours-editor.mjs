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
assert.match(appSource, /sendSharedMutation\("\/api\/store-hours"/, "El horario debe usar una escritura pequena y especifica.");
assert.match(appSource, /saveState\(\{ shared: false \}\);/, "El horario no debe reenviar toda la base por cada dia.");
assert.match(appSource, /Guardado en Netlify/, "Debe confirmar visualmente la persistencia.");
assert.match(appSource, /const editorLocationId = activeLocationId;/, "El editor debe conservar la tienda que se esta modificando.");
assert.match(appSource, /getLocationSettings\(locationId\)/, "Los horarios deben guardarse por separado para cada tienda.");
assert.match(html, /presioná GUARDAR en cada día modificado/);
assert.match(html, /app\.js\?v=73/);

const openingStart = appSource.indexOf("function getDefaultOpeningPeriodsForDate");
const openingEnd = appSource.indexOf("function getDefaultOpeningForDate", openingStart);
assert.ok(openingStart >= 0 && openingEnd > openingStart, "Debe poder comprobarse el horario efectivo por fecha.");
const getDefaultOpeningPeriodsForDate = new Function(
  "activeLocationId",
  "normalizeLocationId",
  "getHoliday",
  "getRegularOpeningPeriods",
  "formatHour",
  "MADRID_CONTINUOUS_HOURS_EFFECTIVE_FROM",
  `${appSource.slice(openingStart, openingEnd)}\nreturn getDefaultOpeningPeriodsForDate;`,
)(
  "madrid",
  (value) => value,
  () => null,
  (day) => day >= 1 && day <= 5
    ? [{ open: 8.5, close: 14 }, { open: 16, close: 20 }]
    : [{ open: 10, close: 14 }, { open: 16, close: 20 }],
  (value) => `${String(Math.floor(value)).padStart(2, "0")}:${value % 1 ? "30" : "00"}`,
  "2026-08-31",
);
assert.deepEqual(getDefaultOpeningPeriodsForDate("2026-08-31", "madrid"), [
  { open: "08:00", close: "19:00" },
], "Madrid debe abrir de corrido entre semana desde el 31/08.");
assert.deepEqual(getDefaultOpeningPeriodsForDate("2026-09-05", "madrid"), [
  { open: "10:00", close: "20:00" },
], "Madrid debe abrir de corrido los fines de semana desde el 31/08.");
assert.equal(
  getDefaultOpeningPeriodsForDate("2026-08-30", "madrid").length,
  2,
  "El horario historico hasta el 30/08 debe quedar intacto.",
);

const shiftResolverStart = appSource.indexOf("function getShiftsForDate");
const shiftResolverEnd = appSource.indexOf("function getOpenLabel", shiftResolverStart);
assert.ok(shiftResolverStart >= 0 && shiftResolverEnd > shiftResolverStart,
  "Debe poder comprobarse la resolucion final de turnos.");
const shiftResolverSource = appSource.slice(shiftResolverStart, shiftResolverEnd);
assert.match(shiftResolverSource, /applyApprovedChangesToShifts/,
  "Los cambios aprobados deben seguir aplicandose a la grilla.");
assert.doesNotMatch(shiftResolverSource, /getOpeningPeriodsForDate|constrainShiftsToOpeningPeriods/,
  "Los horarios comerciales no deben recortar ni eliminar turnos de empleados.");
assert.doesNotMatch(appSource, /function constrainShiftsToOpeningPeriods/,
  "No debe quedar activa la antigua regla de media hora antes o despues del local.");
assert.match(appSource, /calculateStoreCoverage\(getOpeningPeriodsForDate\(dateKey\), getShiftsForDate\(dateKey\)\)/,
  "La apertura debe seguir usandose para calcular cobertura y horas libres.");

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

console.log("OK: los horarios comerciales se guardan por tienda y no limitan los turnos de empleados.");
