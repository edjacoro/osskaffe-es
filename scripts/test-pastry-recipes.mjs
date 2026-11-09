import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const match = source.match(/const PASTRY_RECIPES = (\[[\s\S]*?\n\]);\n\nconst DEFAULT_STATE/);
assert.ok(match, "No se encontró el catálogo de recetas en app.js.");

const recipes = Function(`"use strict"; return (${match[1]});`)();
assert.equal(recipes.length, 8, "Deben existir exactamente ocho recetas.");

const expected = new Set([
  "Banana Bread",
  "Chipá",
  "Dátiles",
  "Budín de limón y amapola",
  "Budín de Cardamomo (sin TACC)",
  "Carrot Cake",
  "Cookies de chocolate",
  "Barritas raw de coco, naranja y dátiles",
]);

recipes.forEach((recipe) => {
  assert.ok(expected.delete(recipe.name), `Receta inesperada o repetida: ${recipe.name}`);
  assert.ok(recipe.yieldLabel, `${recipe.name} no informa el rendimiento base.`);
  assert.ok(recipe.ingredients.length > 0, `${recipe.name} no tiene ingredientes.`);
  assert.ok(recipe.procedures.some((procedure) => procedure.steps.length > 0), `${recipe.name} no tiene procedimiento.`);
  recipe.ingredients.forEach((ingredient) => {
    assert.ok(ingredient.name, `${recipe.name} tiene un ingrediente sin nombre.`);
    assert.ok(Number.isFinite(ingredient.quantity), `${recipe.name}: cantidad inválida en ${ingredient.name}.`);
    if (ingredient.quantityMax != null) {
      assert.ok(Number.isFinite(ingredient.quantityMax) && ingredient.quantityMax >= ingredient.quantity,
        `${recipe.name}: rango inválido en ${ingredient.name}.`);
    }
    assert.ok(ingredient.unit, `${recipe.name}: falta unidad en ${ingredient.name}.`);
    assert.equal(ingredient.quantity * 2.5, Number(ingredient.quantity) * 2.5);
  });
});

assert.equal(expected.size, 0, `Faltan recetas: ${[...expected].join(", ")}`);
const rawBars = recipes.find((recipe) => recipe.id === "raw-coconut-orange-date-bars");
assert.ok(rawBars, "Debe estar incorporada la receta de barritas raw.");
assert.equal(rawBars.ingredients.find((ingredient) => ingredient.name === "Chocolate negro 70%")?.quantity, 180);
assert.equal(rawBars.ingredients.find((ingredient) => ingredient.name === "Ralladura de naranja")?.asNeeded, true);
assert.match(rawBars.yieldLabel, /10 × 2,5 cm/);

const cardamom = recipes.find((recipe) => recipe.id === "cardamom-loaf");
assert.equal(cardamom.yieldLabel, "1 budín");
assert.deepEqual(cardamom.ingredients.map(({ name, quantity, quantityMax }) => [name, quantity, quantityMax ?? null]), [
  ["Naranjas hervidas", 150, null],
  ["Azúcar mascabo", 50, null],
  ["Azúcar", 100, null],
  ["Huevos", 180, 200],
  ["Harina de almendras", 75, null],
  ["Harina de arroz", 75, null],
  ["Aceite de oliva", 55, null],
  ["Polvo de hornear", 5, null],
  ["Cardamomo en polvo", 5, null],
  ["Semillas de cardamomo", 1, null],
  ["Jengibre en polvo", 2.5, null],
  ["Canela", 4, null],
]);
assert.ok(cardamom.procedures[0].steps.some((step) => step.includes("650 y 700 g")));
assert.ok(cardamom.procedures[0].steps.some((step) => step.includes("160 °C") && step.includes("55 minutos")));

const formatterSource = source.match(/(function formatPastryQuantity\([\s\S]*?\n})\n\nfunction renderPastryIngredientRows/);
assert.ok(formatterSource, "No se encontró el formateo de cantidades de pastelería.");
const formatPastryQuantity = Function(`"use strict"; return (${formatterSource[1]});`)();
assert.equal(formatPastryQuantity(180, "g", false, 200), "180–200 g");
assert.equal(formatPastryQuantity(360, "g", false, 400), "360–400 g");
assert.equal(formatPastryQuantity(2.5, "g"), "2,5 g");

const updateSource = source.match(/(function updatePastryCalculation\([\s\S]*?\n})\n\nfunction bindPastryEvents/);
assert.ok(updateSource, "No se encontró el cálculo de materia prima.");
const quantities = {};
const updatePastryCalculation = Function("PASTRY_RECIPES", "pastryRecipeQuantities", "formatPastryQuantity",
  `"use strict"; return (${updateSource[1]});`)(recipes, quantities, formatPastryQuantity);
const eggCell = { dataset: { quantity: "180", quantityMax: "200", unit: "g", asNeeded: "false" }, textContent: "" };
updatePastryCalculation({ querySelectorAll: () => [eggCell] }, cardamom.id, 2);
assert.equal(eggCell.textContent, "360–400 g");
assert.equal(quantities[cardamom.id], 2);

console.log("OK: ocho recetas, ingredientes, procedimientos y cantidades escalables, incluidos rangos.");
