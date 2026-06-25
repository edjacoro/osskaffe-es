import {
  getBistroData,
  mergeBistroExpenses,
  mergeBistroSales,
  recentRange,
  writeBistroError,
} from "./_shared.mjs";

export default async () => {
  try {
    const { from, until } = recentRange(14);
    const { sales: result, expenses: expenseResult } = await getBistroData(from, until);
    await mergeBistroSales(result.sales, from, until);
    await mergeBistroExpenses(expenseResult.expenses, from, until);
  } catch (error) {
    await writeBistroError(error);
    throw error;
  }
};

export const config = {
  schedule: "*/30 * * * *",
};
