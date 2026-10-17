import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { applyManualSaleMutation, manualSaleMutationIsPersisted } from "../netlify/functions/manual-sale.mjs";
import { mergeAdminState } from "../netlify/functions/_shared.mjs";

const june = {
  id: "manual-sale-barcelona-2026-06-30-original", locationId: "barcelona",
  date: "2026-06-30", total: 45, count: 3, _source: "manual",
};
const july = {
  id: "manual-sale-barcelona-2026-07-31-original", locationId: "barcelona",
  date: "2026-07-31", total: 70, count: 5, _source: "manual",
};
const bistro = {
  id: "bistro-30", locationId: "barcelona", date: "2026-06-30",
  total: 100, count: 10, _source: "bistrosoft",
};
const course = {
  id: "manual-sale-barcelona-2026-07-31-course", locationId: "barcelona",
  date: "2026-07-31", total: 120, count: 0, _source: "course",
};

let state = { sales: [june, july, bistro] };
state = applyManualSaleMutation(state, { action: "upsert", sale: course });
assert.equal(manualSaleMutationIsPersisted(state, { action: "upsert", sale: course }), true);
assert.equal(state.sales.find((sale) => sale.id === bistro.id).total, 100);
assert.equal(state.sales.find((sale) => sale.id === course.id).count, 0);

state = applyManualSaleMutation(state, {
  action: "upsert", sale: { ...june, total: 55 }, expectedUpdatedAt: "",
});
assert.equal(state.sales.find((sale) => sale.id === june.id).total, 55);
assert.equal(state.sales.length, 4, "Editing a manual sale must not duplicate it.");
assert.throws(() => applyManualSaleMutation(state, {
  action: "upsert", sale: { ...bistro, _source: "manual", total: 1 },
}), /Bistrosoft/);
assert.throws(() => applyManualSaleMutation(state, {
  action: "delete", saleId: bistro.id, locationId: "barcelona",
}), /Bistrosoft/);

const staleBrowser = { sales: [june, bistro] };
let merged = mergeAdminState(state, staleBrowser);
assert.equal(merged.sales.find((sale) => sale.id === june.id).total, 55);
assert(merged.sales.some((sale) => sale.id === july.id), "Historical July manual entry must survive a stale save.");
assert(merged.sales.some((sale) => sale.id === course.id), "A course must survive a stale save.");

state = applyManualSaleMutation(state, {
  action: "delete", saleId: july.id, locationId: "barcelona", expectedUpdatedAt: "",
});
assert.equal(manualSaleMutationIsPersisted(state, { action: "delete", saleId: july.id }), true);
merged = mergeAdminState(state, { sales: [july, bistro] });
assert(!merged.sales.some((sale) => sale.id === july.id), "A stale browser must not resurrect a deleted sale.");

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const helperSource = source.slice(source.indexOf("function saleTicketCount("), source.indexOf("function getMonthMetricsForLocation("));
const helpers = vm.runInNewContext(`${helperSource}\n({ saleTicketCount, saleTicketRevenue })`);
assert.equal(helpers.saleTicketCount(course), 0);
assert.equal(helpers.saleTicketRevenue(course), 0);
assert.equal(helpers.saleTicketCount(june), 3);
assert.equal(helpers.saleTicketRevenue(june), 45);

const monthSource = source.slice(
  source.indexOf("function getMonthMetricsForLocation("),
  source.indexOf("function getScheduledHoursForLocationMonth("),
);
const monthMetrics = new Function(
  "monthInputValue", "getLocationSales", "getLocationExpenses", "saleTicketCount", "saleTicketRevenue",
  `${monthSource}\nreturn getMonthMetricsForLocation;`,
)(() => "2026-07", () => [july, course], () => [], helpers.saleTicketCount, helpers.saleTicketRevenue)(new Date(2026, 6, 1), "barcelona");
assert.equal(monthMetrics.totalSales, 190);
assert.equal(monthMetrics.ticketCount, 5);
assert.equal(monthMetrics.avgTicket, 14, "The month average must use only ticket sales.");

const insightSource = fs.readFileSync(new URL("../app-insights.js", import.meta.url), "utf8");
const context = { globalThis: null };
context.globalThis = context;
vm.runInNewContext(insightSource, context);
const combined = context.OssInsights.combineFinancialMetrics([
  { totalSales: 220, ticketSales: 100, ticketCount: 10, totalExpenses: 20, result: 200 },
]);
assert.equal(combined.totalSales, 220, "Course revenue must count toward total sales.");
assert.equal(combined.result, 200, "Course revenue must count toward result.");
assert.equal(combined.avgTicket, 10, "Course revenue must not inflate the average ticket.");

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /id="finManualSaleCourse"/);
assert.match(html, /id="finManualSaleSaveStatus"/);
assert.match(html, /data-sale-source-filter="manual"/);
assert.match(html, /data-sale-source-filter="course"/);
assert.match(source, /data-edit-manual-sale/);
assert.match(source, /data-delete-manual-sale/);
assert.doesNotMatch(source.slice(source.indexOf("function renderFinImport()"), source.indexOf("// -------- EXPENSES --------")), /data-delete-day/);
const redirects = fs.readFileSync(new URL("../_redirects", import.meta.url), "utf8");
assert.match(redirects, /\/api\/manual-sale\s+\/\.netlify\/functions\/manual-sale/);

console.log("Manual sales, courses, protected historical entries and ticket averages: OK");
