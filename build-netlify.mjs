import {
  getBistroData,
  hasBistroCredentials,
  LOCATION_IDS,
  mergeBistroExpenses,
  mergeBistroSales,
  recentRange,
  writeBistroError,
} from "./_shared.mjs";

export default async () => {
  const { from, until } = recentRange(14);
  const errors = [];
  for (const locationId of LOCATION_IDS) {
    if (!hasBistroCredentials(locationId)) continue;
    try {
      const { sales: result, expenses: expenseResult } = await getBistroData(from, until, locationId);
      await mergeBistroSales(result.sales, from, until, locationId);
      await mergeBistroExpenses(expenseResult.expenses, from, until, locationId);
    } catch (error) {
      await writeBistroError(error, locationId);
      errors.push(error);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
};

export const config = {
  schedule: "*/30 * * * *",
};
