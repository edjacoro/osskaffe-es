import {
  createSessionCookie,
  readCredential,
  response,
  verifyCredential,
} from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "POST") return response({ ok: false }, 405);
  const body = await request.json();
  const credential = await readCredential("visit");
  if (!credential) return response({ ok: false, error: "El acceso de visita esta desactivado." }, 403);
  if (!verifyCredential(body.password, credential)) {
    return response({ ok: false, error: "Contrasena incorrecta." }, 401);
  }
  return response({ ok: true, role: "visitor" }, 200, {
    "Set-Cookie": createSessionCookie("visitor"),
  });
};
