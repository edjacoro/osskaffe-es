import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../app-insights.js", import.meta.url), "utf8");
const context = { globalThis: null };
context.globalThis = context;
vm.runInNewContext(source, context);
const insights = context.OssInsights;

const combined = insights.combineFinancialMetrics([
  { totalSales: 1000, ticketCount: 100, totalExpenses: 300, result: 700 },
  { totalSales: 500, ticketCount: 25, totalExpenses: 200, result: 300 },
]);
assert.equal(combined.totalSales, 1500);
assert.equal(combined.ticketCount, 125);
assert.equal(combined.avgTicket, 12);
assert.equal(insights.percentChange(120, 100), 20);
assert.equal(insights.percentChange(120, 0), null);

const productivity = insights.calculateLaborProductivity({ sales: 1500, plannedHours: 100, punchedHours: 90, laborCost: 300 });
assert.equal(productivity.salesPerPlannedHour, 15);
assert.equal(productivity.hoursDifference, -10);
assert.equal(productivity.laborCostPercent, 20);

assert.equal(insights.buildConfidenceStatus({ ticketCount: 100, detailTickets: 100, missingOpenDays: 0 }).label, "Información completa");
assert.equal(insights.buildConfidenceStatus({ ticketCount: 100, detailTickets: 40, missingOpenDays: 0 }).tone, "warning");
assert.equal(insights.buildConfidenceStatus({ ticketCount: 0, detailTickets: 0, missingOpenDays: 0 }).tone, "neutral");
assert.equal(insights.buildConfidenceStatus({ ticketCount: 10, syncError: "timeout" }).tone, "danger");

console.log("OK: métricas ejecutivas, productividad y confianza de datos.");
