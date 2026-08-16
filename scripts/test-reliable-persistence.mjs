import assert from "node:assert/strict";
import fs from "node:fs";
import { applyChangeMutation } from "../netlify/functions/_changes.mjs";
import { applyEmployeeProfileUpdate } from "../netlify/functions/employee-profile.mjs";
import { mergeAdminState, mergeEmployeeState } from "../netlify/functions/_shared.mjs";

const current = {
  employees: [{ id: "ana", label: "Ana", active: true, canLogin: true, locationId: "madrid" }],
  profiles: { ana: { fullName: "Ana Actual", adminNotes: "privado" } },
  baseSchedules: { ana: { mode: "weekly", weeks: { a: { 1: [{ start: "08:00", end: "14:00" }] }, b: {} } } },
  contracts: { ana: { hoursPerWeek: 30 } },
  changes: [{ id: "vac-1", employeeId: "ana", status: "approved" }],
  settings: { storeLat: "actual", monthlyOpeningHours: {} },
  locationSettings: {
    barcelona: { monthlyOpeningHours: { "2026-08-03": { open: "09:00", close: "20:00", closed: true } } },
    madrid: { monthlyOpeningHours: { "2026-08-04": { open: "08:30", close: "14:00", closed: false } } },
  },
};
const stale = {
  ...structuredClone(current),
  profiles: { ana: { fullName: "Ana Viejo" } },
  contracts: { ana: { hoursPerWeek: 10 } },
  changes: [{ id: "vac-1", employeeId: "ana", status: "pending" }],
  settings: { storeLat: "nuevo", monthlyOpeningHours: {} },
  locationSettings: { barcelona: { monthlyOpeningHours: {} }, madrid: { monthlyOpeningHours: {} } },
};
const mergedAdmin = mergeAdminState(current, stale);
assert.equal(mergedAdmin.profiles.ana.fullName, "Ana Actual");
assert.equal(mergedAdmin.contracts.ana.hoursPerWeek, 30);
assert.equal(mergedAdmin.changes[0].status, "approved");
assert.equal(mergedAdmin.settings.storeLat, "nuevo", "Los ajustes normales deben seguir siendo editables.");
assert.equal(mergedAdmin.locationSettings.barcelona.monthlyOpeningHours["2026-08-03"].closed, true);
assert.equal(mergedAdmin.locationSettings.madrid.monthlyOpeningHours["2026-08-04"].close, "14:00");

const mergedEmployee = mergeEmployeeState(current, {
  profiles: { ana: { fullName: "Ana Viejo" } },
  punches: [],
  changes: [{ id: "vac-1", employeeId: "ana", status: "pending" }],
  wasteRecords: [],
}, "ana");
assert.equal(mergedEmployee.profiles.ana.fullName, "Ana Actual");
assert.equal(mergedEmployee.changes[0].status, "approved");

const profileState = applyEmployeeProfileUpdate(current, "ana", { fullName: "Lucía Gómez", phone: "600" });
assert.equal(profileState.employees[0].label, "Lucía");
assert.equal(profileState.profiles.ana.adminNotes, "privado");

const created = applyChangeMutation(current, {
  action: "create",
  change: {
    id: "lic-2", employeeId: "otro", date: "2026-08-10", endDate: "2026-08-12",
    reason: "Licencia", action: "extra", start: "08:00", end: "14:00",
  },
}, { role: "employee", employeeId: "ana" });
const ownChange = created.changes.find((change) => change.id === "lic-2");
assert.equal(ownChange.employeeId, "ana");
assert.equal(ownChange.locationId, "madrid");
assert.equal(ownChange.fullDay, true);
assert.equal(ownChange.action, "absence");

const withExtra = applyChangeMutation(created, {
  action: "create",
  change: {
    id: "extra-3", employeeId: "ana", date: "2026-08-20", endDate: "2026-08-24",
    reason: "Extra", action: "absence", start: "16:00", end: "20:00",
  },
}, { role: "admin" });
const extraChange = withExtra.changes.find((change) => change.id === "extra-3");
assert.equal(extraChange.action, "extra", "El servidor debe tratar Extra como horas agregadas en todo el intervalo.");
assert.equal(extraChange.endDate, "2026-08-24");

const reviewed = applyChangeMutation(created, { action: "review", id: "lic-2", status: "approved" }, { role: "admin" });
assert.equal(reviewed.changes.find((change) => change.id === "lic-2").status, "approved");

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.match(appSource, /let sharedMutationQueue = Promise\.resolve\(\)/);
assert.match(appSource, /await sharedMutationQueue\.catch/);
assert.match(appSource, /sendSharedMutation\("\/api\/store-hours"/);
assert.match(appSource, /sendSharedMutation\("\/api\/changes"/);
assert.match(appSource, /"\/api\/employee-profile"/);
assert.match(appSource, /async function handleEmpProfileForm[\s\S]*?await saveProfileData\(activeEmployeeId, data\)/);

console.log("OK: horarios, empleados y cambios resisten escrituras simultaneas y cierres de sesion.");
