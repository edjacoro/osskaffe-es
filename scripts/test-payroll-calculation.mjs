import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = source.indexOf("const PAYROLL_NEW_FORMULA_FROM = '2026-10';");
const end = source.indexOf('function localContractHistory', start);
assert.ok(start >= 0 && end > start);
const { resolvePayrollMonthlyHours, calculateMonthlyPayroll } = new Function(
  `${source.slice(start, end)}\nreturn { resolvePayrollMonthlyHours, calculateMonthlyPayroll };`,
)();

const contract = { payrollMonthlyHours: 100, hourlyRate: 10, overtimeRate: 11,
  extraHours: 3, extraHourlyRate: 2, holidayRate: 4 };
assert.deepEqual(calculateMonthlyPayroll(contract, 116.5, 6), {
  complete: true, difference: 16.5, hoursB: 16.5, costA: 1000, costB: 181.5,
  costExtra: 6, costHoliday: 24, total: 1211.5,
});
const below = calculateMonthlyPayroll(contract, 90, 0);
assert.equal(below.difference, -10);
assert.equal(below.hoursB, 0);
assert.equal(below.costA, 1000);
assert.equal(below.total, 1006);
const missing = calculateMonthlyPayroll({ ...contract, payrollMonthlyHours: null }, 90, 2);
assert.equal(missing.complete, false);
assert.equal(missing.total, null);
assert.equal(missing.hoursB, null);
assert.equal(calculateMonthlyPayroll({ ...contract, payrollMonthlyHours: 0 }, 10, 0).costB, 110);
assert.equal(calculateMonthlyPayroll({ ...contract, overtimeRate: 0 }, 116.5, 0).costB, 0);
const rounded = calculateMonthlyPayroll({ payrollMonthlyHours: 1, hourlyRate: 1.005, overtimeRate: 0,
  extraHours: 1, extraHourlyRate: 1.005, holidayRate: 0 }, 1, 0);
assert.equal(rounded.costA, 1.01);
assert.equal(rounded.costExtra, 1.01);
assert.equal(rounded.total, 2.02, 'El total debe coincidir con los subtotales expresados en centavos.');
assert.equal(calculateMonthlyPayroll({ ...contract, payrollMonthlyHours: 1, hourlyRate: 8.015 }, 1, 0).costA, 8.02);

const history = { months: {
  '2026-10': { employee: { payrollMonthlyHours: 100, payrollMonthlyHoursProvisional: false } },
  '2026-11': { employee: { hourlyRate: 12 } },
  '2026-12': { employee: { payrollMonthlyHours: 0, payrollMonthlyHoursProvisional: false } },
} };
assert.deepEqual(resolvePayrollMonthlyHours(history, 'employee', '2026-09'),
  { hours: null, provisional: false, sourceMonth: null });
assert.deepEqual(resolvePayrollMonthlyHours(history, 'employee', '2026-10'),
  { hours: 100, provisional: false, sourceMonth: '2026-10' });
assert.deepEqual(resolvePayrollMonthlyHours(history, 'employee', '2026-11'),
  { hours: 100, provisional: true, sourceMonth: '2026-10' });
assert.deepEqual(resolvePayrollMonthlyHours(history, 'employee', '2027-01'),
  { hours: 0, provisional: true, sourceMonth: '2026-12' });
assert.deepEqual(resolvePayrollMonthlyHours(history, 'other', '2026-11'),
  { hours: null, provisional: false, sourceMonth: null });

const rowsStart = source.indexOf('function getModernPayrollRows(');
const rowsEnd = source.indexOf('function renderPayrollPrint(', rowsStart);
assert.ok(rowsStart >= 0 && rowsEnd > rowsStart);
const shifts = {
  'barcelona:2026-10-05': [{ employeeId: 'bcn', start: 9, end: 16 }],
  'barcelona:2026-10-06': [{ employeeId: 'bcn', start: 9, end: 14 }],
  'madrid:2026-10-06': [{ employeeId: 'mad', start: 9, end: 14 }],
};
const employees = [{ id: 'bcn', locationId: 'barcelona' }, { id: 'mad', locationId: 'madrid' }];
const rowContract = { ...contract, payrollMonthlyHours: 8, extraHours: 2, extraHourlyRate: 3 };
const getRows = new Function('activeLocationId', 'monthInputValue', 'toDateInput', 'getLocationSettings',
  'getAllEmployees', 'normalizeLocationId', 'getContractForMonth', 'getMonthDays', 'getShiftsForDate',
  'getLocationPunches', 'calculateMonthlyPayroll',
  `${source.slice(rowsStart, rowsEnd)}\nreturn getModernPayrollRows;`)(
  'barcelona', () => '2026-10', (date) => typeof date === 'string' ? date : '2026-10-31',
  (location) => ({ holidays: [{ date: location === 'barcelona' ? '2026-10-05' : '2026-10-06' }] }),
  () => employees, (value) => value, () => ({ contract: rowContract }),
  () => ['2026-10-05', '2026-10-06'], (date, location) => shifts[`${location}:${date}`] || [],
  () => [], calculateMonthlyPayroll,
);
const bcn = getRows(new Date(2026, 9, 1), 'barcelona')[0];
assert.equal(bcn.planned, 12);
assert.equal(bcn.holidayHours, 7);
assert.equal(bcn.costs.total, 158);
const mad = getRows(new Date(2026, 9, 1), 'madrid')[0];
assert.equal(mad.planned, 5);
assert.equal(mad.holidayHours, 5, 'Cada tienda usa su propio calendario de feriados.');
assert.equal(mad.costs.difference, -3);
assert.equal(mad.costs.hoursB, 0);

console.log('OK: nómina mensual, horas B, recargos e historial provisional.');
