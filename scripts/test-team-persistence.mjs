import assert from "node:assert/strict";
import {
  mergeFullStatePreservingTeam,
  publicTeamEmployees,
  upsertTeamMemberState,
} from "../netlify/functions/_team.mjs";

const largeHistory = Array.from({ length: 25000 }, (_, index) => ({
  id: `sale-${index}`,
  locationId: index % 2 ? "barcelona" : "madrid",
  total: index / 10,
}));

let persistedState = {
  employees: [],
  profiles: {},
  baseSchedules: {},
  contracts: {},
  sales: largeHistory,
};

persistedState = upsertTeamMemberState(persistedState, {
  employee: {
    id: "ana-prueba",
    label: "Ana",
    role: "Barista",
    color: "#416877",
    locationId: "barcelona",
    active: true,
    canLogin: true,
    activeFrom: "2026-08-01",
  },
  profile: { fullName: "Ana Prueba", password: "no-debe-guardarse" },
  baseSchedule: { mode: "weekly", weeks: { a: {}, b: {} } },
  contract: { hoursPerWeek: 30 },
});

assert.equal(persistedState.sales.length, largeHistory.length, "La escritura de Personal debe conservar las ventas.");
assert.equal(persistedState.profiles["ana-prueba"].password, undefined, "Nunca se guardan contrasenas en Personal.");
assert(publicTeamEmployees(JSON.parse(JSON.stringify(persistedState)), "2026-08-07")
  .some((employee) => employee.id === "ana-prueba"), "El alta debe aparecer en una sesion sin cache.");

persistedState = upsertTeamMemberState(persistedState, {
  employee: {
    ...persistedState.employees.find((employee) => employee.id === "ana-prueba"),
    active: false,
    inactiveFrom: "2026-08-20",
  },
});

assert(publicTeamEmployees(persistedState, "2026-08-19").some((employee) => employee.id === "ana-prueba"),
  "Una baja programada debe seguir activa hasta la fecha elegida.");
assert(!publicTeamEmployees(persistedState, "2026-08-20").some((employee) => employee.id === "ana-prueba"),
  "La baja debe aplicarse en la fecha elegida.");
assert(persistedState.employees.some((employee) => employee.id === "ana-prueba"),
  "La baja no debe borrar al empleado del historial.");

persistedState = upsertTeamMemberState(persistedState, {
  employee: {
    id: "lucia-madrid",
    label: "Lucia",
    role: "Encargada",
    color: "#8d5a73",
    locationId: "madrid",
    active: true,
    canLogin: true,
    activeFrom: "2026-08-07",
  },
  profile: { fullName: "Lucia Madrid" },
});

const incognitoState = JSON.parse(JSON.stringify(persistedState));
const publicMadrid = publicTeamEmployees(incognitoState, "2026-08-07")
  .find((employee) => employee.id === "lucia-madrid");
assert.equal(publicMadrid?.locationId, "madrid", "El Team de Madrid debe persistir por separado.");

const staleBrowserSave = { ...incognitoState, employees: [] };
const afterStaleSave = mergeFullStatePreservingTeam(incognitoState, staleBrowserSave);
assert(afterStaleSave.employees.some((employee) => employee.id === "lucia-madrid"),
  "Una copia completa antigua no debe borrar empleados ya guardados en Netlify.");

console.log("OK: altas, bajas programadas, historial y lectura sin cache persisten correctamente.");
