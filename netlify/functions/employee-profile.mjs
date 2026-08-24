import {
  isActiveEmployee,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";

const PROFILE_FIELDS = [
  "fullName", "preferredName", "phone", "email", "dni", "area", "ssNumber", "iban",
  "contractType", "startDate", "address", "emergencyName", "emergencyPhone",
];

function cleanProfile(input = {}, existing = {}) {
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [
    field,
    String(Object.hasOwn(input, field) ? input[field] || "" : existing[field] || "")
      .trim()
      .slice(0, field === "address" ? 200 : 120),
  ]));
}

export function applyEmployeeProfileUpdate(current, employeeId, input = {}) {
  if (!isActiveEmployee(current, employeeId)) throw new Error("Este empleado no tiene acceso activo.");
  const employees = Array.isArray(current?.employees) ? [...current.employees] : [];
  const index = employees.findIndex((employee) => employee.id === employeeId);
  if (index < 0) throw new Error("El empleado no existe.");
  const profile = cleanProfile(input, current?.profiles?.[employeeId] || {});
  const firstName = profile.fullName.replace(/\s+/g, " ").split(" ")[0];
  const preferredName = profile.preferredName.replace(/\s+/g, " ").trim();
  if (preferredName || firstName) {
    employees[index] = {
      ...employees[index],
      preferredName,
      label: preferredName || firstName,
    };
  }
  return {
    ...(current || {}),
    employees,
    profiles: {
      ...(current?.profiles || {}),
      [employeeId]: {
        ...(current?.profiles?.[employeeId] || {}),
        ...profile,
        locationId: employees[index].locationId,
      },
    },
  };
}

export default async (request) => {
  if (request.method !== "PUT") return response({ ok: false }, 405);
  const session = requireSession(request, "employee");
  if (session instanceof Response) return session;
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return response({ ok: false, error: "Solicitud invalida." }, 400);
  }
  try {
    const state = await updateState((current) => applyEmployeeProfileUpdate(current, session.employeeId, body.profile));
    return response({
      ok: true,
      profile: state.profiles?.[session.employeeId] || {},
      employee: (state.employees || []).find((employee) => employee.id === session.employeeId) || null,
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response({ ok: false, error: error.message || "No se pudo guardar la ficha." }, 400);
  }
};
