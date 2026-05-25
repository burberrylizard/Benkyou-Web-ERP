import { getInitials } from "./session";

export function fullName(user) {
  const name = `${user?.firstName || user?.FirstName || ""} ${user?.lastName || user?.LastName || ""}`.trim();
  return name || user?.name || user?.email || user?.Email || "Unknown user";
}

export function initialsFor(user) {
  return getInitials(fullName(user));
}

export function parseApiDate(dateStr) {
  if (!dateStr) return null;
  let formatted = dateStr;
  if (typeof formatted === "string") {
    if (!formatted.endsWith("Z") && !formatted.includes("+") && !/-\d{2}:\d{2}$/.test(formatted)) {
      formatted += "Z";
    }
  }
  const d = new Date(formatted);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const date = parseApiDate(value);
  if (!date) return "-";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}
