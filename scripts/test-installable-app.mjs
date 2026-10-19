import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url));
const html = read("index.html").toString("utf8");
const manifest = JSON.parse(read("manifest.webmanifest").toString("utf8"));
const installScript = read("install-app.js").toString("utf8");
const buildScript = readFileSync(new URL("build-netlify.mjs", import.meta.url), "utf8");

assert.equal(manifest.name, "ÖSS Kaffe App");
assert.equal(manifest.short_name, "ÖSS Kaffe App");
assert.equal(manifest.start_url, "/");
assert.equal(manifest.scope, "/");
assert.equal(manifest.display, "standalone");
assert.match(manifest.description, /Requiere conexión a Internet/);
assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
assert.match(html, /rel="apple-touch-icon" href="\/apple-touch-icon\.png"/);
assert.match(html, /id="installAppButton"/);
assert.match(html, /install-app\.js\?v=1/);
assert.doesNotMatch(installScript, /serviceWorker|caches\./,
  "La instalación no debe cachear ventas, turnos ni gastos como datos vigentes.");

for (const [file, size] of [["app-icon-192.png", 192], ["app-icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  const png = read(file);
  assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
  assert.match(buildScript, new RegExp(file.replace(".", "\\.")));
}
assert.match(buildScript, /manifest\.webmanifest/);
assert.match(buildScript, /install-app\.js/);

function launchInstallUi(userAgent) {
  const listeners = new Map();
  const buttonListeners = new Map();
  const button = {
    hidden: false,
    disabled: false,
    addEventListener: (name, handler) => buttonListeners.set(name, handler),
  };
  const help = { hidden: true, textContent: "" };
  const display = { matches: false, addEventListener() {} };
  runInNewContext(installScript, {
    document: { querySelector: (selector) => selector === "#installAppButton" ? button : help },
    window: {
      navigator: { userAgent, platform: "", maxTouchPoints: 0, standalone: false },
      matchMedia: () => display,
      addEventListener: (name, handler) => listeners.set(name, handler),
    },
  });
  return { button, help, listeners, buttonListeners };
}

const iphone = launchInstallUi("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
await iphone.buttonListeners.get("click")();
assert.match(iphone.help.textContent, /Agregar a pantalla de inicio/);
assert.match(iphone.help.textContent, /Necesita Internet/);

const android = launchInstallUi("Mozilla/5.0 (Linux; Android 15)");
let prevented = false;
let prompted = false;
android.listeners.get("beforeinstallprompt")({
  preventDefault() { prevented = true; },
  async prompt() { prompted = true; },
  userChoice: Promise.resolve({ outcome: "accepted" }),
});
await android.buttonListeners.get("click")();
assert.equal(prevented, true);
assert.equal(prompted, true);
android.listeners.get("appinstalled")();
assert.equal(android.button.hidden, true);

console.log("OK: instalación Android/iPhone, iconos y paquete Netlify sin caché de datos.");
