import { createSessionCookie, response } from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "POST") return response({ ok: false }, 405);
  if (!process.env.SESSION_SECRET) {
    return response({ ok: false, error: "Falta SESSION_SECRET en Netlify." }, 503);
  }
  const body = await request.json();
  const employeeId = String(body.employeeId || "");
  if (!/^[a-z0-9_-]{1,40}$/i.test(employeeId)) {
    return response({ ok: false, error: "Empleado invalido." }, 400);
  }
  return response({ ok: true, role: "employee" }, 200, {
    "Set-Cookie": createSessionCookie("employee", employeeId),
  });
};
