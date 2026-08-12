import assert from "node:assert/strict";
import { datesForMonths, nextDateKey, summarizeDetailJob } from "../netlify/functions/_bistro-detail-queue.mjs";
import { isValidBistroDay, nextBistroDay, summarizeDayDetailJob } from "../netlify/functions/_bistro-detail-day.mjs";
import { bistroDetailFetchOptions, mergeAdminState } from "../netlify/functions/_shared.mjs";

assert.equal(nextDateKey("2026-02-28"), "2026-03-01");
assert.equal(datesForMonths(["2024-02"], "2024-02-29").length, 29);
assert.deepEqual(
  datesForMonths(["2026-07", "2026-08"], "2026-08-02").slice(-3),
  ["2026-07-31", "2026-08-01", "2026-08-02"],
);

assert.deepEqual(
  bistroDetailFetchOptions("2026-06-29", "2026-06-30", true),
  { includeAllItems: true, forceItemRetry: true, maxDetailAttempts: 6 },
);
assert.deepEqual(bistroDetailFetchOptions("2026-06-01", "2026-07-01", true), {});
assert.deepEqual(bistroDetailFetchOptions("2026-06-29", "2026-06-30", false), {});
assert.equal(isValidBistroDay("2026-06-29"), true);
assert.equal(isValidBistroDay("2026-06-31"), false);
assert.equal(nextBistroDay("2026-06-30"), "2026-07-01");
const daySummary = summarizeDayDetailJob({
  jobId: "day-job",
  locationId: "barcelona",
  date: "2026-06-29",
  status: "partial",
  attempt: 3,
  maxAttempts: 3,
  totalTickets: 76,
  detailTickets: 70,
  unresolvedTickets: 6,
});
assert.equal(daySummary.status, "partial");
assert.equal(daySummary.totalTickets, 76);
assert.equal(daySummary.detailTickets, 70);
assert.equal(daySummary.unresolvedTickets, 6);

const summary = summarizeDetailJob({
  jobId: "job-test",
  locationId: "barcelona",
  mode: "historical",
  status: "complete_partial",
  phase: "details",
  totalDays: 2,
  pendingDates: [],
  results: {
    "2026-07-01": { status: "complete", totalTickets: 10, detailTickets: 10, attemptedTickets: 10 },
    "2026-07-02": { status: "partial", totalTickets: 10, detailTickets: 8, attemptedTickets: 10 },
  },
});
assert.equal(summary.progressPercent, 100);
assert.equal(summary.coveragePercent, 90);
assert.equal(summary.partialDays, 1);
assert.equal(summary.partialMonths[0].month, "2026-07");

const currentState = {
  employees: [{ id: "ana", label: "Ana" }],
  sales: [
    { id: "bistro-1", bistroId: "bistro-1", _source: "bistrosoft", items: [{ name: "Cafe", qty: 1 }], detailStatus: "complete" },
    { id: "bistro-2", bistroId: "bistro-2", _source: "bistrosoft", items: [{ name: "Pan", qty: 1 }], detailStatus: "complete" },
  ],
  expenses: [],
  bistroSyncedMonthsByLocation: { barcelona: { sales: ["2026-07"] } },
};
const staleBrowserState = {
  employees: [],
  sales: [
    { id: "bistro-1", bistroId: "bistro-1", _source: "bistrosoft", items: [] },
    { id: "manual-1", _source: "manual", total: 10 },
  ],
  expenses: [],
};
const protectedState = mergeAdminState(currentState, staleBrowserState);
assert.equal(protectedState.employees[0].id, "ana");
assert.equal(protectedState.sales.find((sale) => sale.id === "bistro-1").items.length, 1);
assert(protectedState.sales.some((sale) => sale.id === "bistro-2"));
assert(protectedState.sales.some((sale) => sale.id === "manual-1"));

console.log("OK: cola diaria, cobertura y proteccion contra copias antiguas.");
