import { createSessionCookie, response, secretsMatch } from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "POST") return response({ ok: false }, 405);
  if (!process.env.ADMIN_PIN || !process.env.SESSION_SECRET) {
    return response({ ok: false, error: "Faltan ADMIN_PIN o SESSION_SECRET en Netlify." }, 503);
  }
  const body = await request.json();
  if (!secretsMatch(body.pin, process.env.ADMIN_PIN || "")) {
    return response({ ok: false, error: "PIN incorrecto." }, 401);
  }
  return response({ ok: true, role: "admin" }, 200, {
    "Set-Cookie": createSessionCookie("admin"),
  });
};
