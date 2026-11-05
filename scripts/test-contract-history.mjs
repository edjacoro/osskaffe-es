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

const initialPayroll = applyContractHistoryMutation(original, {
  action: "initialize", month: "2026-11", currentMonth: "2026-11",
});
assert.equal(initialPayroll.contractHistory.baseline["madrid-one"].payrollMonthlyHours, null,
  "Sin información de nómina no se deben inventar horas.");
const octoberPayload = {
  action: "upsert", month: "2026-10", currentMonth: "2026-11", employeeId: "madrid-one", locationId: "madrid",
  contract: { hoursPerWeek: 40, hourlyRate: 10, overtimeRate: 15,
    payrollMonthlyHours: 100, payrollMonthlyHoursProvisional: false },
};
const withOctober = applyContractHistoryMutation(initialPayroll, octoberPayload);
assert.equal(withOctober.contractHistory.months["2026-10"]["madrid-one"].payrollMonthlyHours, 100);
assert.equal(withOctober.contractHistory.months["2026-10"]["madrid-one"].payrollMonthlyHoursProvisional, false);
assert.equal(contractHistoryMutationIsPersisted(withOctober, octoberPayload), true);
assert.equal(withOctober.contractHistory.baseline["barcelona-one"].payrollMonthlyHours, null,
  "Guardar una persona no debe afectar la otra sucursal.");

const novemberPayload = {
  ...octoberPayload, month: "2026-11",
  contract: { ...octoberPayload.contract, payrollMonthlyHoursProvisional: true },
};
const withNovember = applyContractHistoryMutation(withOctober, novemberPayload);
assert.equal(contractHistoryMutationIsPersisted(withNovember, novemberPayload), true);
assert.equal(withNovember.contracts["madrid-one"].payrollMonthlyHours, 100);
assert.equal(withNovember.contractHistory.months["2026-11"]["madrid-one"].payrollMonthlyHoursProvisional, true);
const verifiedRates = applyContractHistoryMutation(withNovember, {
  action: "verify", month: "2026-11", currentMonth: "2026-11", employeeId: "madrid-one", locationId: "madrid",
});
assert.equal(verifiedRates.contractHistory.months["2026-11"]["madrid-one"].payrollMonthlyHoursProvisional, true,
  "Confirmar las tarifas no debe confirmar las horas de nómina copiadas.");
const oldClientUpdate = {
  ...novemberPayload, contract: { hoursPerWeek: 35, hourlyRate: 10, overtimeRate: 15 },
};
const afterOldClient = applyContractHistoryMutation(verifiedRates, oldClientUpdate);
assert.equal(afterOldClient.contractHistory.months["2026-11"]["madrid-one"].payrollMonthlyHours, 100);
assert.equal(afterOldClient.contractHistory.months["2026-11"]["madrid-one"].payrollMonthlyHoursProvisional, true,
  "Una edición antigua de tarifa no debe borrar ni confirmar las horas provisionales.");
assert.equal(contractHistoryMutationIsPersisted(afterOldClient, oldClientUpdate), true);
const changedRateWithoutFlag = {
  ...novemberPayload, contract: { hoursPerWeek: 36, hourlyRate: 10, overtimeRate: 15, payrollMonthlyHours: "100" },
};
const afterRate = applyContractHistoryMutation(afterOldClient, changedRateWithoutFlag);
assert.equal(afterRate.contractHistory.months["2026-11"]["madrid-one"].payrollMonthlyHoursProvisional, true);
assert.equal(contractHistoryMutationIsPersisted(afterRate, changedRateWithoutFlag), true);
const confirmedPayroll = {
  ...novemberPayload, contract: { ...novemberPayload.contract, payrollMonthlyHoursProvisional: false },
};
const afterConfirm = applyContractHistoryMutation(afterRate, confirmedPayroll);
assert.equal(afterConfirm.contractHistory.months["2026-11"]["madrid-one"].payrollMonthlyHoursProvisional, false);
assert.equal(contractHistoryMutationIsPersisted(afterConfirm, confirmedPayroll), true);
assert.equal(contractHistoryMutationIsPersisted(afterConfirm, novemberPayload), false,
  "El estado provisional debe verificarse, no solo la cantidad de horas.");

const zeroPayload = { ...novemberPayload, contract: { ...novemberPayload.contract,
  payrollMonthlyHours: 0, payrollMonthlyHoursProvisional: false } };
const withZero = applyContractHistoryMutation(afterConfirm, zeroPayload);
assert.equal(contractHistoryMutationIsPersisted(withZero, zeroPayload), true);
const nullPayload = { ...zeroPayload, contract: { ...zeroPayload.contract, payrollMonthlyHours: null } };
assert.equal(contractHistoryMutationIsPersisted(withZero, nullPayload), false,
  "Cero es un valor real, distinto de horas sin cargar.");
const withNull = applyContractHistoryMutation(withZero, nullPayload);
assert.equal(contractHistoryMutationIsPersisted(withNull, nullPayload), true);
assert.equal(contractHistoryMutationIsPersisted(withNull, zeroPayload), false);
assert.throws(() => applyContractHistoryMutation(withNull, { ...zeroPayload,
  contract: { ...zeroPayload.contract, payrollMonthlyHours: -1 } }), (error) => error.status === 400);
assert.throws(() => applyContractHistoryMutation(withNull, { ...zeroPayload,
  contract: { ...zeroPayload.contract, payrollMonthlyHours: 745 } }), (error) => error.status === 400);
assert.throws(() => applyContractHistoryMutation(withNull, { ...zeroPayload,
  contract: { ...zeroPayload.contract, payrollMonthlyHours: true } }), (error) => error.status === 400);

const withBaselinePayroll = applyContractHistoryMutation({ ...original,
  contracts: { ...original.contracts, "madrid-one": { ...original.contracts["madrid-one"], payrollMonthlyHours: 80 } },
}, { action: "initialize", month: "2026-11", currentMonth: "2026-11" });
const verifiedPast = applyContractHistoryMutation(withBaselinePayroll, {
  action: "verify", month: "2026-10", currentMonth: "2026-11", employeeId: "madrid-one", locationId: "madrid",
});
assert.equal(verifiedPast.contractHistory.months["2026-10"]["madrid-one"].payrollMonthlyHours, null,
  "No hay que trasladar horas de nómina actuales a un mes anterior sin datos.");
const verifiedFuture = applyContractHistoryMutation(withBaselinePayroll, {
  action: "verify", month: "2026-12", currentMonth: "2026-11", employeeId: "madrid-one", locationId: "madrid",
});
assert.equal(verifiedFuture.contractHistory.months["2026-12"]["madrid-one"].payrollMonthlyHours, 80);
assert.equal(verifiedFuture.contractHistory.months["2026-12"]["madrid-one"].payrollMonthlyHoursProvisional, true,
  "Las horas copiadas hacia adelante son provisionales aunque se verifiquen tarifas.");

console.log("Contract history tests passed.");
