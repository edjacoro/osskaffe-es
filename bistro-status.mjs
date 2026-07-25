import {
  createSessionCookie,
  response,
  secretsMatch,
} from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "POST") return response({ ok: false }, 405);
  const body = await request.json();
  if (!secretsMatch(body.password, "ossbcn")) {
    return response({ ok: false, error: "Contrasena incorrecta." }, 401);
  }
  return response({ ok: true, role: "visitor" }, 200, {
    "Set-Cookie": createSessionCookie("visitor"),
  });
};
