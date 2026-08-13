import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(appSource, /data-store-save>Guardar<\/button>/, "Cada dia debe tener un boton Guardar.");
assert.match(appSource, /saveButton\.addEventListener\("click", persist\)/, "El horario se guarda al pulsar el boton.");
assert.doesNotMatch(
  appSource,
  /(?:openInput|closeInput)\.addEventListener\("change", persist\)/,
  "No debe validar mientras el usuario todavia esta completando la hora.",
);
assert.match(appSource, /return !sharedStateEnabled \|\| persistSharedStateNow\(\);/, "El guardado debe esperar confirmacion compartida.");
assert.match(appSource, /Guardado en Netlify/, "Debe confirmar visualmente la persistencia.");
assert.match(appSource, /const editorLocationId = activeLocationId;/, "El editor debe conservar la tienda que se esta modificando.");
assert.match(appSource, /getLocationSettings\(locationId\)/, "Los horarios deben guardarse por separado para cada tienda.");
assert.match(html, /presioná GUARDAR en cada día modificado/);
assert.match(html, /app\.js\?v=53/);

console.log("OK: los horarios mensuales se validan y guardan solo al pulsar GUARDAR.");
