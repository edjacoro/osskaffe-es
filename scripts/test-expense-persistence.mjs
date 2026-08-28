import assert from "node:assert/strict";
import fs from "node:fs";
import { applyExpenseRecordMutation } from "../netlify/functions/expense-record.mjs";
import { mergeAdminState } from "../netlify/functions/_shared.mjs";

const manualA = {
  id: "manual-a",
  date: "2026-01-10",
  amount: 15,
  category: "otros",
  supplier: "Proveedor A",
  description: "Prueba",
  locationId: "barcelona",
};
const manualB = {
  id: "manual-b",
  date: "2026-01-11",
  amount: 20,
  category: "suministros",
  supplier: "Proveedor B",
  description: "Prueba",
  locationId: "barcelona",
};
const bistro = {
  id: "bistro-expense-barcelona-123",
  bistroId: "bistro-expense-123",
  date: "2026-01-12",
  amount: 30,
  category: "otros",
  locationId: "barcelona",
  _source: "bistrosoft",
};

let state = { expenses: [manualA, manualB, bistro], expenseCategoryOverrides: {} };
state = applyExpenseRecordMutation(state, {
  action: "upsert",
  expense: { ...manualB, amount: 27, description: "Actualizado" },
});
assert.equal(state.expenses.find((expense) => expense.id === "manual-b").amount, 27);
assert.equal(state.expenses.length, 3, "Editar no debe duplicar el gasto.");

state = applyExpenseRecordMutation(state, {
  action: "upsert",
  expense: {
    id: "manual-third-party",
    date: "2026-01-11",
    amount: 35,
    category: "productos_terceros",
    locationId: "barcelona",
  },
});
state = applyExpenseRecordMutation(state, {
  action: "upsert",
  expense: {
    id: "manual-labour",
    date: "2026-01-11",
    amount: 60,
    category: "mano_obra",
    locationId: "barcelona",
  },
});
assert.equal(state.expenses.find((expense) => expense.id === "manual-third-party").category, "productos_terceros");
assert.equal(state.expenses.find((expense) => expense.id === "manual-labour").category, "mano_obra");

state = applyExpenseRecordMutation(state, {
  action: "categorize",
  category: "materia_prima",
  expense: bistro,
});
assert.equal(state.expenses.find((expense) => expense.id === bistro.id).category, "materia_prima");
assert.equal(state.expenseCategoryOverrides[bistro.id], "materia_prima");
assert.equal(state.expenseCategoryOverrides[bistro.bistroId], "materia_prima");

state = applyExpenseRecordMutation(state, {
  action: "upsert",
  expense: {
    id: "manual-tc",
    date: "2026-01-13",
    amount: 44,
    category: "otros",
    locationId: "barcelona",
    isDiferido: true,
    dueDate: "2026-02-10",
  },
});
state = applyExpenseRecordMutation(state, {
  action: "mark-paid",
  expenseIds: ["manual-tc"],
  dueDate: "2026-01-31",
  locationId: "barcelona",
});
assert.equal(state.expenses.find((expense) => expense.id === "manual-tc").dueDate, "2026-01-31");

state = applyExpenseRecordMutation(state, { action: "delete", expenseId: "manual-a" });
assert.ok(!state.expenses.some((expense) => expense.id === "manual-a"));
assert.ok(state.expenseDeletionTombstones["manual-a"]);

const staleBrowserState = {
  ...state,
  expenses: [
    { ...manualA, amount: 999 },
    { ...manualB, amount: 1 },
    { ...bistro, category: "otros" },
  ],
  expenseCategoryOverrides: { [bistro.id]: "otros" },
};
const merged = mergeAdminState(state, staleBrowserState);
assert.ok(!merged.expenses.some((expense) => expense.id === "manual-a"), "Una pestaña vieja no debe resucitar un gasto borrado.");
assert.equal(merged.expenses.find((expense) => expense.id === "manual-b").amount, 27, "El valor confirmado debe ganar frente a una pestaña vieja.");
assert.equal(merged.expenses.find((expense) => expense.id === bistro.id).category, "materia_prima");
assert.equal(merged.expenseCategoryOverrides[bistro.id], "materia_prima");

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../_redirects", import.meta.url), "utf8");

assert.match(redirects, /\/api\/expense-record\s+\/\.netlify\/functions\/expense-record/);
assert.match(appSource, /persistExpenseMutation\(\{ action: 'upsert', expense \}\)/);
assert.match(appSource, /persistExpenseMutation\(\{ action: 'delete', expenseId \}\)/);
assert.match(appSource, /saveState\(\{ shared: false \}\);/);
assert.match(appSource, /captureExpenseListViewport/);
assert.match(appSource, /restoreExpenseListViewport/);
assert.match(html, /id="finExpenseSaveStatus"/);
assert.match(html, /id="finExpensePdf"/);
assert.match(appSource, /resetExpenseForm\(\{ keepViewport: true \}\)/);
assert.match(appSource, /label: 'Insumos y MP'/);
assert.match(appSource, /label: 'SUELDOS'/);
assert.match(css, /\.fin-expense-list\s*\{[\s\S]*?overflow-y:\s*auto/);
assert.match(css, /\.fin-expense-list-surface\s*\{[\s\S]*?position:\s*sticky/);

const categoryRulesStart = appSource.indexOf("const EXPENSE_CATEGORIES = [");
const categoryRulesEnd = appSource.indexOf("function expenseOverrideKeys", categoryRulesStart);
const buildCategoryRules = new Function(
  `${appSource.slice(categoryRulesStart, categoryRulesEnd)}\nreturn { getPnlExpenseGroupId, getExpenseCategoryLabel };`,
);
const categoryRules = buildCategoryRules();
assert.equal(categoryRules.getPnlExpenseGroupId("materia_prima"), "insumos_mp");
assert.equal(categoryRules.getPnlExpenseGroupId("productos_terceros"), "insumos_mp");
assert.equal(categoryRules.getPnlExpenseGroupId("nominas"), "sueldos");
assert.equal(categoryRules.getPnlExpenseGroupId("mano_obra"), "sueldos");
assert.equal(categoryRules.getPnlExpenseGroupId("seguridad_social"), "sueldos");
assert.equal(categoryRules.getExpenseCategoryLabel("comisiones_tpv"), "Comisiones");

console.log("OK: gastos y categorías se guardan de forma atómica, resisten pestañas antiguas y conservan la posición de la lista.");
