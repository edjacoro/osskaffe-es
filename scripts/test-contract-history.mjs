import assert from "node:assert/strict";
import {
  applyContractHistoryMutation,
  contractHistoryMutationIsPersisted,
} from "../netlify/functions/contract-history.mjs";
import { mergeAdminState } from "../netlify/functions/_shared.mjs";
import { deleteTestTeamMemberState } from "../netlify/functions/_team.mjs";

const currentMonth = new Date().toISOString().slice(0, 7);
const [year, month] = currentMonth.split("-").map(Number);
const previousMonth = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7);
const original = {
  employees: [
    { id: "madrid-one", label: "Uno", locationId: "madrid" },
    { id: "barcelona-one", label: "Dos", locationId: "barcelona" },
    { id: "test-one", label: "Prueba", locationId: "madrid", testEmployee: true },
  ],
  contracts: {
    "madrid-one": { hoursPerWeek: 40, hourlyRate: 10, overtimeRate: 15 },
    "barcelona-one": { hoursPerWeek: 30, hourlyRate: 12, overtimeRate: 18 },
    "test-one": { hoursPerWeek: 20, hourlyRate: 8, overtimeRate: 12 },
  },
};

let state = applyContractHistoryMutation(original, { action: "initialize", month: currentMonth });
assert.equal(state.contractHistory.baselineMonth, currentMonth);
assert.equal(state.contractHistory.baseline["madrid-one"].hourlyRate, 10);
assert.equal(contractHistoryMutationIsPersisted(state, { action: "initialize", month: currentMonth }), true);
assert.equal(applyContractHistoryMutation(state, { action: "initialize", month: currentMonth }), state);

const pastUpdate = {
  action: "upsert", month: previousMonth, employeeId: "madrid-one", locationId: "madrid",
  contract: {
    hoursPerWeek: 35, hourlyRate: 9, overtimeRate: 14, holidayRate: 3,
    extraHours: 4, extraHourlyRate: 20,
  },
};
const firstPastWrite = applyContractHistoryMutation(original, pastUpdate);
assert.equal(firstPastWrite.contractHistory.baselineMonth, currentMonth,
  "Una primera edición histórica no debe presentar las tarifas actuales como históricas confirmadas.");
assert.equal(firstPastWrite.contractHistory.months[previousMonth]["madrid-one"].verified, false);
state = applyContractHistoryMutation(state, pastUpdate);
assert.equal(state.contractHistory.months[previousMonth]["madrid-one"].extraHours, 4);
assert.equal(state.contractHistory.months[previousMonth]["madrid-one"].extraHourlyRate, 20);
assert.equal(state.contractHistory.months[previousMonth]["madrid-one"].verified, false);
assert.equal(state.contracts["madrid-one"].hourlyRate, 10, "Un mes anterior no cambia la tarifa actual.");
assert.equal(state.contractHistory.baseline["madrid-one"].hourlyRate, 10, "La referencia provisional es inmutable.");
assert.equal(contractHistoryMutationIsPersisted(state, pastUpdate), true);
assert.equal(contractHistoryMutationIsPersisted(state, {
  ...pastUpdate, contract: { ...pastUpdate.contract, extraHours: 5 },
}), false, "No se debe confirmar un importe distinto del solicitado.");

const verify = {
  action: "verify", month: previousMonth, employeeId: "madrid-one", locationId: "madrid",
};
state = applyContractHistoryMutation(state, verify);
assert.equal(state.contractHistory.months[previousMonth]["madrid-one"].verified, true);
assert.equal(contractHistoryMutationIsPersisted(state, verify), true);
state = applyContractHistoryMutation(state, {
  ...pastUpdate, contract: { ...pastUpdate.contract, extraHours: 5 },
});
assert.equal(state.contractHistory.months[previousMonth]["madrid-one"].verified, true,
  "Cambiar solo las horas extra manuales no desconfirma la tarifa.");
state = applyContractHistoryMutation(state, {
  ...pastUpdate, contract: { ...pastUpdate.contract, hourlyRate: 11 },
});
assert.equal(state.contractHistory.months[previousMonth]["madrid-one"].verified, false,
  "Una tarifa histórica modificada debe volver a ser provisional.");

const currentUpdate = {
  ...pastUpdate, month: currentMonth,
  contract: { ...pastUpdate.contract, hoursPerWeek: 38, hourlyRate: 13, extraHours: 2 },
};
state = applyContractHistoryMutation(state, currentUpdate);
assert.equal(state.contracts["madrid-one"].hourlyRate, 13);
assert.equal(state.contractHistory.baseline["madrid-one"].hourlyRate, 10);
assert.equal(state.contractHistory.months[previousMonth]["madrid-one"].hourlyRate, 11);
assert.equal(state.contractHistory.months[currentMonth]["madrid-one"].verified, true);
assert.equal(contractHistoryMutationIsPersisted(state, currentUpdate), true);

assert.throws(() => applyContractHistoryMutation(state, {
  ...currentUpdate, locationId: "barcelona",
}), (error) => error.status === 404, "Los contratos están aislados por tienda.");
assert.throws(() => applyContractHistoryMutation(state, {
  ...currentUpdate, contract: { ...currentUpdate.contract, extraHours: -1 },
}), (error) => error.status === 400);

const merged = mergeAdminState(state, { ...state, contractHistory: null, contracts: original.contracts });
assert.equal(merged.contractHistory.months[currentMonth]["madrid-one"].hourlyRate, 13,
  "Un guardado general obsoleto no debe borrar el historial.");
assert.equal(merged.contracts["madrid-one"].hourlyRate, 13);

const removed = deleteTestTeamMemberState(state, "test-one");
assert.equal(removed.contractHistory.baseline["test-one"], undefined);
assert.equal(removed.contracts["test-one"], undefined);

console.log("Contract history tests passed.");
