import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, "dist");
const files = ["index.html", "app.js", "styles.css", "xlsx.full.min.js", "_redirects"];

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
await Promise.all(files.map((file) => fs.copyFile(path.join(root, file), path.join(output, file))));
