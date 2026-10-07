export interface ReportDateRange {
  startDate: string;
  endDate: string;
}

const iso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const range = (start: Date, end: Date): ReportDateRange => ({ startDate: iso(start), endDate: iso(end) });

export const dashboardDateRange = (period: string, customStart = "", customEnd = ""): ReportDateRange => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (period === "last_month") return range(new Date(year, month - 1, 1), new Date(year, month, 0));
  if (period === "this_quarter") {
    const quarterStart = Math.floor(month / 3) * 3;
    return range(new Date(year, quarterStart, 1), new Date(year, quarterStart + 3, 0));
  }
  if (period === "this_year") return range(new Date(year, 0, 1), new Date(year, 11, 31));
  if (period === "last_year") return range(new Date(year - 1, 0, 1), new Date(year - 1, 11, 31));
  if (period === "custom" && customStart && customEnd) return { startDate: customStart, endDate: customEnd };
  return range(new Date(year, month, 1), new Date(year, month + 1, 0));
};

export const reportsDateRange = (
  period: string,
  year: number,
  month: number,
  quarter: number,
  customStart = "",
  customEnd = "",
): ReportDateRange => {
  if (period === "custom" && customStart && customEnd) return { startDate: customStart, endDate: customEnd };
  if (period === "monthly") return range(new Date(year, month, 1), new Date(year, month + 1, 0));
  if (period === "quarterly") {
    const firstMonth = (quarter - 1) * 3;
    return range(new Date(year, firstMonth, 1), new Date(year, firstMonth + 3, 0));
  }
  return range(new Date(year, 0, 1), new Date(year, 11, 31));
};

export const analyticsDateRange = (period: "7d" | "30d" | "90d" | "1y", year: number): ReportDateRange => {
  const now = new Date();
  const end = year === now.getFullYear() ? now : new Date(year, 11, 31);
  if (period === "1y") return range(new Date(year, 0, 1), end);
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  if (start.getFullYear() < year) start.setTime(new Date(year, 0, 1).getTime());
  return range(start, end);
};
