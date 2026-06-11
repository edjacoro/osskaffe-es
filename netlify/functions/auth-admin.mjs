import { createSessionCookie, response, secretsMatch } from "./_shared.mjs";

function normalizePin(value) {
  return String(value || "")
    .trim()
    .replace(/^ADMIN_PIN\s*=\s*/i, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

export default async (request) => {
  if (request.method !== "POST") return response({ ok: false }, 405);
  const body = await request.json();
  const configuredPin = normalizePin(process.env.ADMIN_PIN || "0000");
  if (!secretsMatch(normalizePin(body.pin), configuredPin)) {
    return response({ ok: false, error: "PIN incorrecto." }, 401);
  }
  return response({ ok: true, role: "admin" }, 200, {
    "Set-Cookie": createSessionCookie("admin"),
  });
};
