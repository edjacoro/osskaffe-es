import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const helperStart = appSource.indexOf("function isLeaveReason");
const helperEnd = appSource.indexOf("function getBaseShifts", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "Debe poder aislarse la logica de ausencias.");

const buildHelpers = new Function(
  "normalizedAccessText",
  "isDateKey",
  "formatHumanDate",
  "timeToDecimal",
  "makeShift",
  `${appSource.slice(helperStart, helperEnd)}\nreturn { isLeaveReason, isExtraReason, isRangeChangeReason, getChangeEndDate, changeAppliesToDate, isFullDayChange, applyApprovedChangesToShifts };`,
);
const helpers = buildHelpers(
  (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
  (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value),
  (value) => value,
  (value) => {
    const [hours, minutes] = String(value || "").split(":").map(Number);
    return hours + minutes / 60;
  },
  (employeeId, start, end, source) => ({ employeeId, start, end, source }),
);

const guillermoVacation = {
  employeeId: "guillermo",
  date: "2026-08-01",
  endDate: "2026-08-16",
  reason: "Vacaciones",
  action: "absence",
  start: "08:00",
  end: "14:00",
  status: "approved",
};
assert.equal(helpers.changeAppliesToDate(guillermoVacation, "2026-08-01"), true);
assert.equal(helpers.changeAppliesToDate(guillermoVacation, "2026-08-16"), true);
assert.equal(helpers.changeAppliesToDate(guillermoVacation, "2026-08-17"), false);
assert.equal(helpers.isFullDayChange(guillermoVacation), true, "Vacaciones heredadas deben cubrir la jornada completa.");
assert.equal(helpers.isRangeChangeReason("Extra"), true, "Los extras deben admitir un intervalo de fechas.");

const multiDayExtra = {
  employeeId: "micaela",
  date: "2026-08-20",
  endDate: "2026-08-23",
  reason: "Extra",
  action: "extra",
  start: "16:00",
  end: "20:00",
  status: "approved",
};
assert.equal(helpers.changeAppliesToDate(multiDayExtra, "2026-08-22"), true);
assert.equal(helpers.changeAppliesToDate(multiDayExtra, "2026-08-24"), false);
assert.deepEqual(
  helpers.applyApprovedChangesToShifts([], [multiDayExtra]),
  [{ employeeId: "micaela", start: 16, end: 20, source: "extra" }],
);

const shifts = [
  { employeeId: "guillermo", start: 16, end: 20 },
  { employeeId: "micaela", start: 8.5, end: 14 },
];
assert.deepEqual(
  helpers.applyApprovedChangesToShifts(shifts, [guillermoVacation]),
  [{ employeeId: "micaela", start: 8.5, end: 14 }],
  "Una vacacion aprobada debe quitar tambien los turnos de tarde de Guillermo.",
);

assert.match(html, /id="changeDateEnd"/);
assert.match(html, /id="empChangeDateEnd"/);
assert.equal((html.match(/<option>Licencia<\/option>/g) || []).length, 2);
assert.equal((html.match(/<option>Extra<\/option>/g) || []).length, 2);
assert.match(html, /app\.js\?v=70/);
assert.match(appSource, /const endDate = ranged \? els\.changeDateEnd\.value : date/);
assert.match(appSource, /action: extra \? "extra" : "absence"/);
assert.match(appSource, /change\.status === "approved" && changeAppliesToDate\(change, dateKey\)/);
assert.match(appSource, /async function updateChangeStatus[\s\S]*?persistChangeMutation\(\{ action: "review", id, status \}\)/);

console.log("OK: vacaciones, licencias y extras admiten intervalos y se aplican a cada fecha.");
