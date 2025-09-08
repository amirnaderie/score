import { toEnglishDigits } from "@/app/lib/utility";
import moment from "moment-jalaali";

export const convertToGregorian = (persianDate: string): string | null => {
  const parts = persianDate.split("/");
  if (parts.length !== 3) {
    return null; // Invalid format
  }

  const year = parseInt(toEnglishDigits(parts[0]), 10);
  const month = parseInt(toEnglishDigits(parts[1]), 10);
  const day = parseInt(toEnglishDigits(parts[2]), 10);

if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }

  // Simple range checks before Moment
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Gregorian check
  if (year > 1500) {
    const date = new Date(`${year}-${month}-${day}`);
    return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  }

  // Assume it's Persian (Jalali) and convert
  const m = moment(`${year}/${month}/${day}`, "jYYYY/jMM/jDD");

  if (m.isValid()) {
    return m.format("YYYY-MM-DD");
  }

  return null;
};