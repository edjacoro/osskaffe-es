import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const migrationSource = fs.readFileSync(new URL("../netlify/functions/madrid-schedule-migration.mjs", import.meta.url), "utf8");
const migrationStart = migrationSource.indexOf("const MIGRATION_VERSION");
const migrationEnd = migrationSource.indexOf("export default async", migrationStart);
const applyMadridOctoberScheduleMigration = new Function(
  "normalizeLocationId",
  `${migrationSource.slice(migrationStart, migrationEnd).replace("export function applyMadridOctoberScheduleMigration", "function applyMadridOctoberScheduleMigration")}\nreturn applyMadridOctoberScheduleMigration;`,
)((value) => value === "madrid" ? "madrid" : "barcelona");
const planStart = appSource.indexOf("function buildMadridOctoberScheduleWeek");
const planEnd = appSource.indexOf("const HOLIDAY_SEED_VERSION", planStart);
assert.ok(planStart >= 0 && planEnd > planStart, "Debe poder aislarse el ciclo nuevo de Madrid.");
const { MADRID_SCHEDULE_PLAN_2026_10_12: plan, DEFAULT_SCHEDULE_PLANS: plans } = new Function(
  `const MADRID_SCHEDULE_PLAN_2026_08_31 = { id: "madrid-2026-08-31-8-semanas", locationId: "madrid", effectiveFrom: "2026-08-31", cycleLength: 8, weeks: Array.from({ length: 8 }, () => ({ shifts: [] })) };\nconst MADRID_OCTOBER_SCHEDULE_PLAN_ID = "madrid-2026-10-12-4-semanas";\n${appSource.slice(planStart, planEnd)}\nreturn { MADRID_SCHEDULE_PLAN_2026_10_12, DEFAULT_SCHEDULE_PLANS };`,
)();

