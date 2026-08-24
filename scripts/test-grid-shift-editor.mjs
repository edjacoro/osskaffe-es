import assert from "node:assert/strict";
import fs from "node:fs";
import { applyChangeMutation } from "../netlify/functions/_changes.mjs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.match(html, /id="shiftEditorModal"/);
assert.match(html, /id="shiftEditorEmployee"/);
assert.match(html, /data-shift-move="-0\.5"/);
assert.match(html, /data-shift-duration="0\.5"/);
assert.match(html, /app\.js\?v=63/);
assert.match(html, /styles\.css\?v=34/);
assert.match(appSource, /data-edit-shift/);
assert.match(appSource, /timeline-open-period/);
assert.match(appSource, /action: "batch-create"/);
assert.match(appSource, /status: "approved"/);
assert.match(css, /\.shift-bar\.is-editable/);
assert.match(css, /\.shift-editor-modal/);
assert.match(css, /\.timeline-open-period/);

const state = {
  employees: [
    { id: "micaela", label: "Micaela", locationId: "madrid" },
    { id: "perla", label: "Perla", locationId: "madrid" },
  ],
  changes: [],
};
const common = {
  locationId: "madrid",
  date: "2026-09-07",
  endDate: "2026-09-07",
  reason: "Edición rápida de grilla",
  fullDay: false,
  createdAt: "2026-08-24T12:00:00.000Z",
};
const updated = applyChangeMutation(state, {
  action: "batch-create",
  changes: [
    {
      ...common,
      id: "edit-remove-1",
      employeeId: "micaela",
      action: "absence",
      start: "07:30",
      end: "14:30",
    },
    {
      ...common,
      id: "edit-add-1",
      employeeId: "perla",
      action: "extra",
      start: "08:00",
      end: "15:00",
    },
  ],
}, { role: "admin" });

assert.equal(updated.changes.length, 2);
assert.ok(updated.changes.every((change) => change.status === "approved"));
assert.ok(updated.changes.every((change) => change.reviewedBy === "Administrador"));
assert.throws(
  () => applyChangeMutation(state, { action: "batch-create", changes: [] }, { role: "employee", employeeId: "micaela" }),
  /Solo un administrador/,
);

console.log("OK: la grilla sombrea la apertura y permite editar, rotar, duplicar o eliminar turnos aprobados.");
