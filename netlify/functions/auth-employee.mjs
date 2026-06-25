import {
  createSessionCookie,
  isActiveEmployee,
  readCredential,
  readStateEntry,
  response,
  updateState,
  verifyCredential,
  writeCredential,
} from "./_shared.mjs";

const REQUIRED_FIELDS = ["fullName", "phone", "email", "dni"];

function validEmployeeId(value) {
  return /^[a-z0-9_-]{1,40}$/i.test(value);
}

function cleanProfile(profile = {}) {
  return {
    fullName: String(profile.fullName || "").trim(),
    phone: String(profile.phone || "").trim(),
    email: String(profile.email || "").trim(),
    dni: String(profile.dni || "").trim(),
    area: ["Barista", "Pasteleria"].includes(profile.area) ? profile.area : "Barista",
  };
}

function profileComplete(profile = {}) {
  return REQUIRED_FIELDS.every((field) => String(profile[field] || "").trim());
}

export default async (request) => {
  if (request.method !== "POST") return response({ ok: false }, 405);
  const body = await request.json();
  const employeeId = String(body.employeeId || "");
  if (!validEmployeeId(employeeId)) {
    return response({ ok: false, error: "Empleado invalido." }, 400);
  }

  const action = String(body.action || "status");
  const credential = await readCredential("employee", employeeId);
  const { state } = await readStateEntry();
  if (!isActiveEmployee(state, employeeId)) {
    return response({ ok: false, error: "Este empleado no tiene acceso activo." }, 403);
  }
  const complete = profileComplete(state?.profiles?.[employeeId]);

  if (action === "status") {
    return response({ ok: true, needsSetup: !credential || !complete, profileComplete: complete });
  }

  if (action === "setup") {
    if (credential && complete) return response({ ok: false, error: "El acceso ya fue configurado." }, 409);
    const password = String(body.password || "");
    const profile = cleanProfile(body.profile);
    if (password.length < 4) {
      return response({ ok: false, error: "La contrasena debe tener al menos 4 caracteres." }, 400);
    }
    if (!profileComplete(profile)) {
      return response({ ok: false, error: "Completa todos los datos obligatorios." }, 400);
    }
    await updateState((current) => ({
      ...(current || {}),
      profiles: {
        ...(current?.profiles || {}),
        [employeeId]: { ...(current?.profiles?.[employeeId] || {}), ...profile },
      },
    }));
    await writeCredential("employee", employeeId, password);
  } else if (action === "login") {
    if (!credential) return response({ ok: false, error: "Primero configura tu acceso." }, 409);
    if (!verifyCredential(body.password, credential)) {
      return response({ ok: false, error: "Contrasena incorrecta." }, 401);
    }
  } else {
    return response({ ok: false, error: "Accion invalida." }, 400);
  }

  return response({ ok: true, role: "employee", profileComplete: action === "setup" || complete }, 200, {
    "Set-Cookie": createSessionCookie("employee", employeeId),
  });
};
