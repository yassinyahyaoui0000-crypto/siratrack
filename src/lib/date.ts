import { addDays, format, parseISO, startOfWeek, subDays } from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

export function getTodayDateString(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getYesterdayDateString(dateString: string) {
  return format(subDays(parseISO(dateString), 1), DATE_FORMAT);
}

export function getCurrentWeekDates(dateString: string) {
  const start = startOfWeek(parseISO(dateString), { weekStartsOn: 1 });

  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(start, index), DATE_FORMAT),
  );
}

export function shiftDateString(dateString: string, amount: number) {
  return format(addDays(parseISO(dateString), amount), DATE_FORMAT);
}

export function formatDayLabel(dateString: string) {
  return format(parseISO(dateString), "EEE");
}

export function formatShortDateLabel(dateString: string) {
  return format(parseISO(dateString), "d MMM");
}

export function formatLongDateLabel(dateString: string) {
  return format(parseISO(dateString), "EEEE, d MMM yyyy");
}

export function isFutureDate(dateString: string, todayDateString: string) {
  return dateString > todayDateString;
}
