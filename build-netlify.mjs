import {
  getBistroSales,
  mergeBistroSales,
  recentRange,
  writeBistroError,
} from "./_shared.mjs";

export default async () => {
  try {
    const { from, until } = recentRange(14);
    const result = await getBistroSales(from, until);
    await mergeBistroSales(result.sales, from, until);
  } catch (error) {
    await writeBistroError(error);
    throw error;
  }
};

export const config = {
  schedule: "*/30 * * * *",
};
