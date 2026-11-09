import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.match(html, /id="pdfWeekPicker"/);
assert.match(html, /id="printWeekPdf"[^>]*>PDF semana</i);
assert.match(html, /id="printPdf"[^>]*>PDF mes</i);
assert.match(html, /id="printGridRoot"/);
assert.match(html, /app\.js\?v=90/);
assert.match(html, /styles\.css\?v=52/);

assert.match(appSource, /const SCHEDULE_TIMELINE_START = 7/);
assert.match(appSource, /const SCHEDULE_TIMELINE_END = 22/);
assert.match(appSource, /function exportSelectedWeekPdf/);
assert.match(appSource, /function exportActiveMonthPdf/);
assert.match(appSource, /function printScheduleRangesAsPdf/);
assert.match(appSource, /function exportCsv\(\)[\s\S]*?getVisibleShiftsForDate\(dateKey\)/,
  "El CSV debe respetar los empleados visibles.");
assert.match(appSource, /function renderPrintableScheduleDay\(dateKey\)[\s\S]*?getVisibleShiftsForDate\(dateKey\)/,
  "El PDF debe respetar los empleados visibles.");

assert.match(css, /\.schedule-ruler,\s*\n\.day-row\s*\{[\s\S]*?min-width:\s*1260px/);
assert.match(css, /\.schedule-ruler\s*\{[\s\S]*?position:\s*static/,
  "La regla no debe montarse sobre la primera fila.");
assert.match(css, /\.timeline\s*\{[\s\S]*?overflow:\s*hidden/,
  "Los turnos nunca deben invadir la columna Horas.");
assert.match(css, /body\.print-grid-export > \.print-grid-root/);
assert.match(css, /\.print-open-period/);

const helpersStart = appSource.indexOf("function getMondayForDate");
const helpersEnd = appSource.indexOf("function renderPdfWeekPicker", helpersStart);
assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, "Deben poder aislarse las semanas del mes.");
const getMonthWeekRanges = new Function(
  "activeMonth",
  "toDateInput",
  `${appSource.slice(helpersStart, helpersEnd)}\nreturn getMonthWeekRanges;`,
)(
  new Date(2026, 8, 1),
  (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
);
const septemberWeeks = getMonthWeekRanges(new Date(2026, 8, 1));
assert.equal(septemberWeeks.length, 5);
assert.deepEqual(septemberWeeks[0], { start: "2026-08-31", end: "2026-09-06" });
assert.deepEqual(septemberWeeks[4], { start: "2026-09-28", end: "2026-10-04" });

const legendStart = appSource.indexOf("function renderLegend()");
const legendEnd = appSource.indexOf("function getHiddenGridEmployees()", legendStart);
assert.ok(legendStart >= 0 && legendEnd > legendStart);
const renderLegendForTest = new Function("context", `
  const { els, activeMonth, appRole, getHiddenGridEmployees, getMonthDays, toDateInput,
    getEmployeesForMonth, getShiftsForDate, formatHours, escapeHtml } = context;
  ${appSource.slice(legendStart, legendEnd)}
  return renderLegend();
`);
const employeeLegend = { innerHTML: "" };
const shiftsByDate = {
  "2026-11-02": [{ employeeId: "bonnie", start: 9, end: 12 }, { employeeId: "bonnie", start: 16, end: 20 }],
  "2026-11-03": [{ employeeId: "bonnie", start: 9, end: 13 }],
  "2026-11-04": [{ employeeId: "other", start: 9, end: 13 }],
  "2026-12-01": [{ employeeId: "bonnie", start: 9, end: 12 }],
};
const context = {
  els: { employeeLegend }, activeMonth: "2026-11", appRole: "admin",
  getHiddenGridEmployees: () => new Set(["bonnie"]),
  getMonthDays: (month) => Object.keys(shiftsByDate).filter((date) => date.startsWith(month)),
  toDateInput: (date) => date,
  getEmployeesForMonth: () => [{ id: "bonnie", label: "Bonnie", color: "green" }],
  getShiftsForDate: (date) => shiftsByDate[date] || [],
  formatHours: (hours) => `${hours} h`, escapeHtml: (value) => value,
};
renderLegendForTest(context);
assert.match(employeeLegend.innerHTML, /11 h\/mes \(2 d\)/,
  "Dos turnos en la misma fecha deben contar un único día, incluso al ocultar al empleado.");
context.activeMonth = "2026-12";
renderLegendForTest(context);
assert.match(employeeLegend.innerHTML, /3 h\/mes \(1 d\)/, "El contador debe corresponder al mes seleccionado.");
context.activeMonth = "2027-01";
renderLegendForTest(context);
assert.match(employeeLegend.innerHTML, /0 h\/mes \(0 d\)/);
context.appRole = "visitor";
renderLegendForTest(context);
assert.doesNotMatch(employeeLegend.innerHTML, /\(\d+ d\)/, "Los días son un dato para administración.");

const printableStart = appSource.indexOf("function renderPrintableScheduleWeek(");
const printableEnd = appSource.indexOf("function rangeHoursForTimeline(", printableStart);
assert.ok(printableStart >= 0 && printableEnd > printableStart);
const renderPrintableForTest = new Function("context", `
  const { getDateKeysInRange, getVisibleShiftsForDate, getEmployees, getHiddenGridEmployees,
    getLocation, escapeHtml, formatNumericDate, formatHours, rangeHoursForTimeline,
    renderPrintableScheduleDay } = context;
  ${appSource.slice(printableStart, printableEnd)}
  return renderPrintableScheduleWeek;
`)({
  getDateKeysInRange: () => ["2026-11-02", "2026-11-03"],
  getVisibleShiftsForDate: (date) => shiftsByDate[date],
  getEmployees: () => [{ id: "bonnie", label: "Bonnie", color: "green" }],
  getHiddenGridEmployees: () => new Set(), getLocation: () => ({ label: "Madrid" }),
  escapeHtml: (value) => value, formatNumericDate: (date) => date,
  formatHours: (hours) => `${hours} h`, rangeHoursForTimeline: () => [],
  renderPrintableScheduleDay: () => "",
});
const printed = renderPrintableForTest({ start: "2026-11-02", end: "2026-11-03" }, 0, 1);
assert.match(printed, /<strong>Bonnie<\/strong><small>11 h<\/small>/);
assert.doesNotMatch(printed, /\(\d+ d\)/, "El PDF no debe incluir el número de días.");

console.log("OK: la grilla amplia y los PDF semanal/mensual respetan exactamente los empleados visibles.");