const helperStart = appSource.indexOf("function dateKeyToUtcDay");
const helperEnd = appSource.indexOf("function resolveMadridPlanEmployeeId", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "Debe poder aislarse la selección del ciclo.");
const { getSchedulePlanShiftsForDate } = new Function(
  "isDateKey",
  `${appSource.slice(helperStart, helperEnd)}\nreturn { getSchedulePlanShiftsForDate };`,
)((value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
const overrideStart = appSource.indexOf("function shouldUseEmployeeScheduleOverride");
const overrideEnd = appSource.indexOf("function resolveMadridPlanEmployeeId", overrideStart);
const { shouldUseEmployeeScheduleOverride } = new Function(
  `${appSource.slice(overrideStart, overrideEnd)}\nreturn { shouldUseEmployeeScheduleOverride };`,
)();

assert.equal(plan.id, "madrid-2026-10-12-4-semanas");
assert.equal(plan.effectiveFrom, "2026-10-12");
assert.equal(plan.cycleLength, 4);
assert.equal(plan.weekOffset, 1);
assert.deepEqual(plan.managedEmployeeIds, ["micaela", "ignacio", "perla", "guillermo", "bonnie", "mechi"]);
assert.equal(plans.madrid.length, 2, "El ciclo de agosto permanece y el nuevo se agrega aparte.");
assert.equal(getSchedulePlanShiftsForDate(plans, "madrid", "2026-10-11").plan.id,
  "madrid-2026-08-31-8-semanas");
assert.equal(getSchedulePlanShiftsForDate(plans, "madrid", "2026-10-12").weekIndex, 1);
assert.equal(getSchedulePlanShiftsForDate(plans, "madrid", "2026-10-19").weekIndex, 2);
assert.equal(getSchedulePlanShiftsForDate(plans, "madrid", "2026-10-26").weekIndex, 3);
assert.equal(getSchedulePlanShiftsForDate(plans, "madrid", "2026-11-02").weekIndex, 0);
assert.equal(getSchedulePlanShiftsForDate(plans, "madrid", "2027-02-01").weekIndex, 1,
  "El ciclo continúa repitiéndose en meses futuros.");
assert.equal(shouldUseEmployeeScheduleOverride({ effectiveFrom: "2026-09-01" }, plan, true), false,
  "Las versiones antiguas de ficha no pisan el ciclo nuevo.");
assert.equal(shouldUseEmployeeScheduleOverride({ effectiveFrom: "2026-10-20" }, plan, true), true,
  "Las ediciones futuras de ficha sí pueden prevalecer desde su fecha.");
assert.equal(shouldUseEmployeeScheduleOverride({ effectiveFrom: "2026-09-01" }, plan, false), true,
  "El ciclo no modifica las fichas que no administra.");

const expectedHours = {
  micaela: [34, 34, 32, 32],
  ignacio: [24, 27, 24, 28],
  perla: [26, 23, 28, 24],
  guillermo: [23, 23, 23, 23],
  bonnie: [14, 14, 14, 14],
  mechi: [8, 8, 8, 8],
};
const hours = (shift) => {
  const decimal = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour + minute / 60;
  };
  return decimal(shift.end) - decimal(shift.start);
};
Object.entries(expectedHours).forEach(([employeeId, expected]) => {
  const actual = plan.weeks.map((week) => week.shifts
    .filter((shift) => shift.employeeId === employeeId)
    .reduce((sum, shift) => sum + hours(shift), 0));
  assert.deepEqual(actual, expected, `Horas incorrectas para ${employeeId}.`);
});

const current = {
  employees: [
    ...Object.keys(expectedHours).filter((id) => id !== "ignacio")
      .map((id) => ({ id, locationId: "madrid" })),
    { id: "pato", label: "Ignacio", locationId: "madrid" },
    { id: "chelo", label: "Chelo", locationId: "barcelona" },
  ],
  profiles: { pato: { fullName: "Ignacio" } },
  changes: [
    { id: "madrid-nov", locationId: "madrid", date: "2026-11-14" },
    { id: "madrid-dec", locationId: "madrid", date: "2026-12-31" },
    { id: "barcelona-nov", locationId: "barcelona", date: "2026-11-14" },
    { id: "madrid-oct", locationId: "madrid", date: "2026-10-31" },
    { id: "madrid-jan", locationId: "madrid", date: "2027-01-01" },
  ],
  schedulePlans: {
    madrid: [{ id: "madrid-2026-08-31-8-semanas", effectiveFrom: "2026-08-31", cycleLength: 8, weeks: [] }],
    barcelona: [{ id: "barcelona-plan", effectiveFrom: "2026-01-01", cycleLength: 1, weeks: [{ shifts: [] }] }],
  },
};
const migrated = applyMadridOctoberScheduleMigration(current, { plan });
assert.equal(migrated.madridOctoberScheduleMigrationVersion, 1);
assert.equal(migrated.schedulePlans.madrid.length, 2, "Se preserva el plan anterior y se agrega el nuevo.");
assert.equal(migrated.schedulePlans.madrid.find((item) => item.id === plan.id).weeks[0].shifts
  .find((shift) => shift.employeeId === "pato").employeeId, "pato", "Ignacio se vincula a la ficha existente.");
assert.ok(migrated.schedulePlans.madrid.find((item) => item.id === plan.id).managedEmployeeIds.includes("pato"));
assert.deepEqual(migrated._madridOctoberScheduleMigrationRemovedChangeIds, ["madrid-nov", "madrid-dec"]);
assert.deepEqual(migrated.changes.map((change) => change.id), ["barcelona-nov", "madrid-oct", "madrid-jan"]);
assert.equal(migrated.schedulePlans.barcelona, current.schedulePlans.barcelona);

const afterMigration = {
  ...migrated,
  changes: [...migrated.changes, { id: "madrid-new-nov", locationId: "madrid", date: "2026-11-20" }],
};
const retried = applyMadridOctoberScheduleMigration(afterMigration, { plan });
assert.ok(retried.changes.some((change) => change.id === "madrid-new-nov"),
  "El reintento no borra cambios de Madrid creados después de la limpieza inicial.");
assert.deepEqual(retried._madridOctoberScheduleMigrationRemovedChangeIds, []);

console.log("OK: el ciclo nuevo queda alineado al 02/11, conserva lo anterior, mantiene a Mechi y limpia una sola vez los cambios Madrid de noviembre-diciembre.");
