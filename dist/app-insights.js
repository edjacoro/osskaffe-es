(function registerOssInsights(globalScope) {
  "use strict";

  function combineFinancialMetrics(rows = []) {
    const combined = rows.reduce((totals, row) => {
      totals.totalSales += Number(row.totalSales || 0);
      totals.ticketCount += Number(row.ticketCount || 0);
      totals.totalExpenses += Number(row.totalExpenses || 0);
      totals.result += Number(row.result || 0);
      return totals;
    }, { totalSales: 0, ticketCount: 0, totalExpenses: 0, result: 0 });
    combined.avgTicket = combined.ticketCount > 0
      ? combined.totalSales / combined.ticketCount
      : 0;
    return combined;
  }

  function percentChange(current, previous) {
    const currentValue = Number(current || 0);
    const previousValue = Number(previous || 0);
    if (!previousValue) return null;
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  }

  function calculateLaborProductivity(input = {}) {
    const sales = Number(input.sales || 0);
    const plannedHours = Number(input.plannedHours || 0);
    const punchedHours = Number(input.punchedHours || 0);
    const laborCost = Number(input.laborCost || 0);
    return {
      plannedHours,
      punchedHours,
      hoursDifference: punchedHours - plannedHours,
      salesPerPlannedHour: plannedHours > 0 ? sales / plannedHours : 0,
      salesPerPunchedHour: punchedHours > 0 ? sales / punchedHours : 0,
      laborCost,
      laborCostPercent: sales > 0 ? (laborCost / sales) * 100 : 0,
    };
  }

  function buildConfidenceStatus(input = {}) {
    const ticketCount = Math.max(0, Number(input.ticketCount || 0));
    const detailTickets = Math.max(0, Number(input.detailTickets || 0));
    const missingOpenDays = Math.max(0, Number(input.missingOpenDays || 0));
    const coveragePercent = ticketCount > 0
      ? Math.min(100, (detailTickets / ticketCount) * 100)
      : 0;

    if (input.syncError) {
      return { tone: "danger", label: "Revisar sincronización", coveragePercent };
    }
    if (!ticketCount) {
      return { tone: "neutral", label: "Sin ventas registradas", coveragePercent };
    }
    if (missingOpenDays > 0 || coveragePercent < 90) {
      return { tone: "warning", label: "Información incompleta", coveragePercent };
    }
    if (coveragePercent < 99.5) {
      return { tone: "attention", label: "Cobertura parcial", coveragePercent };
    }
    return { tone: "positive", label: "Información completa", coveragePercent };
  }

  globalScope.OssInsights = Object.freeze({
    combineFinancialMetrics,
    percentChange,
    calculateLaborProductivity,
    buildConfidenceStatus,
  });
})(typeof window !== "undefined" ? window : globalThis);
