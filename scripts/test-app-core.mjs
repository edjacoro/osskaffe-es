import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../app-core.js", import.meta.url), "utf8");
const context = { setTimeout, clearTimeout, console, globalThis: null };
context.globalThis = context;
vm.runInNewContext(source, context);
const { createRevisionedCache, createBackgroundCoordinator } = context.OssAppCore;

const cache = createRevisionedCache(2);
let calls = 0;
assert.equal(cache.get("x", () => ++calls), 1);
assert.equal(cache.get("x", () => ++calls), 1, "La segunda lectura debe salir del cache.");
cache.invalidate();
assert.equal(cache.get("x", () => ++calls), 2, "Invalidar debe forzar el recálculo.");

const fakeDocument = { hidden: false, addEventListener() {} };
const coordinator = createBackgroundCoordinator({ documentRef: fakeDocument });
let runs = 0;
const stop = coordinator.start("test", async () => { runs += 1; }, 1000, { immediate: true });
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(runs, 1, "Una tarea inmediata debe ejecutarse una sola vez.");
assert.equal(coordinator.snapshot()[0].name, "test");
stop();
assert.equal(coordinator.snapshot().length, 0);

console.log("OK: cache versionado y coordinador sin solapamiento.");
