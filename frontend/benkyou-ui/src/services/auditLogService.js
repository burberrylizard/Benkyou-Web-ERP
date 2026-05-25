import { apiRequest } from "../api/client";

export function getAuditLogs() {
  return apiRequest("auditlogs");
}
