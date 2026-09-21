import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const build = fs.readFileSync(new URL("./build-netlify.mjs", import.meta.url), "utf8");

assert.match(html, /app-core\.js\?v=1/);
assert.match(html, /app-insights\.js\?v=1/);
assert.match(build, /"app-core\.js"/);
assert.match(build, /"app-insights\.js"/);
assert.match(app, /function renderActiveAdminPanel\(/);
assert.match(app, /function createBackgroundCoordinator|backgroundCoordinator\.start/);
assert.doesNotMatch(app, /setInterval\(/, "Los procesos de fondo deben usar el coordinador con setTimeout.");

const renderStart = app.indexOf("function render() {");
const renderEnd = app.indexOf("\n}\n\nfunction getMondayForDate", renderStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart);
assert.doesNotMatch(app.slice(renderStart, renderEnd), /saveState\(/, "Renderizar no debe guardar datos.");

console.log("OK: arquitectura de render diferido, cache y coordinador.");
