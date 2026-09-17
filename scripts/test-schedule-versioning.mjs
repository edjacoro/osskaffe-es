import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { upsertTeamMemberState } from "../netlify/functions/_team.mjs";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const helperStart = appSource.indexOf("function selectScheduleVersion");
const helperEnd = appSource.indexOf("function getEmployeeScheduleVersionForDate", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "Deben existir helpers comprobables para versionar la grilla.");

const helpers = new Function(
  "isDateKey",
  `${appSource.slice(helperStart, helperEnd)}\nreturn { selectScheduleVersion, upsertScheduleVersion };`,
)((value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));

const original = {
  mode: "weekly",
  weeks: { a: {}, b: {} },
  versions: [
    { effectiveFrom: "2026-09-01", marker: "primera" },
    { effectiveFrom: "2026-09-17", marker: "segunda" },
  ],
};
assert.equal(helpers.selectScheduleVersion(original, "2026-09-16")?.marker, "primera");
assert.equal(helpers.selectScheduleVersion(original, "2026-09-17")?.marker, "segunda");
assert.equal(helpers.selectScheduleVersion(original, "2026-08-31"), null,
  "Una version futura nunca debe modificar dias anteriores.");

const replaced = helpers.upsertScheduleVersion(original, { effectiveFrom: "2026-09-17", marker: "corregida" });
assert.deepEqual(replaced.versions.map((version) => version.effectiveFrom), ["2026-09-01", "2026-09-17"]);
assert.equal(helpers.selectScheduleVersion(replaced, "2026-09-18")?.marker, "corregida");

const baseShiftsStart = appSource.indexOf("function getBaseShifts");
const baseShiftsEnd = appSource.indexOf("function getShiftsForDate", baseShiftsStart);
assert.ok(baseShiftsStart >= 0 && baseShiftsEnd > baseShiftsStart);
const getBaseShifts = new Function(
  "getSchedulePlanShiftsForDate",
  "state",
  "activeLocationId",
  "parseDateKey",
  "getAllEmployees",
  "normalizeLocationId",
  "getEmployeeScheduleVersionForDate",
  "getEmployeeScheduleForDate",
  "getScheduleWeekKey",
  "makeShift",
  "timeToDecimal",
  `${appSource.slice(baseShiftsStart, baseShiftsEnd)}\nreturn getBaseShifts;`,
)(
  (_plans, _locationId, dateKey) => ({
    plan: { sourceLabel: "Ciclo", weeks: [{ shifts: [{ employeeId: "ana" }] }] },
    weekIndex: 0,
    shifts: [{ employeeId: "ana", start: "09:00", end: "14:00" }],
    dateKey,
  }),
  { schedulePlans: {} },
  "madrid",
  (dateKey) => new Date(`${dateKey}T12:00:00`),
  () => [{ id: "ana", locationId: "madrid" }],
  (value) => value,
  (_employeeId, dateKey) => dateKey >= "2026-09-17" ? { effectiveFrom: "2026-09-17" } : null,
  () => ({ mode: "weekly", weeks: { a: { 4: [{ start: "10:00", end: "16:00" }] }, b: {} } }),
  () => "a",
  (employeeId, start, end, source) => ({ employeeId, start, end, source }),
  (value) => {
    const [hours, minutes] = String(value).split(":").map(Number);
    return hours + minutes / 60;
  },
);
assert.deepEqual(getBaseShifts("2026-09-16").map(({ employeeId, start, end }) => ({ employeeId, start, end })), [
  { employeeId: "ana", start: 9, end: 14 },
], "Antes de la edicion debe mantenerse la programacion historica.");
assert.deepEqual(getBaseShifts("2026-09-17").map(({ employeeId, start, end }) => ({ employeeId, start, end })), [
  { employeeId: "ana", start: 10, end: 16 },
], "Desde la fecha efectiva debe usarse la nueva grilla de la ficha.");

const persisted = upsertTeamMemberState({
  employees: [{ id: "ana", label: "Ana", role: "Barista", locationId: "barcelona", active: true }],
  baseSchedules: {},
}, {
  employee: { id: "ana", label: "Ana", role: "Barista", locationId: "barcelona", active: true },
  baseSchedule: {
    mode: "weekly",
    weeks: { a: {}, b: {} },
    versions: [{ effectiveFrom: "2026-09-17", mode: "weekly", weeks: { a: {}, b: {} } }],
  },
});
assert.equal(persisted.baseSchedules.ana.versions[0].effectiveFrom, "2026-09-17");

assert.match(appSource, /saveEmployeeBaseScheduleVersion\(employeeId, nextSchedule, effectiveFrom\)/);
assert.match(appSource, /Los horarios que modifiques se aplicarán desde/);
assert.doesNotMatch(appSource, /data-schedule-locked/,
  "Las fichas asociadas a una planificacion anterior ya no deben quedar bloqueadas.");

console.log("OK: las fichas quedan editables y cada nueva grilla rige desde su fecha sin reescribir el pasado.");
