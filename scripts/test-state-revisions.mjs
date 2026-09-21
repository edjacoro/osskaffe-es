import assert from "node:assert/strict";
import fs from "node:fs";
import { cleanMutationId, revisionEtag, revisionOf } from "../netlify/functions/state.mjs";

assert.equal(revisionOf({ _meta: { revision: 7 } }), 7);
assert.equal(revisionOf({}), 0);
assert.equal(revisionEtag(7), 'W/"oss-state-7"');
assert.equal(cleanMutationId("mutation_12345678"), "mutation_12345678");
assert.equal(cleanMutationId("bad id"), "");

const stateSource = fs.readFileSync(new URL("../netlify/functions/state.mjs", import.meta.url), "utf8");
const sharedSource = fs.readFileSync(new URL("../netlify/functions/_shared.mjs", import.meta.url), "utf8");
assert.match(stateSource, /if \(request\.headers\.get\("if-none-match"\) === etag\)/);
assert.match(stateSource, /recentMutationIds/);
assert.match(sharedSource, /revision: Number\(current\?\._meta\?\.revision \|\| 0\) \+ 1/);
assert.match(sharedSource, /if \(next === current\) return current/);

console.log("OK: revisiones, ETag e idempotencia del guardado compartido.");
