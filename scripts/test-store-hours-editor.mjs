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
assert.match(appSource, /Confirmado en Netlify/, "Debe confirmar visualmente la persistencia.");
assert.match(appSource, /const editorLocationId = activeLocationId;/, "El editor debe conservar la tienda que se esta modificando.");
assert.match(appSource, /getLocationSettings\(locationId\)/, "Los horarios deben guardarse por separado para cada tienda.");
assert.match(appSource, /storeHoursDrafts\.set\(draftKey/, "Los cambios diarios deben sobrevivir las actualizaciones del estado.");
assert.match(appSource, /renderStoreHoursGeneralEditor\(\)/, "Debe mostrarse el editor de horarios generales.");
assert.match(html, /id="storeHoursGeneralForm"/, "Debe existir el formulario para futuros cambios generales.");
assert.match(html, /presioná GUARDAR en cada día modificado/);
assert.match(html, /app\.js\?v=90/);

const baselineMatch = appSource.match(/const BARCELONA_REGULAR_OPENING_SCHEDULES = (\{[\s\S]*?\n\});/);
assert.ok(baselineMatch, "Debe existir el cierre general de Barcelona desde el 1/11.");
const baselineRules = new Function(`return (${baselineMatch[1]});`)();
assert.deepEqual(baselineRules["2026-11-01"], {
  weekdays: { open: "08:30", close: "18:00" },
  saturday: { open: "09:00", close: "19:00" },
  sunday: { open: "10:00", close: "19:00" },
});

const ruleStart = appSource.indexOf("function getRegularOpeningSchedules");
const openingStart = appSource.indexOf("function getDefaultOpeningPeriodsForDate");
const openingEnd = appSource.indexOf("function getDefaultOpeningForDate", openingStart);
assert.ok(ruleStart >= 0 && openingStart > ruleStart && openingEnd > openingStart,
  "Debe poder comprobarse el horario efectivo por fecha.");
const getRegularOpeningRuleForDate = new Function(
  "activeLocationId", "normalizeLocationId", "getLocationSettings", "BARCELONA_REGULAR_OPENING_SCHEDULES",
  `${appSource.slice(ruleStart, openingStart)}\nreturn getRegularOpeningRuleForDate;`,
)("barcelona", (value) => value, () => ({ regularOpeningSchedules: {} }), baselineRules);
assert.equal(getRegularOpeningRuleForDate("2026-10-31", "barcelona"), null);
assert.equal(getRegularOpeningRuleForDate("2028-05-01", "barcelona").periods.weekdays.close, "18:00",
  "El cambio debe seguir vigente hasta que se guarde otra fecha general.");
const previousRule = {
  weekdays: { open: "08:30", close: "18:00" },
  saturday: { open: "09:00", close: "18:00" },
  sunday: { open: "10:00", close: "18:00" },
};
function resolverWithRules(regularOpeningSchedules) {
  return new Function(
    "activeLocationId", "normalizeLocationId", "getLocationSettings", "BARCELONA_REGULAR_OPENING_SCHEDULES",
    `${appSource.slice(ruleStart, openingStart)}\nreturn getRegularOpeningRuleForDate;`,
  )("barcelona", (value) => value, () => ({ regularOpeningSchedules }), baselineRules);
}
const fromPreviousSnapshot = resolverWithRules({ "2026-11-01": previousRule });
assert.deepEqual(fromPreviousSnapshot("2026-11-07", "barcelona").periods, baselineRules["2026-11-01"],
  "Una copia del valor anterior debe usar el nuevo horario sin perder los demas datos.");
assert.deepEqual(previousRule.saturday, { open: "09:00", close: "18:00" },
  "Resolver el horario no debe modificar la copia almacenada.");
const manuallySaved = { ...previousRule, _userConfigured: true };
assert.deepEqual(resolverWithRules({ "2026-11-01": manuallySaved })("2026-11-07", "barcelona").periods, manuallySaved,
  "Una edición posterior y explícita desde el editor debe respetarse.");
const differentRule = { ...previousRule, saturday: { open: "10:00", close: "20:00" } };
assert.deepEqual(resolverWithRules({ "2026-11-01": differentRule })("2026-11-07", "barcelona").periods, differentRule,
  "Una regla personalizada distinta no debe sustituirse.");
assert.deepEqual(resolverWithRules({ "2026-11-01": previousRule, "2028-05-01": differentRule })("2028-05-01", "barcelona").periods, differentRule,
  "Las reglas generales posteriores deben seguir teniendo prioridad.");
const getDefaultOpeningPeriodsForDate = new Function(
  "activeLocationId",
  "normalizeLocationId",
  "getHoliday",
  "getRegularOpeningPeriods",
  "formatHour",
  "MADRID_CONTINUOUS_HOURS_EFFECTIVE_FROM",
  "getRegularOpeningRuleForDate",
  `${appSource.slice(openingStart, openingEnd)}\nreturn getDefaultOpeningPeriodsForDate;`,
)(
  "madrid",
  (value) => value,
  (date, locationId) => locationId === "barcelona" && date === "2026-12-08"
    ? { open: "10:00", close: "19:00" }
    : null,
  (day, locationId) => locationId === "barcelona"
    ? [{ open: day === 0 ? 10 : day === 6 ? 9 : 8.5, close: 19 }]
    : day >= 1 && day <= 5
      ? [{ open: 8.5, close: 14 }, { open: 16, close: 20 }]
      : [{ open: 10, close: 14 }, { open: 16, close: 20 }],
  (value) => `${String(Math.floor(value)).padStart(2, "0")}:${value % 1 ? "30" : "00"}`,
  "2026-08-31",
  getRegularOpeningRuleForDate,
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
assert.deepEqual(getDefaultOpeningPeriodsForDate("2026-10-31", "barcelona"), [
  { open: "09:00", close: "19:00" },
], "Los horarios anteriores al 1/11 deben conservar su regla anterior.");
assert.deepEqual(getDefaultOpeningPeriodsForDate("2026-11-01", "barcelona"), [
  { open: "10:00", close: "19:00" },
]);
assert.deepEqual(getDefaultOpeningPeriodsForDate("2026-11-02", "barcelona"), [
  { open: "08:30", close: "18:00" },
]);
assert.deepEqual(getDefaultOpeningPeriodsForDate("2026-11-07", "barcelona"), [
  { open: "09:00", close: "19:00" },
]);
assert.deepEqual(getDefaultOpeningPeriodsForDate("2026-12-08", "barcelona"), [
  { open: "10:00", close: "18:00" },
], "Un festivo mantiene su apertura especial, pero cierra a las 18.");

const periodsStart = appSource.indexOf("function getOpeningPeriodsForDate");
const periodsEnd = appSource.indexOf("function calculateStoreCoverage", periodsStart);
const getOpeningPeriodsForDate = new Function(
  "activeLocationId", "normalizeLocationId", "derivedDataCache", "getOpeningOverride",
  "getDefaultOpeningPeriodsForDate", "timeToDecimal",
  `${appSource.slice(periodsStart, periodsEnd)}\nreturn getOpeningPeriodsForDate;`,
)("barcelona", (value) => value, { get: (_, producer) => producer() },
  (date) => date === "2026-11-03" ? { open: "08:30", close: "20:00", closed: false } : null,
  getDefaultOpeningPeriodsForDate,
  (value) => Number(value.slice(0, 2)) + Number(value.slice(3)) / 60);
assert.deepEqual(getOpeningPeriodsForDate("2026-11-03", "barcelona"), [{ open: 8.5, close: 20 }],
  "Una excepcion diaria ya guardada tiene prioridad sobre el cierre general.");

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
assert.match(appSource, /calculateStoreCoverage\(\s*getOpeningPeriodsForDate\(dateKey,\s*resolvedLocationId\),\s*getShiftsForDate\(dateKey,\s*resolvedLocationId\),?\s*\)/,
  "La apertura debe seguir usandose para calcular cobertura y horas libres.");

const saveOpeningStart = appSource.indexOf("async function saveOpeningOverride");
const saveOpeningEnd = appSource.indexOf("async function resetOpeningOverride", saveOpeningStart);
const saveOpeningSource = appSource.slice(saveOpeningStart, saveOpeningEnd);
assert.ok(
  saveOpeningSource.indexOf('persistStoreHoursChange("save"') < saveOpeningSource.indexOf("updateLocationSettings"),
  "El horario solo debe aplicarse localmente despues de que Netlify confirme el guardado.",
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

const savedRule = applyStoreHoursUpdate(initial, {
  action: "save-rule",
  locationId: "barcelona",
  effectiveFrom: "2028-05-01",
  periods: baselineRules["2026-11-01"],
});
assert.deepEqual(savedRule.locationSettings.barcelona.regularOpeningSchedules["2028-05-01"],
  { ...baselineRules["2026-11-01"], _userConfigured: true });
assert.deepEqual(savedRule.locationSettings.barcelona.monthlyOpeningHours,
  initial.locationSettings.barcelona.monthlyOpeningHours,
  "Guardar un horario general no debe borrar excepciones diarias.");
assert.deepEqual(savedRule.locationSettings.madrid, initial.locationSettings.madrid,
  "Un horario general de Barcelona no debe cambiar Madrid.");

console.log("OK: los horarios comerciales se guardan por tienda y no limitan los turnos de empleados.");
