import { apiRequest } from "../api/client";

export function getDashboardSummary() {
  return apiRequest("dashboard/summary");
}

export function getPlatformAnalytics() {
  return apiRequest("dashboard/platform-analytics");
}

export function getAnalytics() {
  return apiRequest("dashboard/analytics");
}
