import moment from "moment-jalaali";

export const convertToGregorian = (persianDate: string): string | null => {
  const parts = persianDate.split("/");
  if (parts.length !== 3) {
    return null; // Invalid format
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Check if the date is already in Gregorian format (e.g., 2023/04/04)
  if (year > 1500) { // A simple heuristic to check for Gregorian year
    // Assume it's already Gregorian, just reformat if needed
    const date = new Date(persianDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return null;
  }

  // Assume it's Persian (Jalali) and convert
  const m = moment(`${year}/${month}/${day}`, "jYYYY/jMM/jDD");

  if (m.isValid()) {
    return m.format("YYYY-MM-DD");
  }

  return null;
};