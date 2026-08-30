import assert from "node:assert/strict";
import fs from "node:fs";
import { mergeBistroSaleDetail } from "../netlify/functions/_shared.mjs";

const previous = {
  id: "bistro-barcelona-ticket-1",
  bistroId: "bistro-ticket-1",
  date: "2026-08-05",
  detailStatus: "complete",
  detailAttempts: 2,
  items: [
    { name: "Flat White", qty: 2 },
    { name: "Cookie", qty: 1 },
    { name: "Banana Bread", qty: 1 },
  ],
};

const monthlyVersion = {
  ...previous,
  detailAttempts: 0,
  items: [{ name: "Flat White", qty: 2 }],
};

const merged = mergeBistroSaleDetail(monthlyVersion, previous, "barcelona");
assert.deepEqual(merged.items, previous.items, "La lectura mensual no debe reemplazar el detalle diario completo.");
assert.equal(merged.detailAttempts, 2, "Deben conservarse los intentos de detalle ya realizados.");
assert.equal(merged.detailStatus, "complete");

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const autoBackfillSource = fs.readFileSync(
  new URL("../netlify/functions/bistro-details-auto-start.mjs", import.meta.url),
  "utf8",
);
assert.match(appSource, /const barcelonaMetrics = calcDayMetricsForLocation\(dateKey, 'barcelona'\)/);
assert.match(appSource, /const madridMetrics = calcDayMetricsForLocation\(dateKey, 'madrid'\)/);
assert.match(appSource, /function calcDayMetrics\(date\) \{\s*return calcDayMetricsForLocation\(date, activeLocationId\);/);
assert.match(
  appSource,
  /syncBistrosoftDay\(finTodayDate, true, \{ skipItemEnrichment: true \}\)/,
  "Al elegir una fecha debe hacer primero una lectura rapida sin bloquear la interfaz.",
);
assert.match(
  appSource,
  /startBistrosoftDayDetailRepair\(\{ automatic: true \}\)/,
  "Una fecha incompleta debe iniciar automaticamente su reparacion puntual.",
);
assert.match(
  appSource,
  /details-day-start/,
  "La reparacion puntual debe usar su propio trabajo de fondo.",
);
assert.match(
  appSource,
  /startBistrosoftMissingBackfillOnce\(\)/,
  "La apertura como administrador debe iniciar la carga unica de dias pasados incompletos.",
);
assert.match(
  appSource,
  /details-auto-start/,
  "La carga unica debe quedar controlada por Netlify y no por el navegador.",
);
assert.match(
  autoBackfillSource,
  /2026-08-13-v2-cross-selling/,
  "La proxima apertura debe lanzar una nueva revision de dias historicos incompletos.",
);

const metricStart = appSource.indexOf("const COFFEE_ITEM_PATTERN");
const metricEnd = appSource.indexOf("function calculateItemMetrics", metricStart);
assert.ok(metricStart >= 0 && metricEnd > metricStart, "Debe poder aislarse el calculo de cross-selling.");
const buildCrossSelling = new Function(
  "itemName",
  "itemQuantity",
  `${appSource.slice(metricStart, metricEnd)}\nreturn calculateCrossSelling;`,
);
const calculateCrossSelling = buildCrossSelling(
  (item) => String(item?.name || ""),
  (item) => Number(item?.qty ?? item?.quantity ?? 1),
);
const crossSelling = calculateCrossSelling([
  { count: 1, items: [{ name: "Flat White", qty: 4 }] },
  { count: 1, items: [{ name: "Cold Brew", qty: 1 }] },
  { count: 1, items: [{ name: "Shakerato", qty: 1 }] },
  { count: 1, items: [{ name: "Cookie", qty: 1 }] },
  { count: 1, items: [{ name: "Chipa", qty: 1 }] },
  { count: 1, items: [{ name: "Agua", qty: 2 }] },
]);
assert.equal(crossSelling.coffeeQty, 6, "Debe sumar cafes calientes, frios y especiales.");
assert.equal(crossSelling.foodQty, 2, "Debe sumar pasteleria aunque se venda en tickets sin cafe.");
assert.equal(crossSelling.coffeesPerFood, 3, "Se esperan 6 cafes / 2 productos = 1 cada 3 cafes.");
assert.equal("pairedFoodQty" in crossSelling, false, "La formula ya no debe depender de pares por ticket.");

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
assert.match(html, /class="role-back-button" id="backToStep1a"/);
assert.match(html, /id="finSyncDay"[^>]*>CARGAR PRODUCTOS DEL DÍA<\/button>/);
assert.equal((html.match(/id="backToStep1a"/g) || []).length, 1, "El botón Volver debe tener un ID único.");
assert.equal((html.match(/class="role-back-button"/g) || []).length, 6, "Cada paso posterior del ingreso debe ofrecer Volver.");
assert.match(appSource, /chooseEmployee"\)\.addEventListener\("click", async \(\) => \{[\s\S]*?showLocationStep\("employee"\)/);
assert.match(appSource, /normalizeLocationId\(employee\.locationId\) === pendingEmployeeLocationId/);
assert.match(appSource, /pendingLocationRole === "employee"[\s\S]*?showRoleStep\("roleStepEmployee"\)/);

assert.match(html, /class="two-column fin-import-layout"/);
assert.match(html, /class="form-surface fin-import-file-form" id="finImportForm"/);
assert.match(styles, /\.fin-sync-actions \.ghost-button \{[\s\S]*?min-height: 34px/);
assert.match(styles, /\.fin-import-layout \{[\s\S]*?0\.72fr[\s\S]*?1\.45fr/);

assert.match(appSource, /id="analysisExportCsv">Exportar CSV/);
assert.match(appSource, /function exportFinAnalysisCsv\(filters, groups\)/);
assert.match(appSource, /getAnalysisFilterSummary\(filters\)/);
assert.match(appSource, /id="finAiDateFrom" type="date"/);
assert.match(appSource, /id="finAiDateTo" type="date"/);
assert.match(appSource, /function answerFinAiQuestion\(question, salesOverride = null, expensesOverride = null, periodOverride = null\)/);
assert.match(appSource, /const period = periodOverride \|\| getFinAiPeriod\(question, allSales\)/);
assert.match(html, /styles\.css\?v=38/);
assert.match(html, /app\.js\?v=69/);
assert.match(html, /id="finExpenseCategorySummary"/);
assert.match(html, /id="finExpCategoryMonth"/);
assert.match(html, /id="finExpenseList" class="event-list fin-expense-list"/);
assert.match(html, /value="productos_terceros">Productos de Terceros/);
assert.match(html, /value="mano_obra">Mano de Obra/);
assert.match(html, /value="comisiones_tpv">Comisiones/);
assert.match(html, /id="finExpensePdf"/);
assert.match(html, /id="printExpenseRoot"/);
assert.match(appSource, /function calculateExpenseCategoryTotals\(expenses = \[\]\)/);
assert.match(appSource, /Object\.hasOwn\(totals, expense\.category\) \? expense\.category : 'otros'/);
assert.match(appSource, /data-expense-category="\$\{category\.id\}"/);
assert.match(styles, /\.fin-expense-category-grid \{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(styles, /\.fin-expense-item \{[\s\S]*?padding: 8px 9px/);
assert.match(styles, /\.fin-expense-item \.mini-button \{[\s\S]*?min-height: 25px/);
assert.match(styles, /body\.print-expense-export > \.print-expense-root/);
assert.match(appSource, /function exportFinExpensesPdf\(\)/);
assert.match(appSource, /<h2>TOTAL POR CATEGORÍA<\/h2>/);
assert.match(appSource, /function renderExpenseDonutSvg\(categoryData\)/);
assert.match(appSource, /Porcentaje de cada categoría sobre el gasto total/);
assert.match(appSource, /<span>Ventas del mes<\/span>/);
assert.match(appSource, /<span>Gastos del mes<\/span>/);
assert.match(appSource, /<span>Resultado del mes<\/span>/);
assert.match(appSource, /const monthlyResult = monthlySales - total/);
assert.match(styles, /\.expense-print-category-layout\s*\{[\s\S]*?grid-template-columns/);
assert.match(styles, /\.expense-print-closing\s*\{[\s\S]*?repeat\(3/);
assert.match(appSource, /label: 'Insumos y MP', categories: \['materia_prima', 'productos_terceros'\]/);
assert.match(appSource, /label: 'SUELDOS', categories: \['nominas', 'mano_obra', 'seguridad_social'\]/);

const expenseTotalsStart = appSource.indexOf('function calculateExpenseCategoryTotals');
const expenseTotalsEnd = appSource.indexOf('function renderFinExpenses', expenseTotalsStart);
const buildExpenseTotals = new Function(
  'EXPENSE_CATEGORIES',
  `${appSource.slice(expenseTotalsStart, expenseTotalsEnd)}\nreturn calculateExpenseCategoryTotals;`,
);
const calculateExpenseTotals = buildExpenseTotals([
  { id: 'materia_prima', label: 'Materia prima' },
  { id: 'productos_terceros', label: 'Productos de Terceros' },
  { id: 'nominas', label: 'Nóminas' },
  { id: 'mano_obra', label: 'Mano de Obra' },
  { id: 'otros', label: 'Otros' },
]);
assert.deepEqual(
  calculateExpenseTotals([
    { category: 'materia_prima', amount: 100 },
    { category: 'materia_prima', amount: '25.5' },
    { category: 'productos_terceros', amount: 45 },
    { category: 'nominas', amount: 300 },
    { category: 'mano_obra', amount: 80 },
    { category: 'categoria_desconocida', amount: 10 },
  ]),
  { materia_prima: 125.5, productos_terceros: 45, nominas: 300, mano_obra: 80, otros: 10 },
  'El visor debe sumar cada categoría y llevar cualquier categoría desconocida a Otros.',
);

const expensePrintRulesStart = appSource.indexOf('const EXPENSE_PRINT_COLORS');
const expensePrintRulesEnd = appSource.indexOf('function exportFinExpensesPdf', expensePrintRulesStart);
const buildExpensePrintRules = new Function(
  'EXPENSE_CATEGORIES',
  `${appSource.slice(expensePrintRulesStart, expensePrintRulesEnd)}\nreturn { buildExpensePrintCategoryData, renderExpenseDonutSvg };`,
);
const expensePrintRules = buildExpensePrintRules([
  { id: 'materia_prima', label: 'Materia prima' },
  { id: 'productos_terceros', label: 'Productos de Terceros' },
]);
const printCategories = expensePrintRules.buildExpensePrintCategoryData(
  { materia_prima: 25, productos_terceros: 75 },
  100,
);
assert.deepEqual(printCategories.map((category) => category.percentage), [25, 75]);
const donutSvg = expensePrintRules.renderExpenseDonutSvg(printCategories);
assert.match(donutSvg, /aria-label="Porcentaje de gastos por categoría"/);
assert.match(donutSvg, />25%</);
assert.match(donutSvg, />75%</);

const financeNavPosition = html.indexOf('data-tab="finanzas"');
const reportsNavPosition = html.indexOf('data-tab="reports"');
const settingsNavPosition = html.indexOf('data-tab="settings"');
assert.ok(
  financeNavPosition >= 0 && reportsNavPosition > financeNavPosition && settingsNavPosition > reportsNavPosition,
  "Reportes debe aparecer inmediatamente después de Finanzas en la navegación principal.",
);
assert.match(html, /id="reportsPanel" data-panel="reports"/);
const financeSubnav = html.slice(html.indexOf('aria-label="Secciones de finanzas"'), html.indexOf('</nav>', html.indexOf('aria-label="Secciones de finanzas"')));
assert.doesNotMatch(financeSubnav, /data-fin-tab="(audit|analysis|ai)"/);
const reportsSubnav = html.slice(html.indexOf('aria-label="Secciones de reportes"'), html.indexOf('</nav>', html.indexOf('aria-label="Secciones de reportes"')));
assert.match(reportsSubnav, /data-fin-tab="audit"/);
assert.match(reportsSubnav, /data-fin-tab="analysis"/);
assert.match(reportsSubnav, /data-fin-tab="ai"/);
assert.match(appSource, /let activeReportTab = 'audit'/);
assert.match(appSource, /function captureFinAiEditorState\(container\)/);
assert.match(appSource, /finAiQuestionDraft = event\.currentTarget\.value/);
assert.match(appSource, /restoreFinAiEditorState\(editorState\)/);

const resolverStart = appSource.indexOf('const FIN_AI_PRODUCT_STOP_WORDS');
const resolverEnd = appSource.indexOf('function aggregateFinAiProducts', resolverStart);
assert.ok(resolverStart >= 0 && resolverEnd > resolverStart, 'Debe poder aislarse la búsqueda de productos de IA.');
const buildProductResolver = new Function(
  'itemName',
  'isCoffeeItem',
  `${appSource.slice(resolverStart, resolverEnd)}\nreturn resolveFinAiProducts;`,
);
const resolveProducts = buildProductResolver(
  (item) => String(item?.name || ''),
  (item) => /cafe|coffee|espresso|americano|latte|flat\s*white|cold\s*brew|shakerato/i.test(String(item?.name || '')),
);
const productSales = [{ items: [
  { name: 'Medialuna de manteca' },
  { name: 'Medialunas J&Q' },
  { name: 'Café J&Q' },
  { name: 'Flat White' },
  { name: 'Cold Brew' },
  { name: 'Cookie' },
] }];
assert.deepEqual(
  resolveProducts('¿Cuántas medialunas se vendieron?', productSales).map((product) => product.label).sort(),
  ['Medialuna de manteca', 'Medialunas J&Q'].sort(),
  'Una búsqueda genérica debe incluir todas las variantes de medialuna, incluida J&Q.',
);
assert.deepEqual(
  resolveProducts('¿Cuántos cafés se vendieron?', productSales).map((product) => product.label).sort(),
  ['Café J&Q', 'Cold Brew', 'Flat White'].sort(),
  'La palabra café debe incluir variedades frías, calientes y especiales sin mezclarlas.',
);

console.log("OK: Reportes separa Auditoria / Analisis / IA y la consulta conserva texto y variantes de producto.");
