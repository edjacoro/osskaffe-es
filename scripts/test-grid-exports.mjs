import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.match(html, /id="pdfWeekPicker"/);
assert.match(html, /id="printWeekPdf"[^>]*>PDF semana</i);
assert.match(html, /id="printPdf"[^>]*>PDF mes</i);
assert.match(html, /id="printGridRoot"/);
assert.match(html, /app\.js\?v=67/);
assert.match(html, /styles\.css\?v=36/);

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

console.log("OK: la grilla amplia y los PDF semanal/mensual respetan exactamente los empleados visibles.");
