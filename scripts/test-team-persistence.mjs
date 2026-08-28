import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  deleteTestTeamMemberState,
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

persistedState = upsertTeamMemberState(persistedState, {
  employee: {
    id: "mock-septiembre",
    label: "Mock",
    role: "Prueba",
    color: "#416877",
    locationId: "madrid",
    active: true,
    canLogin: false,
    testEmployee: true,
    activeFrom: "2026-09-01",
  },
  profile: { area: "Prueba" },
  baseSchedule: { mode: "weekly", weeks: { a: { 2: [{ start: "08:00", end: "14:00" }] }, b: {} } },
  contract: { hoursPerWeek: 0 },
});
persistedState.punches = [{ id: "p-mock", employeeId: "mock-septiembre" }];
persistedState.changes = [{ id: "c-mock", employeeId: "mock-septiembre" }];
persistedState.wasteRecords = [{ id: "w-mock", employeeId: "mock-septiembre" }];
persistedState.payrollSettlements = { madrid: { "2026-09": { "mock-septiembre": { advance: 20 } } } };
persistedState.schedulePlans = {
  madrid: [{ id: "plan-prueba", weeks: [{ shifts: [{ employeeId: "mock-septiembre", day: 2, start: "08:00", end: "14:00" }] }] }],
};
assert.equal(persistedState.employees.find((employee) => employee.id === "mock-septiembre")?.testEmployee, true,
  "El alta de prueba debe conservar su marca especial.");
assert(!publicTeamEmployees(persistedState, "2026-09-02").some((employee) => employee.id === "mock-septiembre"),
  "Un empleado de prueba no debe aparecer en el ingreso del Team.");

persistedState = deleteTestTeamMemberState(persistedState, "mock-septiembre");
assert(!persistedState.employees.some((employee) => employee.id === "mock-septiembre"),
  "El empleado de prueba debe borrarse definitivamente.");
assert.equal(persistedState.profiles["mock-septiembre"], undefined);
assert.equal(persistedState.baseSchedules["mock-septiembre"], undefined);
assert.equal(persistedState.contracts["mock-septiembre"], undefined);
assert.equal(persistedState.punches.length, 0);
assert.equal(persistedState.changes.length, 0);
assert.equal(persistedState.wasteRecords.length, 0);
assert.equal(persistedState.payrollSettlements.madrid["2026-09"]["mock-septiembre"], undefined);
assert.equal(persistedState.schedulePlans.madrid[0].weeks[0].shifts.length, 0,
  "Al borrar una prueba tampoco deben quedar turnos fantasma en una programación fechada.");
persistedState = upsertTeamMemberState(persistedState, {
  employee: { ...persistedState.employees.find((employee) => employee.id === "ana-prueba"), testEmployee: true },
});
assert.equal(persistedState.employees.find((employee) => employee.id === "ana-prueba")?.testEmployee, false,
  "Un empleado real no debe poder convertirse en prueba para habilitar su borrado.");
assert.throws(() => deleteTestTeamMemberState(persistedState, "ana-prueba"), /Solo se pueden borrar/,
  "Un empleado real nunca debe borrarse definitivamente desde esta función.");

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(appSource, /getEmployeesForMonth\(activeMonth\)/,
  "La leyenda debe usar los empleados activos durante el mes visible, no solo hoy.");
assert.match(appSource, /employee\.testEmployee !== true/,
  "Una copia vieja del navegador no debe resucitar pruebas ya borradas.");
assert.match(appSource, /data-delete-test-employee/,
  "Fichas debe ofrecer borrado definitivo solo para empleados de prueba.");
assert.match(htmlSource, /id="teamMemberIsTest"/);
assert.match(htmlSource, /app\.js\?v=68/);

console.log("OK: altas, bajas, empleados de prueba y borrado definitivo persisten correctamente.");
