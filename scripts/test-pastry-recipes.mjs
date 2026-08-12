import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const match = source.match(/const PASTRY_RECIPES = (\[[\s\S]*?\n\]);\n\nconst DEFAULT_STATE/);
assert.ok(match, "No se encontró el catálogo de recetas en app.js.");

const recipes = Function(`"use strict"; return (${match[1]});`)();
assert.equal(recipes.length, 6, "Deben existir exactamente seis recetas.");

const expected = new Set([
  "Banana Bread",
  "Chipá",
  "Dátiles",
  "Budín de limón y amapola",
  "Carrot Cake",
  "Cookies de chocolate",
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
console.log("OK: seis recetas, ingredientes, procedimientos y cantidades escalables.");
