import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.match(html, /id="finExpenseCategorySummary"[^>]*aria-label="Filtrar gastos por categoría"/);
assert.doesNotMatch(html, /id="finExpenseCategoryFilter"/,
  "Los botones duplicados sobre la lista de gastos deben desaparecer.");
assert.match(app, /data-expense-filter="\$\{category\.id\}" aria-pressed="\$\{selected\}"/);
assert.match(app, /\$\{escapeHtml\(category\.label\)\} \(\$\{categoryCounts\[category\.id\]\}\)/);
assert.match(app, /document\.querySelector\('#finExpenseShowAll'\)/);

const rrhhNav = html.match(/<nav class="nav-list"[\s\S]*?<\/nav>/)?.[0] || "";
assert.match(rrhhNav, /data-tab="fichas"[^>]*>[\s\S]*?<span>RRHH<\/span>/);
assert.doesNotMatch(rrhhNav, /data-tab="(?:punch|changes)"/);
assert.match(html, /data-fichas-tab="personal"[\s\S]*?data-fichas-tab="punch"[\s\S]*?data-fichas-tab="changes"/);
assert.match(app, /function mountRrhhPanels\(\)/);
assert.match(app, /host\.appendChild\(panel\)/);
assert.match(app, /employees = getEmployees\(true\)\.slice\(\)\.sort/);
assert.match(app, /employee\.inactiveFrom && employee\.inactiveFrom <= today/);

assert.match(app, /<span>Proyección mes<\/span>/);
assert.match(app, /<span>Ticket promedio mes<\/span>/);
assert.match(app, /getMonthSalesProjection\(now, locationId\)/);
assert.match(app, /monthMetrics\.avgTicket/);
assert.match(css, /\.executive-store-grid\.is-single \.executive-store-card/);

console.log("OK: filtros de gastos, comparación mensual y subpestañas de RRHH.");
