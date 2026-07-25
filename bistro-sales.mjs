import { clearSessionCookie, response } from "./_shared.mjs";

export default async () => response({ ok: true }, 200, {
  "Set-Cookie": clearSessionCookie(),
});
