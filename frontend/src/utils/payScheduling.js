const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

export const resolveDayOfMonth = (spec, year, month) => {
  if (spec === "end_of_month") return daysInMonth(year, month);
  const day = parseInt(spec, 10);
  if (isNaN(day)) return 1;
  return Math.min(day, daysInMonth(year, month));
};

const makeDate = (year, month, day) => new Date(year, month - 1, day);
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };

const resolvePeriodEnd = (config, year, payMonth, payDay) => {
  if (!config) return makeDate(year, payMonth, payDay);
  if (config.mode === "days_before_payday") {
    return addDays(makeDate(year, payMonth, payDay), -parseInt(config.daysBefore || 0, 10));
  }
  let targetMonth = payMonth, targetYear = year;
  if (config.month === "previous") {
    targetMonth -= 1;
    if (targetMonth < 1) { targetMonth = 12; targetYear -= 1; }
  }
  return makeDate(targetYear, targetMonth, resolveDayOfMonth(config.day, targetYear, targetMonth));
};

export const generateSemiMonthlyPeriods = (schedule, startYear, startMonth, count) => {
  const periods = [];
  let year = startYear, month = startMonth, previousPeriodEnd = null, safety = 0;
  while (periods.length < count && safety < 60) {
    safety += 1;
    const firstPayDay = resolveDayOfMonth(schedule.firstPayday, year, month);
    const firstPeriodEnd = resolvePeriodEnd(schedule.firstPeriodEnd, year, month, firstPayDay);
    const firstPeriodStart = previousPeriodEnd ? addDays(previousPeriodEnd, 1) : makeDate(year, month, 1);
    periods.push({ periodStart: firstPeriodStart, periodEnd: firstPeriodEnd, payDate: makeDate(year, month, firstPayDay) });
    if (periods.length >= count) break;
    const secondPayDay = resolveDayOfMonth(schedule.secondPayday, year, month);
    const secondPeriodEnd = resolvePeriodEnd(schedule.secondPeriodEnd, year, month, secondPayDay);
    periods.push({ periodStart: addDays(firstPeriodEnd, 1), periodEnd: secondPeriodEnd, payDate: makeDate(year, month, secondPayDay) });
    previousPeriodEnd = secondPeriodEnd;
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return periods.slice(0, count);
};

export const generatePayPeriods = (schedule, count) => {
  if (!schedule || !schedule.frequency) return [];
  const now = new Date();
  if (schedule.frequency === "semi_monthly") return generateSemiMonthlyPeriods(schedule, now.getFullYear(), now.getMonth() + 1, count || 5);
  return [];
};

export const formatPeriodDate = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return d + "/" + m + "/" + date.getFullYear();
};

const ORDINAL_LABELS = {1:"1st",2:"2nd",3:"3rd",4:"4th",5:"5th",6:"6th",7:"7th",8:"8th",9:"9th",10:"10th",11:"11th",12:"12th",13:"13th",14:"14th",15:"15th",16:"16th",17:"17th",18:"18th",19:"19th",20:"20th",21:"21st",22:"22nd",23:"23rd",24:"24th",25:"25th",26:"26th",27:"27th",28:"28th",29:"29th",30:"30th",31:"31st"};

export const DAY_OF_MONTH_OPTIONS = [
  ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: ORDINAL_LABELS[i + 1] })),
  { value: "end_of_month", label: "End of month" },
];

export const DEFAULT_SEMI_MONTHLY_SCHEDULE = {
  frequency: "semi_monthly",
  firstPayday: "15",
  firstPeriodEnd: { mode: "end_date", month: "same", day: "14", daysBefore: 5 },
  secondPayday: "end_of_month",
  secondPeriodEnd: { mode: "end_date", month: "same", day: "end_of_month", daysBefore: 5 },
  name: "Semi-monthly",
  isDefaultForNewEmployees: false,
};
