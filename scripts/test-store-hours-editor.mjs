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
assert.match(html, /app\.js\?v=70/);

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

const constraintStart = appSource.indexOf("function constrainShiftsToOpeningPeriods");
const constraintEnd = appSource.indexOf("function getOpenLabel", constraintStart);
assert.ok(constraintStart >= 0 && constraintEnd > constraintStart, "Debe existir el ajuste de turnos al horario de tienda.");
const constrainShiftsToOpeningPeriods = new Function(
  `${appSource.slice(constraintStart, constraintEnd)}\nreturn constrainShiftsToOpeningPeriods;`,
)();

const shortened = constrainShiftsToOpeningPeriods([
  { employeeId: "apertura", start: 8, end: 14, source: "manual" },
  { employeeId: "cierre", start: 12, end: 20, source: "manual" },
  { employeeId: "tarde", start: 16, end: 20, source: "base" },
], [{ open: 8.5, close: 14 }]);
assert.deepEqual(shortened, [
  { employeeId: "apertura", start: 8, end: 14, source: "manual" },
  { employeeId: "cierre", start: 12, end: 14.5, source: "manual" },
], "Debe conservar media hora de apertura/cierre y anular los turnos posteriores.");
assert.deepEqual(
  constrainShiftsToOpeningPeriods([{ employeeId: "ana", start: 8, end: 20 }], []),
  [],
  "Un dia cerrado no puede conservar horas cargadas.",
);
assert.deepEqual(
  constrainShiftsToOpeningPeriods(
    [{ employeeId: "ana", start: 8, end: 20.5 }],
    [{ open: 8.5, close: 14 }, { open: 16, close: 20 }],
  ),
  [
    { employeeId: "ana", start: 8, end: 14.5 },
    { employeeId: "ana", start: 16, end: 20.5 },
  ],
  "El horario partido debe quitar el tramo en que la tienda permanece cerrada.",
);
assert.deepEqual(
  constrainShiftsToOpeningPeriods(
    [{ employeeId: "tarde", start: 15.5, end: 20 }],
    [{ open: 8.5, close: 14 }, { open: 16, close: 20 }],
  ),
  [{ employeeId: "tarde", start: 16, end: 20 }],
  "La reapertura de la tarde no debe agregar media hora de preparacion.",
);
assert.deepEqual(
  constrainShiftsToOpeningPeriods([
    { employeeId: "micaela", start: 7.5, end: 14.5 },
    { employeeId: "guillermo", start: 9, end: 14 },
    { employeeId: "barista-tarde", start: 14.5, end: 19.5 },
  ], [{ open: 8, close: 19 }]),
  [
    { employeeId: "micaela", start: 7.5, end: 14.5 },
    { employeeId: "guillermo", start: 9, end: 14 },
    { employeeId: "barista-tarde", start: 14.5, end: 19.5 },
  ],
  "El horario continuo no debe recortar los turnos del PDF.",
);

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
