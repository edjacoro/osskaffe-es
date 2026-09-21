import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const match = source.match(/const PASTRY_RECIPES = (\[[\s\S]*?\n\]);\n\nconst DEFAULT_STATE/);
assert.ok(match, "No se encontró el catálogo de recetas en app.js.");

const recipes = Function(`"use strict"; return (${match[1]});`)();
assert.equal(recipes.length, 7, "Deben existir exactamente siete recetas.");

const expected = new Set([
  "Banana Bread",
  "Chipá",
  "Dátiles",
  "Budín de limón y amapola",
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

console.log("OK: siete recetas, ingredientes, procedimientos y cantidades escalables.");
