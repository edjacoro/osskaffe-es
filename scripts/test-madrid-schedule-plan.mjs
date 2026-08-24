import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const planStart = appSource.indexOf("const MADRID_SCHEDULE_SEED_VERSION");
const planEnd = appSource.indexOf("const HOLIDAY_SEED_VERSION", planStart);
assert.ok(planStart >= 0 && planEnd > planStart, "Debe poder aislarse el ciclo nuevo de Madrid.");

const buildPlan = new Function(
  `${appSource.slice(planStart, planEnd)}\nreturn { MADRID_SCHEDULE_PLAN_2026_08_31, DEFAULT_SCHEDULE_PLANS };`,
);
const { MADRID_SCHEDULE_PLAN_2026_08_31: plan, DEFAULT_SCHEDULE_PLANS: plans } = buildPlan();

const helperStart = appSource.indexOf("function dateKeyToUtcDay");
const helperEnd = appSource.indexOf("function getBaseShifts", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "Debe poder aislarse la selección de semanas.");
const buildHelpers = new Function(
  "isDateKey",
  `${appSource.slice(helperStart, helperEnd)}\nreturn { getSchedulePlanShiftsForDate };`,
);
const { getSchedulePlanShiftsForDate } = buildHelpers(
  (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value),
);

const hours = (shift) => {
  const decimal = (value) => {
    const [hour, minute] = value.split(":").map(Number);
    return hour + minute / 60;
  };
  return decimal(shift.end) - decimal(shift.start);
};

assert.equal(plan.effectiveFrom, "2026-08-31");
assert.equal(plan.cycleLength, 8);
assert.equal(plan.weeks.length, 8);
assert.equal(getSchedulePlanShiftsForDate(plans, "madrid", "2026-08-30"), null);

const expectedHours = {
  micaela: [33, 34, 34, 33, 33, 34, 34, 33],
  bonnie: [14, 14, 14, 14, 14, 14, 14, 19],
  perla: [28, 26, 27, 28, 28, 26, 26, 23],
  guillermo: [24, 25, 24, 24, 24, 25, 25, 24],
  "barista-tarde": [25, 25, 25, 25, 25, 25, 25, 25],
  mechi: [8, 8, 8, 8, 8, 8, 8, 8],
};

Object.entries(expectedHours).forEach(([employeeId, expected]) => {
  const actual = plan.weeks.map((week) => week.shifts
    .filter((shift) => shift.employeeId === employeeId)
    .reduce((total, shift) => total + hours(shift), 0));
  assert.deepEqual(actual, expected, `Horas incorrectas para ${employeeId}.`);
});

plan.weeks.forEach((week, index) => {
  const pdfHours = week.shifts
    .filter((shift) => shift.employeeId !== "mechi")
    .reduce((total, shift) => total + hours(shift), 0);
  assert.equal(pdfHours, 124, `La semana ${index + 1} debe conservar las 124 h del PDF.`);
});

const firstMonday = getSchedulePlanShiftsForDate(plans, "madrid", "2026-08-31");
const repeatedMonday = getSchedulePlanShiftsForDate(plans, "madrid", "2026-10-26");
assert.equal(firstMonday.weekIndex, 0);
assert.equal(repeatedMonday.weekIndex, 0, "El 26/10 debe reiniciar el ciclo de ocho semanas.");
assert.deepEqual(repeatedMonday.shifts, firstMonday.shifts);

const weekEightTuesday = getSchedulePlanShiftsForDate(plans, "madrid", "2026-10-20").shifts;
assert.ok(weekEightTuesday.some((shift) => shift.employeeId === "bonnie" && shift.start === "09:00"));
assert.ok(!weekEightTuesday.some((shift) => shift.employeeId === "perla"));
assert.ok(weekEightTuesday.some((shift) => shift.employeeId === "mechi" && shift.start === "09:00" && shift.end === "13:00"));

assert.match(appSource, /id: "guillermo",\s+label: "Guillermina"/);
assert.match(appSource, /id: "barista-tarde"[\s\S]*?canLogin: false[\s\S]*?testEmployee: true/);

console.log("OK: Madrid conserva el pasado y repite exactamente el ciclo de ocho semanas desde el 31/08.");
